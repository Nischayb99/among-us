import { SOCKET_EVENTS } from '../utils/constants.js';
import { RoomController } from '../controllers/roomController.js';
import { GameController } from '../controllers/gameController.js';

export class SocketHandlers {
    constructor(game, io) {
        this.game = game;
        this.io = io;
        this.roomController = new RoomController(game, io);
        this.gameController = new GameController(game, io);
    }

    handleConnection(socket) {
        console.log('Player connected:', socket.id);

        // Room management events
        socket.on(SOCKET_EVENTS.CREATE_ROOM, (playerName) => {
            this.roomController.createRoom(socket, playerName);
        });

        socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
            this.roomController.joinRoom(socket, data);
        });

        socket.on('leave-room', () => {
            this.roomController.leaveRoom(socket);
        });

        socket.on('get-room-info', (roomCode) => {
            this.roomController.getRoomInfo(socket, roomCode);
        });

        socket.on('list-rooms', () => {
            this.roomController.listRooms(socket);
        });

        // Game control events
        socket.on(SOCKET_EVENTS.START_GAME, () => {
            this.gameController.startGame(socket);
        });

        socket.on('get-game-state', () => {
            this.gameController.getGameState(socket);
        });

        // Gameplay events
        socket.on(SOCKET_EVENTS.PLAYER_MOVE, (position) => {
            this.gameController.playerMove(socket, position);
        });

        socket.on(SOCKET_EVENTS.KILL_PLAYER, (targetId) => {
            this.gameController.killPlayer(socket, targetId);
        });

        socket.on(SOCKET_EVENTS.COMPLETE_TASK, () => {
            this.gameController.completeTask(socket);
        });

        socket.on(SOCKET_EVENTS.REPORT_BODY, (bodyInfo) => {
            this.gameController.reportBody(socket, bodyInfo);
        });

        socket.on('emergency-meeting', () => {
            this.gameController.emergencyMeeting(socket);
        });

        // Meeting events
        socket.on(SOCKET_EVENTS.VOTE, (targetId) => {
            this.gameController.castVote(socket, targetId);
        });

        // Impostor events
        socket.on('sabotage', (sabotageType) => {
            this.gameController.sabotage(socket, sabotageType);
        });

        // Utility events
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        socket.on('get-stats', () => {
            const stats = this.game.getStats();
            socket.emit('stats', stats);
        });

        // Admin events (for debugging)
        socket.on('admin-rooms', () => {
            if (this.isAdmin(socket)) {
                const rooms = Array.from(this.game.rooms.values()).map(r => r.toJSON());
                socket.emit('admin-rooms-data', rooms);
            }
        });

        // Disconnect handling
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });

        // Error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }

    handleDisconnect(socket) {
        console.log('Player disconnected:', socket.id);

        try {
            this.roomController.leaveRoom(socket);
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
    }

    isAdmin(socket) {
        // Simple admin check - in production, implement proper authentication
        const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
        return adminIds.includes(socket.id);
    }

    // Broadcast system messages
    broadcastSystemMessage(message) {
        this.io.emit('system-message', {
            message,
            timestamp: Date.now()
        });
    }

    // Handle server maintenance
    handleMaintenance() {
        this.broadcastSystemMessage('Server maintenance in 5 minutes. Please finish your games.');

        setTimeout(() => {
            this.broadcastSystemMessage('Server maintenance in 1 minute.');
        }, 4 * 60 * 1000);

        setTimeout(() => {
            this.broadcastSystemMessage('Server going down for maintenance.');

            // Gracefully disconnect all clients
            setTimeout(() => {
                this.io.disconnectSockets();
            }, 10000);
        }, 5 * 60 * 1000);
    }

    // Get connection statistics
    getConnectionStats() {
        return {
            connectedClients: this.io.engine.clientsCount,
            rooms: Array.from(this.io.sockets.adapter.rooms.keys()).length,
            gameRooms: this.game.rooms.size,
            activePlayers: this.game.players.size
        };
    }
}