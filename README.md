# Among Us MVP - Real-time Multiplayer Game

A complete Among Us-inspired multiplayer game built with React, Node.js, and Socket.io.

## 🎮 Features

- **Real-time Multiplayer**: Up to 10 players per room
- **Role Assignment**: Automatic Crewmate/Impostor distribution
- **Live Movement**: WASD/Arrow key controls with real-time sync
- **Task System**: Interactive tasks for Crewmates
- **Kill Mechanism**: Impostors can eliminate players
- **Meeting System**: Body reporting triggers voting sessions
- **Win Conditions**: Task completion or impostor elimination

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### 1. Clone/Create Project Structure

```bash
mkdir among-us-mvp
cd among-us-mvp
```

### 2. Backend Setup

```bash
mkdir backend
cd backend

# Create package.json
npm init -y

# Install dependencies
npm install express socket.io cors

# Optional: Install nodemon for development
npm install -D nodemon

# Copy the server.js file content
# Then start the server
npm start
# or for development:
npx nodemon server.js
```

### 3. Frontend Setup

```bash
cd ../
mkdir frontend
cd frontend

# Create Vite React app
npm create vite@latest . -- --template react

# Install additional dependencies
npm install socket.io-client

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Copy all the component files and configurations
# Then start the frontend
npm run dev
```

## 📁 Project Structure

```
among-us-mvp/
├── backend/
│   ├── package.json
│   └── server.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── components/
        │   ├── Lobby/
        │   │   └── Lobby.jsx
        │   ├── Game/
        │   │   ├── GameBoard.jsx
        │   │   ├── Player.jsx
        │   │   ├── TaskPanel.jsx
        │   │   └── GameUI.jsx
        │   ├── Meeting/
        │   │   └── VotingScreen.jsx
        │   └── Common/
        │       └── Modal.jsx
        └── styles/
            └── index.css
```

## 🎯 How to Play

### Joining a Game

1. Enter your name on the main menu
2. Create a room or join with a room code
3. Wait for the host to start the game

### As a Crewmate 🔧

- **Objective**: Complete all tasks or identify impostors
- **Movement**: Use WASD or Arrow keys
- **Tasks**: Approach yellow task markers and click "Complete Task"
- **Reporting**: Click on dead bodies to call a meeting
- **Voting**: Vote to eject suspected impostors

### As an Impostor 🔪

- **Objective**: Kill crewmates without being caught
- **Killing**: Get close to crewmates and click "Kill"
- **Sabotage**: Blend in and avoid suspicion
- **Meetings**: Participate in voting to avoid detection

### Meetings

- Triggered when a body is reported
- All alive players can vote
- Player with most votes gets ejected
- Skip voting is allowed

## 🔧 Game Configuration

### Server Settings (server.js)

```javascript
const GAME_STATES = {
  LOBBY: "lobby",
  PLAYING: "playing",
  MEETING: "meeting",
  ENDED: "ended",
};

// Modify these values:
const impostorRatio = 0.25; // 25% of players
const killRange = 50; // pixels
const taskRange = 40; // pixels
const totalTasks = 5; // per crewmate
```

### Client Settings

- Server URL: `http://localhost:3001` (modify in App.jsx)
- Movement speed: 3 pixels per frame
- Update rate: ~60fps

## 🌐 Network Architecture

### Socket Events

#### Client → Server

- `create-room` - Create new game room
- `join-room` - Join existing room
- `start-game` - Begin game (host only)
- `player-move` - Update position
- `kill-player` - Attempt kill
- `complete-task` - Finish task
- `report-body` - Call meeting
- `vote` - Cast vote

#### Server → Client

- `room-created` - Room successfully created
- `room-joined` - Successfully joined room
- `game-started` - Game began with role assignment
- `player-moved` - Other player position update
- `player-killed` - Player elimination
- `meeting-called` - Emergency meeting started
- `voting-complete` - Meeting results
- `game-ended` - Win condition met

## 🛠️ Development

### Running in Development Mode

Terminal 1 (Backend):

```bash
cd backend
npx nodemon server.js
```

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```

### Code Structure

#### Backend (server.js)

- Express server with Socket.io
- In-memory game state storage
- Authoritative game logic
- Real-time event broadcasting

#### Frontend Components

- **App.jsx**: Main application state
- **Lobby.jsx**: Pre-game room management
- **GameBoard.jsx**: Main game interface
- **Player.jsx**: Player rendering
- **TaskPanel.jsx**: Task interface
- **VotingScreen.jsx**: Meeting interface
- **Modal.jsx**: Reusable modal component

### Key Features Implementation

#### Real-time Movement

```javascript
// Client sends position updates
socket.emit("player-move", { x: newX, y: newY });

// Server broadcasts to room
socket.to(roomCode).emit("player-moved", { playerId, position });
```

#### Role Assignment

```javascript
function assignRoles(room) {
  const players = Array.from(room.players.values());
  const impostorCount = Math.max(1, Math.floor(players.length / 4));
  // Random assignment logic...
}
```

#### Win Condition Checking

```javascript
function checkWinConditions(room) {
  // Check impostor vs crewmate ratios
  // Check task completion
  // Return winner or null
}
```

## 🚀 Production Deployment

### Backend Deployment

```bash
# Set environment variables
export PORT=3001
export NODE_ENV=production

# Start server
npm start
```

### Frontend Deployment

```bash
# Build for production
npm run build

# Serve static files
npx serve dist
```

### Environment Variables

```bash
# Backend
PORT=3001
NODE_ENV=production

# Frontend (update App.jsx)
VITE_SERVER_URL=https://your-backend-url.com
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection Failed**

   - Check if backend server is running on port 3001
   - Verify CORS settings in server.js
   - Update server URL in App.jsx

2. **Players Not Moving**

   - Check browser console for WebSocket errors
   - Verify socket event names match server
   - Test keyboard event listeners

3. **Game State Sync Issues**
   - Check server logs for error messages
   - Verify all socket events are properly handled
   - Test with multiple browser tabs

### Debug Mode

Add logging to track issues:

```javascript
// Client side
socket.on("connect", () => console.log("Connected:", socket.id));

// Server side
console.log("Room state:", rooms.get(roomCode));
```

## 🎨 Customization

### Adding New Features

1. **New Game Modes**: Modify game logic in server.js
2. **Custom Maps**: Add new task locations and obstacles
3. **Additional Roles**: Extend role assignment system
4. **Power-ups**: Add temporary abilities
5. **Chat System**: Implement text communication

### UI Customization

- Modify Tailwind classes for different themes
- Add animations and transitions
- Create custom player avatars
- Implement sound effects

## 📝 License

MIT License - Feel free to modify and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

---

**Enjoy playing Among Us MVP! 🚀👨‍🚀**
