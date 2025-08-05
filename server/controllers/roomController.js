import { SOCKET_EVENTS, ERROR_MESSAGES, GAME_STATES } from '../utils/constants.js';
import { GameLogic } from '../utils/gameLogic.js';

export class RoomController {
    constructor(game, io) {
        this.game = game;
        this.io = io;
    }

    createRoom(socket, playerName) {
        try {
            const sanitizedName = GameLogic.sanitizePlayerName(playerName);

            if (!GameLogic.validatePlayerName(sanitizedName)) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid player name' });
                return;
            }

            const { room, host } = this.game.createRoom(socket.id, sanitizedName);

            socket.join(room.code);

            socket.emit(SOCKET_EVENTS.ROOM_CREATED, {
                roomCode: room.code,
                isHost: true
            });

            socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
                roomCode: room.code,
                players: room.getAllPlayers().map(p => p.toJSON()),
                isHost: true
            });

            console.log(`Room created: ${room.code} by ${sanitizedName}`);

        } catch (error) {
            console.error('Create room error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    joinRoom(socket, { roomCode, playerName }) {
        try {
            const sanitizedName = GameLogic.sanitizePlayerName(playerName);
            const sanitizedRoomCode = roomCode.trim().toUpperCase();

            if (!GameLogic.validatePlayerName(sanitizedName)) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid player name' });
                return;
            }

            const { room, player } = this.game.joinRoom(sanitizedRoomCode, socket.id, sanitizedName);

            socket.join(room.code);

            socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
                roomCode: room.code,
                players: room.getAllPlayers().map(p => p.toJSON()),
                isHost: room.hostId === socket.id
            });

            // Notify other players
            socket.to(room.code).emit(SOCKET_EVENTS.PLAYER_JOINED, {
                player: player.toJSON(),
                players: room.getAllPlayers().map(p => p.toJSON())
            });

            console.log(`${sanitizedName} joined room: ${room.code}`);

        } catch (error) {
            console.error('Join room error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, {
                message: error.message === 'Room not found' ? ERROR_MESSAGES.ROOM_NOT_FOUND : error.message
            });
        }
    }

    leaveRoom(socket) {
        try {
            const player = this.game.getPlayer(socket.id);

            if (player) {
                const room = this.game.getRoom(player.roomCode);

                if (room) {
                    this.game.removePlayer(socket.id);
                    socket.leave(room.code);

                    if (!room.isEmpty()) {
                        // Notify other players
                        socket.to(room.code).emit(SOCKET_EVENTS.PLAYER_LEFT, {
                            playerId: socket.id,
                            players: room.getAllPlayers().map(p => p.toJSON()),
                            newHost: room.hostId
                        });

                        // Check win conditions if game is active
                        if (room.gameState === GAME_STATES.PLAYING) {
                            const winResult = room.checkWinConditions();
                            if (winResult) {
                                room.endGame(winResult);
                                this.io.to(room.code).emit(SOCKET_EVENTS.GAME_ENDED, winResult);
                            }
                        }
                    }

                    console.log(`${player.name} left room: ${room.code}`);
                }
            }
        } catch (error) {
            console.error('Leave room error:', error);
        }
    }

    getRoomInfo(socket, roomCode) {
        try {
            const room = this.game.getRoom(roomCode);

            if (!room) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.ROOM_NOT_FOUND });
                return;
            }

            socket.emit('room-info', room.toJSON());

        } catch (error) {
            console.error('Get room info error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }

    listRooms(socket) {
        try {
            const rooms = Array.from(this.game.rooms.values())
                .filter(room => room.gameState === GAME_STATES.LOBBY)
                .map(room => ({
                    code: room.code,
                    playerCount: room.players.size,
                    maxPlayers: 10,
                    hostName: room.players.get(room.hostId)?.name || 'Unknown'
                }));

            socket.emit('room-list', rooms);

        } catch (error) {
            console.error('List rooms error:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
        }
    }
}