import { ROLES, PLAYER_STATES } from '../utils/constants.js';

export class Player {
    constructor(socketId, name, roomCode) {
        this.id = socketId;
        this.name = name;
        this.roomCode = roomCode;
        this.role = null;
        this.state = PLAYER_STATES.ALIVE;
        this.position = { x: 400, y: 300 };
        this.tasksCompleted = 0;
        this.hasVoted = false;
        this.lastVote = null;
        this.joinedAt = Date.now();
    }

    assignRole(role) {
        if (Object.values(ROLES).includes(role)) {
            this.role = role;
        } else {
            throw new Error('Invalid role');
        }
    }

    updatePosition(x, y) {
        this.position = { x, y };
    }

    kill() {
        this.state = PLAYER_STATES.DEAD;
    }

    revive() {
        this.state = PLAYER_STATES.ALIVE;
    }

    completeTask() {
        if (this.role === ROLES.CREWMATE && this.state === PLAYER_STATES.ALIVE) {
            this.tasksCompleted++;
            return true;
        }
        return false;
    }

    vote(targetId) {
        if (this.state === PLAYER_STATES.ALIVE && !this.hasVoted) {
            this.hasVoted = true;
            this.lastVote = targetId;
            return true;
        }
        return false;
    }

    resetVote() {
        this.hasVoted = false;
        this.lastVote = null;
    }

    isAlive() {
        return this.state === PLAYER_STATES.ALIVE;
    }

    isDead() {
        return this.state === PLAYER_STATES.DEAD;
    }

    isImpostor() {
        return this.role === ROLES.IMPOSTOR;
    }

    isCrewmate() {
        return this.role === ROLES.CREWMATE;
    }

    getDistance(otherPlayer) {
        return Math.sqrt(
            Math.pow(this.position.x - otherPlayer.position.x, 2) +
            Math.pow(this.position.y - otherPlayer.position.y, 2)
        );
    }

    canKill(targetPlayer, killRange = 50) {
        return (
            this.isImpostor() &&
            this.isAlive() &&
            targetPlayer.isAlive() &&
            this.getDistance(targetPlayer) <= killRange
        );
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            roomCode: this.roomCode,
            role: this.role,
            state: this.state,
            position: this.position,
            tasksCompleted: this.tasksCompleted,
            hasVoted: this.hasVoted,
            joinedAt: this.joinedAt
        };
    }
}