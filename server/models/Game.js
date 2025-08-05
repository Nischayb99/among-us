import { Room } from './Room.js';
import { Player } from './Player.js';

export class Game {
    constructor() {
        this.rooms = new Map();
        this.players = new Map();
        this.cleanupInterval = null;
        this.startCleanup();
    }

    generateRoomCode() {
        let code;
        do {
            code = Math.random().toString(36).substring(2, 8).toUpperCase();
        } while (this.rooms.has(code));
        return code;
    }

    createRoom(hostId, hostName) {
        const roomCode = this.generateRoomCode();
        const room = new Room(roomCode, hostId);
        const host = new Player(hostId, hostName, roomCode);

        room.addPlayer(host);
        this.rooms.set(roomCode, room);
        this.players.set(hostId, host);

        return { room, host };
    }

    joinRoom(roomCode, playerId, playerName) {
        const room = this.rooms.get(roomCode);

        if (!room) {
            throw new Error('Room not found');
        }

        const player = new Player(playerId, playerName, roomCode);
        room.addPlayer(player);
        this.players.set(playerId, player);

        return { room, player };
    }

    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);

        if (player) {
            const room = this.rooms.get(player.roomCode);

            if (room) {
                room.removePlayer(playerId);

                // Remove empty rooms
                if (room.isEmpty()) {
                    this.rooms.delete(room.code);
                }
            }

            this.players.delete(playerId);
        }

        return player;
    }

    movePlayer(playerId, position) {
        const player = this.getPlayer(playerId);

        if (player) {
            player.updatePosition(position.x, position.y);
            return true;
        }

        return false;
    }

    killPlayer(killerId, targetId) {
        const killer = this.getPlayer(killerId);
        const target = this.getPlayer(targetId);

        if (!killer || !target) {
            return { success: false, error: 'Player not found' };
        }

        const room = this.getRoom(killer.roomCode);

        if (!room || room.gameState !== 'playing') {
            return { success: false, error: 'Invalid game state' };
        }

        if (killer.canKill(target)) {
            target.kill();
            room.addDeadBody(targetId, target.position);

            return {
                success: true,
                body: { playerId: targetId, position: target.position }
            };
        }

        return { success: false, error: 'Cannot kill target' };
    }

    completeTask(playerId) {
        const player = this.getPlayer(playerId);

        if (player && player.completeTask()) {
            return { success: true, tasksCompleted: player.tasksCompleted };
        }

        return { success: false };
    }

    reportBody(reporterId, bodyInfo) {
        const reporter = this.getPlayer(reporterId);

        if (!reporter) {
            return { success: false, error: 'Reporter not found' };
        }

        const room = this.getRoom(reporter.roomCode);

        if (!room || room.gameState !== 'playing') {
            return { success: false, error: 'Invalid game state' };
        }

        room.startMeeting(reporterId, 'body-reported');

        return {
            success: true,
            meeting: {
                callerId: reporterId,
                reason: 'body-reported',
                players: room.getAllPlayers().map(p => p.toJSON())
            }
        };
    }

    castVote(voterId, targetId) {
        const voter = this.getPlayer(voterId);

        if (!voter) {
            return { success: false, error: 'Voter not found' };
        }

        const room = this.getRoom(voter.roomCode);

        if (!room || room.gameState !== 'meeting') {
            return { success: false, error: 'No active meeting' };
        }

        if (room.castVote(voterId, targetId)) {
            const alivePlayers = room.getAlivePlayers();
            const votedPlayers = alivePlayers.filter(p => p.hasVoted);

            if (room.isVotingComplete()) {
                const result = room.processVotes();
                return {
                    success: true,
                    complete: true,
                    result
                };
            }

            return {
                success: true,
                complete: false,
                voted: votedPlayers.length,
                total: alivePlayers.length
            };
        }

        return { success: false, error: 'Cannot cast vote' };
    }

    startCleanup() {
        // Clean up inactive rooms every 5 minutes
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();

            for (const [roomCode, room] of this.rooms) {
                if (!room.isActive()) {
                    // Remove all players from inactive room
                    for (const player of room.getAllPlayers()) {
                        this.players.delete(player.id);
                    }

                    this.rooms.delete(roomCode);
                    console.log(`Cleaned up inactive room: ${roomCode}`);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    getStats() {
        return {
            totalRooms: this.rooms.size,
            totalPlayers: this.players.size,
            activeGames: Array.from(this.rooms.values()).filter(r => r.gameStarted).length
        };
    }
}