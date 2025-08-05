import { GAME_CONFIG, ROLES, PLAYER_STATES } from './constants.js';

export const calculateDistance = (pos1, pos2) => {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2)
    );
};

export const isWithinRange = (pos1, pos2, range) => {
    return calculateDistance(pos1, pos2) <= range;
};

export const validatePosition = (position) => {
    const { x, y } = position;

    return {
        x: Math.max(20, Math.min(GAME_CONFIG.MAP_WIDTH - 20, x)),
        y: Math.max(20, Math.min(GAME_CONFIG.MAP_HEIGHT - 20, y))
    };
};

export const getPlayerColor = (player) => {
    if (player.state === PLAYER_STATES.DEAD) return 'bg-gray-500';
    if (player.role === ROLES.IMPOSTOR) return 'bg-red-500';
    return 'bg-blue-500';
};

export const getRoleColor = (role) => {
    return role === ROLES.IMPOSTOR ? 'text-red-400' : 'text-blue-400';
};

export const getRoleIcon = (role) => {
    return role === ROLES.IMPOSTOR ? '🔪' : '🔧';
};

export const canInteractWithTask = (playerPosition, taskPosition, range = GAME_CONFIG.TASK_RANGE) => {
    return isWithinRange(playerPosition, taskPosition, range);
};

export const canKillPlayer = (killer, target, range = GAME_CONFIG.KILL_RANGE) => {
    if (!killer || !target) return false;
    if (killer.role !== ROLES.IMPOSTOR) return false;
    if (target.state !== PLAYER_STATES.ALIVE) return false;
    if (killer.state !== PLAYER_STATES.ALIVE) return false;

    return isWithinRange(killer.position, target.position, range);
};

export const getNearbyPlayers = (currentPlayer, allPlayers, range = 100) => {
    return allPlayers.filter(player => {
        if (player.id === currentPlayer.id) return false;
        if (player.state === PLAYER_STATES.DEAD) return false;

        return isWithinRange(currentPlayer.position, player.position, range);
    });
};

export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const generateRandomPosition = () => {
    const margin = 50;
    const x = margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - 2 * margin);
    const y = margin + Math.random() * (GAME_CONFIG.MAP_HEIGHT - 2 * margin);

    return { x: Math.floor(x), y: Math.floor(y) };
};

export const sanitizePlayerName = (name) => {
    if (!name) return 'Anonymous';

    return name
        .trim()
        .substring(0, 20)
        .replace(/[<>]/g, '') // Remove potential HTML
        .replace(/^\s+|\s+$/g, ''); // Trim whitespace
};

export const validateRoomCode = (code) => {
    if (!code || typeof code !== 'string') return false;
    if (code.length !== 6) return false;
    if (!/^[A-Z0-9]+$/.test(code)) return false;

    return true;
};

export const formatRoomCode = (code) => {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
};

export const getGameProgress = (completedTasks, totalTasks) => {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
};

export const getVotingProgress = (voted, total) => {
    if (total === 0) return 100;
    return Math.round((voted / total) * 100);
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
};

export const playSound = (soundName) => {
    // Placeholder for sound system
    // In a real implementation, you'd load and play audio files
    console.log(`Playing sound: ${soundName}`);
};

export const vibrate = (pattern = [100]) => {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
};

export const showNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
};