import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Game } from './models/Game.js';
import { SocketHandlers } from './socket/socketHandlers.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite dev server
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Initialize game instance
const game = new Game();
const socketHandlers = new SocketHandlers(game, io);

// Health check endpoint
app.get('/health', (req, res) => {
    const stats = game.getStats();
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats
    });
});

// Game stats endpoint
app.get('/stats', (req, res) => {
    const stats = game.getStats();
    const connectionStats = socketHandlers.getConnectionStats();

    res.json({
        ...stats,
        ...connectionStats,
        uptime: process.uptime()
    });
});

// Socket connection handling
io.on('connection', (socket) => {
    socketHandlers.handleConnection(socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Among Us MVP Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Game stats: http://localhost:${PORT}/stats`);
});// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');

    // Notify all connected clients
    socketHandlers.broadcastSystemMessage('Server is shutting down...');

    // Close server
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');

    // Notify all connected clients
    socketHandlers.broadcastSystemMessage('Server is shutting down...');

    // Close server
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});