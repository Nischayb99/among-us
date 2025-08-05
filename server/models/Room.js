import { GAME_STATES, GAME_CONFIG } from '../utils/constants.js';

export class Room {
    constructor(roomCode, hostId) {
        this.code = roomCode;
        this.hostId = hostId;
        this.players = new Map();
        this.gameState = GAME_STATES.LOBBY;
        this.impostorCount = 1;
        this.totalTasks = GAME_CONFIG.TOTAL_TASKS;
        this.completedTasks = 0;
        this.deadBodies = [];
        this.votes = new Map();
        this.votingInProgress = false;
        this.meetingCaller = null;
        this.gameStarted = false;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
    }

    addPlayer(player) {
        if (this.players.size >= GAME_CONFIG.MAX_PLAYERS) {
            throw new Error('Room is full');
        }

        if (this.gameState !== GAME_STATES.LOBBY) {
            throw new Error('Cannot join game in progress');
        }

        this.players.set(player.id, player);
        this.updateActivity();
        return true;
    }

    removePlayer(playerId) {
        const removed = this.players.delete(playerId);

        // Assign new host if current host left
        if (this.hostId === playerId && this.players.size > 0) {
            this.hostId = this.players.keys().next().value;
        }

        this.updateActivity();
        return removed;
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    getAlivePlayers() {
        return this.getAllPlayers().filter(p => p.isAlive());
    }

    getDeadPlayers() {
        return this.getAllPlayers().filter(p => p.isDead());
    }

    getImpostors() {
        return this.getAllPlayers().filter(p => p.isImpostor());
    }

    getCrewmates() {
        return this.getAllPlayers().filter(p => p.isCrewmate());
    }

    getAliveImpostors() {
        return this.getAlivePlayers().filter(p => p.isImpostor());
    }

    getAliveCrewmates() {
        return this.getAlivePlayers().filter(p => p.isCrewmate());
    }

    canStartGame() {
        return (
            this.gameState === GAME_STATES.LOBBY &&
            this.players.size >= GAME_CONFIG.MIN_PLAYERS &&
            this.players.size <= GAME_CONFIG.MAX_PLAYERS
        );
    }

    startGame() {
        if (!this.canStartGame()) {
            throw new Error('Cannot start game');
        }

        this.assignRoles();
        this.gameState = GAME_STATES.PLAYING;
        this.gameStarted = true;
        this.updateActivity();
    }

    assignRoles() {
        const playerList = this.getAllPlayers();
        const impostorCount = Math.max(1, Math.floor(playerList.length * GAME_CONFIG.IMPOSTOR_RATIO));

        // Shuffle players
        const shuffled = playerList.sort(() => Math.random() - 0.5);

        // Assign impostors
        for (let i = 0; i < impostorCount; i++) {
            shuffled[i].assignRole('impostor');
        }

        // Assign crewmates
        for (let i = impostorCount; i < shuffled.length; i++) {
            shuffled[i].assignRole('crewmate');
        }

        this.impostorCount = impostorCount;
    }

    addDeadBody(playerId, position) {
        this.deadBodies.push({
            playerId,
            position,
            reportedBy: null,
            timestamp: Date.now()
        });
    }

    startMeeting(callerId, reason = 'body-reported') {
        this.gameState = GAME_STATES.MEETING;
        this.meetingCaller = callerId;
        this.votes.clear();
        this.votingInProgress = true;

        // Reset voting status for all players
        this.getAllPlayers().forEach(player => {
            player.resetVote();
        });

        this.updateActivity();
    }

    castVote(voterId, targetId) {
        const voter = this.getPlayer(voterId);

        if (!voter || !voter.isAlive() || voter.hasVoted) {
            return false;
        }

        if (voter.vote(targetId)) {
            if (this.votes.has(targetId)) {
                this.votes.set(targetId, this.votes.get(targetId) + 1);
            } else {
                this.votes.set(targetId, 1);
            }
            return true;
        }

        return false;
    }

    isVotingComplete() {
        const alivePlayers = this.getAlivePlayers();
        const votedPlayers = alivePlayers.filter(p => p.hasVoted);
        return votedPlayers.length === alivePlayers.length;
    }

    processVotes() {
        let maxVotes = 0;
        let ejectedPlayer = null;
        let tie = false;

        for (const [playerId, votes] of this.votes) {
            if (votes > maxVotes) {
                maxVotes = votes;
                ejectedPlayer = playerId;
                tie = false;
            } else if (votes === maxVotes && maxVotes > 0) {
                tie = true;
            }
        }

        if (!tie && ejectedPlayer && maxVotes > 0) {
            const player = this.getPlayer(ejectedPlayer);
            if (player) {
                player.kill();
            }
        }

        this.gameState = GAME_STATES.PLAYING;
        this.votingInProgress = false;
        this.updateActivity();

        return {
            ejectedPlayer: tie ? null : ejectedPlayer,
            tie,
            votes: Object.fromEntries(this.votes)
        };
    }

    checkWinConditions() {
        const aliveImpostors = this.getAliveImpostors();
        const aliveCrewmates = this.getAliveCrewmates();

        // Impostors win if they equal or outnumber crewmates
        if (aliveImpostors.length >= aliveCrewmates.length && aliveImpostors.length > 0) {
            return { winner: 'impostors', reason: 'Impostors outnumber crewmates' };
        }

        // Crewmates win if all impostors are dead
        if (aliveImpostors.length === 0) {
            return { winner: 'crewmates', reason: 'All impostors eliminated' };
        }

        // Crewmates win if all tasks completed
        const totalPossibleTasks = this.getCrewmates().length * this.totalTasks;
        const totalCompletedTasks = this.getCrewmates()
            .reduce((sum, p) => sum + p.tasksCompleted, 0);

        if (totalCompletedTasks >= totalPossibleTasks) {
            return { winner: 'crewmates', reason: 'All tasks completed' };
        }

        return null;
    }

    endGame(result) {
        this.gameState = GAME_STATES.ENDED;
        this.updateActivity();
        return result;
    }

    updateActivity() {
        this.lastActivity = Date.now();
    }

    isEmpty() {
        return this.players.size === 0;
    }

    isActive() {
        const now = Date.now();
        const inactiveTime = 30 * 60 * 1000; // 30 minutes
        return (now - this.lastActivity) < inactiveTime;
    }

    toJSON() {
        return {
            code: this.code,
            hostId: this.hostId,
            players: this.getAllPlayers().map(p => p.toJSON()),
            gameState: this.gameState,
            impostorCount: this.impostorCount,
            totalTasks: this.totalTasks,
            gameStarted: this.gameStarted,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }
}