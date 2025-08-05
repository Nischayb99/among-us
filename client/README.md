# Among Us MVP - Complete Real-time Multiplayer Game

A fully functional Among Us-inspired multiplayer game built with modern web technologies. Features real-time gameplay, role assignment, task completion, voting mechanics, and complete win/lose conditions.

## 🎮 Features

✅ **Real-time Multiplayer**: Up to 10 players per room with WebSocket communication  
✅ **Role Assignment**: Automatic Crewmate/Impostor distribution based on player count  
✅ **Live Movement**: Smooth WASD/Arrow key controls with 60fps updates  
✅ **Task System**: Interactive task completion system for Crewmates  
✅ **Kill Mechanism**: Impostors can eliminate nearby players  
✅ **Meeting System**: Body reporting and emergency meetings  
✅ **Voting System**: Democratic player ejection with tie-breaking  
✅ **Win Conditions**: Task completion or impostor elimination victory  
✅ **Responsive UI**: Modern, clean interface with Tailwind CSS  
✅ **Modular Architecture**: Scalable codebase for easy expansion  

## 🏗️ Architecture Overview

### Backend (Node.js + ES Modules)
- **Express Server**: RESTful API with health checks and stats
- **Socket.io**: Real-time bidirectional communication
- **MVC Pattern**: Controllers, Models, and organized business logic
- **Game Logic**: Authoritative server prevents cheating
- **Memory Storage**: Fast in-memory game state management

### Frontend (React + Hooks)
- **Custom Hooks**: `useSocket`, `useGame` for state management
- **Component Architecture**: Modular, reusable UI components
- **Real-time Updates**: Live game state synchronization
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
```bash
node -v  # Requires Node.js 16+
npm -v   # NPM package manager
```

### 1. Backend Setup
```bash
# Create backend directory
mkdir among-us-mvp && cd among-us-mvp
mkdir backend && cd backend

# Initialize and install dependencies
npm init -y
npm install express socket.io cors

# Optional: Development dependencies
npm install -D nodemon

# Copy all backend files from the artifacts above
# Make sure to set "type": "module" in package.json

# Start the server
npm start
# or for development:
npm run dev
```

**Backend Structure:**
```
backend/
├── package.json (with "type": "module")
├── server.js
├── controllers/
│   ├── gameController.js
│   └── roomController.js
├── models/
│   ├── Game.js
│   ├── Player.js
│   └── Room.js
├── utils/
│   ├── gameLogic.js
│   └── constants.js
└── socket/
    └── socketHandlers.js
```

### 2. Frontend Setup
```bash
# Navigate to project root and create frontend
cd .. # from backend directory
mkdir frontend && cd frontend

# Create Vite React app
npm create vite@latest . -- --template react

# Install additional dependencies
npm install socket.io-client

# Install and configure Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Copy all frontend files from the artifacts above
# Start the development server
npm run dev
```

**Frontend Structure:**
```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── Lobby/
    │   │   ├── Lobby.jsx
    │   │   └── PlayerList.jsx
    │   ├── Game/
    │   │   ├── GameBoard.jsx
    │   │   ├── Player.jsx
    │   │   ├── TaskPanel.jsx
    │   │   └── GameUI.jsx
    │   ├── Meeting/
    │   │   ├── VotingScreen.jsx
    │   │   └── VoteButton.jsx
    │   └── Common/
    │       ├── Button.jsx
    │       └── Modal.jsx
    ├── hooks/
    │   ├── useSocket.js
    │   └── useGame.js
    ├── utils/
    │   ├── constants.js
    │   └── helpers.js
    └── styles/
        └── index.css
```

### 3. Running the Game
```bash
# Terminal 1: Start Backend (from backend directory)
npm start

# Terminal 2: Start Frontend (from frontend directory)  
npm run dev

# Open multiple browser tabs to test multiplayer:
# http://localhost:5173
```

## 🎯 How to Play

### Getting Started
1. **Enter your name** on the main menu
2. **Create a room** or **join with a room code**
3. **Wait for players** to join (2-10 players)
4. **Host starts the game** when ready

### Gameplay

#### As a Crewmate 🔧
- **Objective**: Complete all tasks OR identify and vote out all impostors
- **Movement**: Use WASD or Arrow keys to move around
- **Tasks**: Approach yellow task markers and click "Complete Task"
- **Reporting**: Click on dead bodies (💀) to report and call a meeting
- **Meetings**: Discuss and vote to eject suspected impostors

#### As an Impostor 🔪
- **Objective**: Kill crewmates without being caught
- **Killing**: Get close to crewmates and click "Kill [Name]"
- **Deception**: Pretend to do tasks and blend in with crewmates
- **Meetings**: Participate in discussions and voting to avoid suspicion

#### Meetings & Voting
- **Emergency Meetings**: Called when dead bodies are reported
- **Discussion**: All alive players can discuss (no built-in chat in MVP)
- **Voting**: Each alive player votes to eject someone or skip
- **Ejection**: Player with most votes gets eliminated (ties result in no ejection)

### Win Conditions
- **Crewmates Win**: Complete all tasks OR vote out all impostors
- **Impostors Win**: Kill enough crewmates to equal/outnumber them

## 🔧 Configuration

### Server Configuration (backend/utils/constants.js)
```javascript
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,        // Minimum players to start
  MAX_PLAYERS: 10,       // Maximum room capacity
  IMPOSTOR_RATIO: 0.25,  // 25% of players become impostors
  KILL_RANGE: 50,        // Kill distance in pixels
  TASK_RANGE: 40,        // Task interaction range
  TOTAL_TASKS: 5,        // Tasks per crewmate
  // ... more config options
};
```

### Client Configuration (frontend/utils/constants.js)
```javascript
export const GAME_CONFIG = {
  SERVER_URL: 'http://localhost:3001',  // Backend server URL
  MAP_WIDTH: 800,         // Game map dimensions
  MAP_HEIGHT: 600,
  MOVE_SPEED: 3,          // Player movement speed
  UPDATE_RATE: 16,        // ~60fps update rate
};
```

## 🌐 API Endpoints

### Backend Health & Stats
```bash
# Health check
GET http://localhost:3001/health

# Game statistics
GET http://localhost:3001/stats
```

### Socket Events
#### Client → Server
- `create-room` - Create new game room
- `join-room` - Join existing room
- `start-game` - Begin game (host only)
- `player-move` - Update player position
- `kill-player` - Attempt to kill target
- `complete-task` - Complete a task
- `report-body` - Report dead body
- `vote` - Cast vote in meeting

#### Server → Client
- `room-created` - Room creation confirmation
- `game-started` - Game begins with role assignment
- `player-moved` - Other player position update
- `player-killed` - Player elimination notification
- `meeting-called` - Emergency meeting started
- `voting-complete` - Meeting results
- `game-ended` - Game over with win condition

## 🛠️ Development

### Adding New Features

#### New Game Modes
1. Modify game logic in `backend/utils/gameLogic.js`
2. Update win conditions in `Room.js`
3. Add new socket events as needed

#### Custom Maps
1. Update `TASK_LOCATIONS` in `constants.js`
2. Modify task generation in `gameLogic.js`
3. Update frontend map rendering

#### Additional Roles
1. Add role constants in `constants.js`
2. Extend role assignment logic
3. Create role-specific UI components
4. Update win condition calculations

### Code Quality
- **ESLint**: Configured for consistent code style
- **ES Modules**: Modern JavaScript imports/exports
- **Error Handling**: Comprehensive error catching and user feedback
- **Type Safety**: JSDoc comments for better IDE support

### Performance Optimizations
- **Throttled Updates**: 60fps movement with minimal network overhead
- **Memory Management**: Automatic cleanup of inactive rooms
- **Efficient Rendering**: Optimized React re-renders with proper keys

## 🚀 Production Deployment

### Backend Deployment
```bash
# Set production environment
export NODE_ENV=production
export PORT=3001

# Install production dependencies only
npm ci --only=production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "among-us-backend"
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files (example with serve)
npx serve dist -s

# Or deploy to Vercel/Netlify/AWS S3
```

### Environment Variables
```bash
# Backend .env
PORT=3001
NODE_ENV=production
ADMIN_IDS=admin-socket-id-1,admin-socket-id-2

# Frontend (update constants.js)
VITE_SERVER_URL=https://your-backend-domain.com
```

## 🐛 Troubleshooting

### Common Issues

**Connection Problems**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Verify CORS settings in server.js
# Update frontend SERVER_URL in constants.js
```

**Game State Issues**
```bash
# Check browser console for errors
# Verify socket event names match between client/server
# Test with multiple browser tabs/devices
```

**Performance Issues**
```bash
# Monitor server logs for errors
# Check network tab for excessive requests
# Verify game cleanup is working properly
```

### Debug Mode
```javascript
// Enable socket debug logging (client)
localStorage.debug = 'socket.io-client:socket';

// Server logging
console.log('Game state:', game.getStats());
```

## 📊 Game Statistics

Access real-time game statistics:
- **Active Rooms**: Current game lobbies
- **Connected Players**: Total online users  
- **Games in Progress**: Active gameplay sessions
- **Server Uptime**: System health metrics

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make your changes** with proper tests
4. **Commit changes**: `git commit -m 'Add new feature'`
5. **Push to branch**: `git push origin feature/new-feature`
6. **Create Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Add JSDoc comments for new functions
- Test multiplayer features with multiple clients
- Update README for new features

## 📝 License

MIT License - Feel free to modify and distribute this project.

## 🎉 Acknowledgments

- Inspired by the original **Among Us** game by InnerSloth
- Built with modern web technologies for educational purposes
- Thanks to the open-source community for excellent tools and libraries

---

**🚀 Ready to play Among Us MVP? Start your servers and gather your crew! 👨‍🚀👩‍🚀**

### Quick Commands Summary
```bash
# Backend
cd backend && npm install && npm start

# Frontend  
cd frontend && npm install && npm run dev

# Play
# Open http://localhost:5173 in multiple browser tabs
```