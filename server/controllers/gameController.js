import { SOCKET_EVENTS, ERROR_MESSAGES, GAME_STATES } from '../utils/constants.js';
import { GameLogic } from '../utils/gameLogic.js';

export class GameController {
    constructor(game, io) {
        this.game = game;
        this.io = io;
    }

    startGame(socket) {
        try {
            const player = this.game.getPlayer(socket.id);

            if (!player) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.PLAYER_NOT_FOUND });
                return;
            }

            const room = this.game.getRoom(player.roomCode);

            if (!room) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
                return;
            }

            if (room.hostId !== socket.id) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.NOT_HOST });
                return;
            }

            if (!room.canStartGame()) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.INSUFFICIENT_PLAYERS });
                return;
            }

            room.startGame();

            // Send game start to all players with their roles
            room.getAllPlayers().forEach((p) => {
                this.io.to(p.id).emit(SOCKET_EVENTS.GAME_STARTED, {
                    role: p.role,
                    players: room.getAllPlayers().map(pl => pl.toJSON()),
                    gameState: room.gameState,
                    tasks: GameLogic.generateTaskLocations()
                });
            });

            console.log(`Game started in room: ${room.code}`);

        } catch (error) {
            console.error('Start game error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    playerMove(socket, position) {
        try {
            const player = this.game.getPlayer(socket.id);

            if (!player) return;

            const room = this.game.getRoom(player.roomCode);

            if (!room || room.gameState !== GAME_STATES.PLAYING) return;

            // Validate and sanitize position
            const validatedPosition = GameLogic.validatePosition(position);

            if (this.game.movePlayer(socket.id, validatedPosition)) {
                // Broadcast to other players in room
                socket.to(player.roomCode).emit(SOCKET_EVENTS.PLAYER_MOVED, {
                    playerId: socket.id,
                    position: validatedPosition
                });
            }

        } catch (error) {
            console.error('Player move error:', error);
        }
    }

    killPlayer(socket, targetId) {
        try {
            const result = this.game.killPlayer(socket.id, targetId);

            if (result.success) {
                const killer = this.game.getPlayer(socket.id);
                const room = this.game.getRoom(killer.roomCode);

                // Notify all players in room
                this.io.to(killer.roomCode).emit(SOCKET_EVENTS.PLAYER_KILLED, {
                    killedPlayer: targetId,
                    body: result.body
                });

                console.log(`Player ${targetId} killed by ${socket.id} in room ${killer.roomCode}`);

                // Check win conditions
                const winResult = room.checkWinConditions();
                if (winResult) {
                    room.endGame(winResult);
                    this.io.to(killer.roomCode).emit(SOCKET_EVENTS.GAME_ENDED, winResult);
                }
            }

        } catch (error) {
            console.error('Kill player error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    completeTask(socket) {
        try {
            const result = this.game.completeTask(socket.id);

            if (result.success) {
                const player = this.game.getPlayer(socket.id);
                const room = this.game.getRoom(player.roomCode);

                socket.emit(SOCKET_EVENTS.TASK_COMPLETED, {
                    tasksCompleted: result.tasksCompleted
                });

                console.log(`Task completed by ${socket.id} in room ${player.roomCode}`);

                // Check win condition
                const winResult = room.checkWinConditions();
                if (winResult) {
                    room.endGame(winResult);
                    this.io.to(player.roomCode).emit(SOCKET_EVENTS.GAME_ENDED, winResult);
                }
            }

        } catch (error) {
            console.error('Complete task error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    reportBody(socket, bodyInfo) {
        try {
            const result = this.game.reportBody(socket.id, bodyInfo);

            if (result.success) {
                const reporter = this.game.getPlayer(socket.id);

                this.io.to(reporter.roomCode).emit(SOCKET_EVENTS.MEETING_CALLED, result.meeting);

                console.log(`Body reported by ${socket.id} in room ${reporter.roomCode}`);
            }

        } catch (error) {
            console.error('Report body error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    castVote(socket, targetId) {
        try {
            const result = this.game.castVote(socket.id, targetId);

            if (result.success) {
                const voter = this.game.getPlayer(socket.id);
                const room = this.game.getRoom(voter.roomCode);

                if (result.complete) {
                    // Voting is complete, process results
                    this.io.to(voter.roomCode).emit(SOCKET_EVENTS.VOTING_COMPLETE, result.result);

                    console.log(`Voting completed in room ${voter.roomCode}:`, result.result);

                    // Check win conditions after ejection
                    setTimeout(() => {
                        const winResult = room.checkWinConditions();
                        if (winResult) {
                            room.endGame(winResult);
                            this.io.to(voter.roomCode).emit(SOCKET_EVENTS.GAME_ENDED, winResult);
                        }
                    }, 1000);

                } else {
                    // Vote cast, waiting for others
                    this.io.to(voter.roomCode).emit(SOCKET_EVENTS.VOTE_CAST, {
                        voterId: socket.id,
                        voted: result.voted,
                        total: result.total
                    });
                }
            }

        } catch (error) {
            console.error('Cast vote error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    emergencyMeeting(socket) {
        try {
            const player = this.game.getPlayer(socket.id);

            if (!player) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.PLAYER_NOT_FOUND });
                return;
            }

            const room = this.game.getRoom(player.roomCode);

            if (!room || room.gameState !== GAME_STATES.PLAYING) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot call meeting now' });
                return;
            }

            if (!player.isAlive()) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Dead players cannot call meetings' });
                return;
            }

            room.startMeeting(socket.id, 'emergency');

            this.io.to(player.roomCode).emit(SOCKET_EVENTS.MEETING_CALLED, {
                callerId: socket.id,
                reason: 'emergency',
                players: room.getAllPlayers().map(p => p.toJSON())
            });

            console.log(`Emergency meeting called by ${socket.id} in room ${player.roomCode}`);

        } catch (error) {
            console.error('Emergency meeting error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    getGameState(socket) {
        try {
            const player = this.game.getPlayer(socket.id);

            if (!player) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.PLAYER_NOT_FOUND });
                return;
            }

            const room = this.game.getRoom(player.roomCode);

            if (!room) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
                return;
            }

            socket.emit('game-state', {
                room: room.toJSON(),
                player: player.toJSON(),
                tasks: GameLogic.generateTaskLocations()
            });

        } catch (error) {
            console.error('Get game state error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    sabotage(socket, sabotageType) {
        try {
            const player = this.game.getPlayer(socket.id);

            if (!player || !player.isImpostor() || !player.isAlive()) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot sabotage' });
                return;
            }

            const room = this.game.getRoom(player.roomCode);

            if (!room || room.gameState !== GAME_STATES.PLAYING) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot sabotage now' });
                return;
            }

            // Broadcast sabotage to all players
            this.io.to(player.roomCode).emit('sabotage-activated', {
                type: sabotageType,
                saboteur: socket.id
            });

            console.log(`Sabotage ${sabotageType} activated by ${socket.id} in room ${player.roomCode}`);

        } catch (error) {
            console.error('Sabotage error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }
}