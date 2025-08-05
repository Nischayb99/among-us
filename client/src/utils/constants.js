export const GAME_STATES = {
    MENU: 'menu',
    LOBBY: 'lobby',
    PLAYING: 'playing',
    MEETING: 'meeting',
    ENDED: 'ended'
};

export const ROLES = {
    CREWMATE: 'crewmate',
    IMPOSTOR: 'impostor'
};

export const PLAYER_STATES = {
    ALIVE: 'alive',
    DEAD: 'dead'
};

export const SOCKET_EVENTS = {
    // Client to Server
    CREATE_ROOM: 'create-room',
    JOIN_ROOM: 'join-room',
    START_GAME: 'start-game',
    PLAYER_MOVE: 'player-move',
    KILL_PLAYER: 'kill-player',
    COMPLETE_TASK: 'complete-task',
    REPORT_BODY: 'report-body',
    VOTE: 'vote',

    // Server to Client
    ROOM_CREATED: 'room-created',
    ROOM_JOINED: 'room-joined',
    PLAYER_JOINED: 'player-joined',
    PLAYER_LEFT: 'player-left',
    GAME_STARTED: 'game-started',
    PLAYER_MOVED: 'player-moved',
    PLAYER_KILLED: 'player-killed',
    MEETING_CALLED: 'meeting-called',
    VOTE_CAST: 'vote-cast',
    VOTING_COMPLETE: 'voting-complete',
    GAME_ENDED: 'game-ended',
    TASK_COMPLETED: 'task-completed',
    ERROR: 'error'
};

export const GAME_CONFIG = {
    SERVER_URL: 'http://localhost:3001',
    MAP_WIDTH: 800,
    MAP_HEIGHT: 600,
    PLAYER_SIZE: 32,
    TASK_SIZE: 32,
    KILL_RANGE: 50,
    TASK_RANGE: 40,
    MOVE_SPEED: 3,
    UPDATE_RATE: 16 // ~60fps
};

export const COLORS = {
    CREWMATE: '#3b82f6',
    IMPOSTOR: '#ef4444',
    DEAD: '#6b7280',
    TASK: '#eab308',
    BACKGROUND: '#374151'
};

export const TASK_LOCATIONS = [
    { id: 1, name: 'Fix Wiring', x: 150, y: 150 },
    { id: 2, name: 'Empty Trash', x: 650, y: 200 },
    { id: 3, name: 'Fuel Engine', x: 500, y: 450 },
    { id: 4, name: 'Calibrate Distributor', x: 300, y: 400 },
    { id: 5, name: 'Scan Boarding Pass', x: 600, y: 350 },
    { id: 6, name: 'Clean O2 Filter', x: 200, y: 500 },
    { id: 7, name: 'Align Engine Output', x: 700, y: 100 },
    { id: 8, name: 'Submit Scan', x: 100, y: 300 }
];