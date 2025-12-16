// src/hooks/useTableSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useSound from 'use-sound'; // optional, fallback to native Audio if unavailable

/**
 * useTableSocket - handles real‑time waiter call notifications.
 *
 * @param {Object} params
 * @param {string} params.restaurantId - ID of the restaurant (from cookie).
 * @param {Function} params.onNotificationResolved - callback invoked when a notification is resolved.
 * @returns {{ stopAlert: Function }} - function to stop vibration and sound immediately.
 */
export default function useTableSocket({ restaurantId, onNotificationResolved }) {
    const socketRef = useRef(null);
    const vibrateIntervalRef = useRef(null);
    const soundRef = useRef(null);
    const [play, { stop: stopSound }] = useSound('/sounds/alert.mp3', { loop: true, volume: 0.5 });

    // Helper to start vibration loop
    const startVibration = () => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            // Clear any existing interval
            clearInterval(vibrateIntervalRef.current);
            // Immediate vibration then repeat every 2 seconds
            navigator.vibrate([500, 200, 500]);
            vibrateIntervalRef.current = setInterval(() => {
                navigator.vibrate([500, 200, 500]);
            }, 2000);
        }
    };

    const stopVibration = () => {
        if (vibrateIntervalRef.current) {
            clearInterval(vibrateIntervalRef.current);
            vibrateIntervalRef.current = null;
        }
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(0);
        }
    };

    // Stop both vibration and sound – exposed to callers (e.g., when waiter confirms)
    const stopAlert = () => {
        stopVibration();
        stopSound();
        if (soundRef.current) {
            soundRef.current.pause();
            soundRef.current.currentTime = 0;
        }
    };

    useEffect(() => {
        if (!restaurantId) return;
        // Initialize Socket.IO client
        const socket = io(process.env.NEXT_PUBLIC_API_URL, {
            transports: ['websocket'],
            withCredentials: true,
        });
        socketRef.current = socket;

        socket.emit('join_room', { type: 'waiter', restaurantId });

        socket.on('new_notification', (data) => {
            // Only react to CALL_WAITER notifications
            if (data && data.type === 'CALL_WAITER') {
                startVibration();
                // Play sound loop – useSound already started playing when called
                play();
            }
        });

        socket.on('notification_resolved', () => {
            stopAlert();
            if (typeof onNotificationResolved === 'function') {
                onNotificationResolved();
            }
        });

        // Cleanup on unmount
        return () => {
            stopAlert();
            if (socket) socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    return { stopAlert };
}
