export const GAME_STATES = {
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

export const GAME_CONFIG = {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 10,
    IMPOSTOR_RATIO: 0.25,
    KILL_RANGE: 50,
    TASK_RANGE: 40,
    TOTAL_TASKS: 5,
    MOVE_SPEED: 3,
    MAP_WIDTH: 800,
    MAP_HEIGHT: 600
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

export const ERROR_MESSAGES = {
    ROOM_NOT_FOUND: 'Room not found',
    GAME_IN_PROGRESS: 'Game already in progress',
    INSUFFICIENT_PLAYERS: 'Need at least 2 players to start',
    PLAYER_NOT_FOUND: 'Player not found',
    INVALID_ACTION: 'Invalid action',
    NOT_HOST: 'Only host can perform this action'
};