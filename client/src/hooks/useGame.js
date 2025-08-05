import { useState, useEffect, useCallback } from 'react';
import { GAME_STATES, SOCKET_EVENTS } from '../utils/constants.js';
import { useSocket } from './useSocket.js';

export const useGame = () => {
    const { socket, isConnected, emit, on, off } = useSocket();

    // Game state
    const [gameState, setGameState] = useState(GAME_STATES.MENU);
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [players, setPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [error, setError] = useState('');
    const [gameResult, setGameResult] = useState(null);
    const [meetingInfo, setMeetingInfo] = useState(null);
    const [tasks, setTasks] = useState([]);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        const handleRoomCreated = ({ roomCode, isHost }) => {
            setRoomCode(roomCode);
            setIsHost(isHost);
            setGameState(GAME_STATES.LOBBY);
            setError('');
        };

        const handleRoomJoined = ({ roomCode, players, isHost }) => {
            setRoomCode(roomCode);
            setPlayers(players);
            setIsHost(isHost);
            setGameState(GAME_STATES.LOBBY);
            setError('');

            const player = players.find(p => p.id === socket.id);
            setCurrentPlayer(player);
        };

        const handlePlayerJoined = ({ players }) => {
            setPlayers(players);
        };

        const handlePlayerLeft = ({ players, newHost }) => {
            setPlayers(players);
            setIsHost(socket.id === newHost);
        };

        const handleGameStarted = ({ role, players, gameState, tasks }) => {
            setPlayers(players);
            setGameState(GAME_STATES.PLAYING);
            setTasks(tasks || []);

            const player = players.find(p => p.id === socket.id);
            setCurrentPlayer({ ...player, role });
        };

        const handlePlayerMoved = ({ playerId, position }) => {
            setPlayers(prev => prev.map(p =>
                p.id === playerId ? { ...p, position } : p
            ));
        };

        const handlePlayerKilled = ({ killedPlayer }) => {
            setPlayers(prev => prev.map(p =>
                p.id === killedPlayer ? { ...p, state: 'dead' } : p
            ));
        };

        const handleMeetingCalled = ({ callerId, reason, players }) => {
            setPlayers(players);
            setGameState(GAME_STATES.MEETING);
            setMeetingInfo({ callerId, reason });
        };

        const handleVotingComplete = ({ ejectedPlayer, tie }) => {
            if (!tie && ejectedPlayer) {
                setPlayers(prev => prev.map(p =>
                    p.id === ejectedPlayer ? { ...p, state: 'dead' } : p
                ));
            }

            setTimeout(() => {
                setGameState(GAME_STATES.PLAYING);
                setMeetingInfo(null);
            }, 3000);
        };

        const handleGameEnded = (result) => {
            setGameResult(result);
            setGameState(GAME_STATES.ENDED);
        };

        const handleTaskCompleted = ({ tasksCompleted }) => {
            setCurrentPlayer(prev => ({ ...prev, tasksCompleted }));
        };

        const handleError = ({ message }) => {
            setError(message);
        };

        // Register event listeners
        on(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
        on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
        on(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
        on(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft);
        on(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
        on(SOCKET_EVENTS.PLAYER_MOVED, handlePlayerMoved);
        on(SOCKET_EVENTS.PLAYER_KILLED, handlePlayerKilled);
        on(SOCKET_EVENTS.MEETING_CALLED, handleMeetingCalled);
        on(SOCKET_EVENTS.VOTING_COMPLETE, handleVotingComplete);
        on(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
        on(SOCKET_EVENTS.TASK_COMPLETED, handleTaskCompleted);
        on(SOCKET_EVENTS.ERROR, handleError);

        return () => {
            off(SOCKET_EVENTS.ROOM_CREATED, handleRoomCreated);
            off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
            off(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
            off(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeft);
            off(SOCKET_EVENTS.GAME_STARTED, handleGameStarted);
            off(SOCKET_EVENTS.PLAYER_MOVED, handlePlayerMoved);
            off(SOCKET_EVENTS.PLAYER_KILLED, handlePlayerKilled);
            off(SOCKET_EVENTS.MEETING_CALLED, handleMeetingCalled);
            off(SOCKET_EVENTS.VOTING_COMPLETE, handleVotingComplete);
            off(SOCKET_EVENTS.GAME_ENDED, handleGameEnded);
            off(SOCKET_EVENTS.TASK_COMPLETED, handleTaskCompleted);
            off(SOCKET_EVENTS.ERROR, handleError);
        };
    }, [socket, on, off]);

    // Game actions
    const createRoom = useCallback((name) => {
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }
        setPlayerName(name.trim());
        emit(SOCKET_EVENTS.CREATE_ROOM, name.trim());
    }, [emit]);

    const joinRoom = useCallback((name, code) => {
        if (!name.trim() || !code.trim()) {
            setError('Please enter your name and room code');
            return;
        }
        setPlayerName(name.trim());
        setRoomCode(code.trim().toUpperCase());
        emit(SOCKET_EVENTS.JOIN_ROOM, {
            roomCode: code.trim().toUpperCase(),
            playerName: name.trim()
        });
    }, [emit]);

    const startGame = useCallback(() => {
        emit(SOCKET_EVENTS.START_GAME);
    }, [emit]);

    const movePlayer = useCallback((position) => {
        emit(SOCKET_EVENTS.PLAYER_MOVE, position);
    }, [emit]);

    const killPlayer = useCallback((targetId) => {
        emit(SOCKET_EVENTS.KILL_PLAYER, targetId);
    }, [emit]);

    const completeTask = useCallback(() => {
        emit(SOCKET_EVENTS.COMPLETE_TASK);
    }, [emit]);

    const reportBody = useCallback((bodyInfo) => {
        emit(SOCKET_EVENTS.REPORT_BODY, bodyInfo);
    }, [emit]);

    const castVote = useCallback((targetId) => {
        emit(SOCKET_EVENTS.VOTE, targetId);
    }, [emit]);

    const leaveRoom = useCallback(() => {
        emit('leave-room');
        resetGame();
    }, [emit]);

    const resetGame = useCallback(() => {
        setGameState(GAME_STATES.MENU);
        setRoomCode('');
        setPlayers([]);
        setCurrentPlayer(null);
        setError('');
        setGameResult(null);
        setMeetingInfo(null);
        setIsHost(false);
        setTasks([]);
    }, []);

    return {
        // State
        gameState,
        playerName,
        roomCode,
        isHost,
        players,
        currentPlayer,
        error,
        gameResult,
        meetingInfo,
        tasks,
        isConnected,

        // Actions
        createRoom,
        joinRoom,
        startGame,
        movePlayer,
        killPlayer,
        completeTask,
        reportBody,
        castVote,
        leaveRoom,
        resetGame,
        setError,

        // Socket reference for direct use if needed
        socket
    };
};