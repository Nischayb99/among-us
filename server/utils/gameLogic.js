import { ROLES, PLAYER_STATES, GAME_CONFIG } from './constants.js';

export class GameLogic {
    static calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2)
        );
    }

    static isWithinRange(pos1, pos2, range) {
        return this.calculateDistance(pos1, pos2) <= range;
    }

    static canKill(killer, target) {
        if (!killer || !target) return false;
        if (killer.role !== ROLES.IMPOSTOR) return false;
        if (target.state !== PLAYER_STATES.ALIVE) return false;
        if (killer.state !== PLAYER_STATES.ALIVE) return false;

        return this.isWithinRange(killer.position, target.position, GAME_CONFIG.KILL_RANGE);
    }

    static canCompleteTask(player, taskPosition) {
        if (!player || player.role !== ROLES.CREWMATE) return false;
        if (player.state !== PLAYER_STATES.ALIVE) return false;

        return this.isWithinRange(player.position, taskPosition, GAME_CONFIG.TASK_RANGE);
    }

    static validatePosition(position) {
        const { x, y } = position;

        return {
            x: Math.max(20, Math.min(GAME_CONFIG.MAP_WIDTH - 20, x)),
            y: Math.max(20, Math.min(GAME_CONFIG.MAP_HEIGHT - 20, y))
        };
    }

    static calculateImpostorCount(playerCount) {
        if (playerCount < 4) return 1;
        if (playerCount < 7) return 1;
        if (playerCount < 9) return 2;
        return 3;
    }

    static checkWinConditions(room) {
        const alivePlayers = room.getAlivePlayers();
        const aliveImpostors = room.getAliveImpostors();
        const aliveCrewmates = room.getAliveCrewmates();

        // Impostors win if they equal or outnumber crewmates
        if (aliveImpostors.length >= aliveCrewmates.length && aliveImpostors.length > 0) {
            return { winner: 'impostors', reason: 'Impostors outnumber crewmates' };
        }

        // Crewmates win if all impostors are dead
        if (aliveImpostors.length === 0) {
            return { winner: 'crewmates', reason: 'All impostors eliminated' };
        }

        // Crewmates win if all tasks completed
        const totalPossibleTasks = room.getCrewmates().length * room.totalTasks;
        const totalCompletedTasks = room.getCrewmates()
            .reduce((sum, p) => sum + p.tasksCompleted, 0);

        if (totalCompletedTasks >= totalPossibleTasks) {
            return { winner: 'crewmates', reason: 'All tasks completed' };
        }

        return null;
    }

    static generateTaskLocations() {
        return [
            { id: 1, name: 'Fix Wiring', x: 150, y: 150 },
            { id: 2, name: 'Empty Trash', x: 650, y: 200 },
            { id: 3, name: 'Fuel Engine', x: 500, y: 450 },
            { id: 4, name: 'Calibrate Distributor', x: 300, y: 400 },
            { id: 5, name: 'Scan Boarding Pass', x: 600, y: 350 },
            { id: 6, name: 'Clean O2 Filter', x: 200, y: 500 },
            { id: 7, name: 'Align Engine Output', x: 700, y: 100 },
            { id: 8, name: 'Submit Scan', x: 100, y: 300 }
        ];
    }

    static getRandomSpawnPosition() {
        const margin = 50;
        const x = margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - 2 * margin);
        const y = margin + Math.random() * (GAME_CONFIG.MAP_HEIGHT - 2 * margin);

        return { x: Math.floor(x), y: Math.floor(y) };
    }

    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static assignRoles(players) {
        const playerList = Array.from(players.values());
        const impostorCount = this.calculateImpostorCount(playerList.length);

        // Shuffle players
        const shuffled = this.shuffleArray(playerList);

        // Assign impostors
        for (let i = 0; i < impostorCount; i++) {
            shuffled[i].assignRole(ROLES.IMPOSTOR);
        }

        // Assign crewmates
        for (let i = impostorCount; i < shuffled.length; i++) {
            shuffled[i].assignRole(ROLES.CREWMATE);
        }

        return impostorCount;
    }

    static processVotingResults(votes) {
        let maxVotes = 0;
        let ejectedPlayer = null;
        let tie = false;

        const voteEntries = Array.from(votes.entries());

        // Find player with most votes
        for (const [playerId, voteCount] of voteEntries) {
            if (voteCount > maxVotes) {
                maxVotes = voteCount;
                ejectedPlayer = playerId;
                tie = false;
            } else if (voteCount === maxVotes && maxVotes > 0) {
                tie = true;
            }
        }

        return {
            ejectedPlayer: tie ? null : ejectedPlayer,
            tie,
            votes: Object.fromEntries(votes),
            maxVotes
        };
    }

    static getNearbyPlayers(player, allPlayers, range = 100) {
        return allPlayers.filter(p => {
            if (p.id === player.id) return false;
            return this.isWithinRange(player.position, p.position, range);
        });
    }

    static canReportBody(reporter, body) {
        if (!reporter || reporter.state !== PLAYER_STATES.ALIVE) return false;

        return this.isWithinRange(
            reporter.position,
            body.position,
            GAME_CONFIG.TASK_RANGE
        );
    }

    static generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    static validatePlayerName(name) {
        if (!name || typeof name !== 'string') return false;
        if (name.length < 1 || name.length > 20) return false;
        if (name.trim() !== name) return false;

        // Check for inappropriate content (basic filter)
        const inappropriate = ['admin', 'server', 'bot', 'null', 'undefined'];
        return !inappropriate.includes(name.toLowerCase());
    }

    static sanitizePlayerName(name) {
        if (!name) return 'Anonymous';

        return name
            .trim()
            .substring(0, 20)
            .replace(/[<>]/g, '') // Remove potential HTML
            .replace(/^\s+|\s+$/g, ''); // Trim whitespace
    }
}