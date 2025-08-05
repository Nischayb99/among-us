import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { GAME_CONFIG, SOCKET_EVENTS } from '../utils/constants.js';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    useEffect(() => {
        const newSocket = io(GAME_CONFIG.SERVER_URL, {
            timeout: 5000,
            forceNew: true
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('Connected to server:', newSocket.id);
            setIsConnected(true);
            setConnectionError(null);
            reconnectAttempts.current = 0;
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected the client, need to reconnect manually
                newSocket.connect();
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setConnectionError(error.message);

            reconnectAttempts.current++;
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                setConnectionError('Failed to connect to server after multiple attempts');
            }
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            setIsConnected(true);
            setConnectionError(null);
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error);
            setConnectionError('Reconnection failed');
        });

        // System messages
        newSocket.on('system-message', (data) => {
            console.log('System message:', data.message);
            // You could show a toast notification here
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const emit = (event, data, callback) => {
        if (socket && isConnected) {
            socket.emit(event, data, callback);
        } else {
            console.warn('Socket not connected, cannot emit event:', event);
        }
    };

    const on = (event, callback) => {
        if (socket) {
            socket.on(event, callback);
        }
    };

    const off = (event, callback) => {
        if (socket) {
            socket.off(event, callback);
        }
    };

    const disconnect = () => {
        if (socket) {
            socket.disconnect();
        }
    };

    const reconnect = () => {
        if (socket) {
            socket.connect();
        }
    };

    return {
        socket,
        isConnected,
        connectionError,
        emit,
        on,
        off,
        disconnect,
        reconnect
    };
};