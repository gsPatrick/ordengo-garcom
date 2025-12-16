'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Cookies from 'js-cookie';

// Som de alerta (certifique-se de ter um arquivo mp3 leve em public/sounds/alert.mp3)
const ALERT_SOUND = '/sounds/alert.mp3';

export function useTableSocket(onRefreshData) {
    const socketRef = useRef(null);
    const audioRef = useRef(null);
    const vibrationIntervalRef = useRef(null);

    useEffect(() => {
        // Inicializa o áudio apenas no cliente
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio(ALERT_SOUND);
            audioRef.current.loop = true; // Som toca em loop
            audioRef.current.volume = 1.0;
        }

        // Pega dados de autenticação
        const token = Cookies.get('ordengo_token');
        const userStr = Cookies.get('ordengo_user');
        let restaurantId = null;

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                restaurantId = user.restaurantId;
            } catch (e) {
                console.error("Erro ao ler cookie de usuário", e);
            }
        }

        if (!restaurantId) return;

        // Conecta ao Socket (URL da sua API)
        const socketUrl = 'https://geral-ordengoapi.r954jc.easypanel.host';

        socketRef.current = io(socketUrl, {
            transports: ['websocket'],
            query: { token }
        });

        socketRef.current.on('connect', () => {
            console.log("🔌 Socket conectado na sala:", `restaurant_${restaurantId}`);
            socketRef.current.emit('join_room', { type: 'waiter', restaurantId });
        });

        // --- ESCUTA OS EVENTOS ---

        // 1. Nova Notificação (Mesa chamou OU Pediu Conta)
        socketRef.current.on('new_notification', (data) => {
            console.log("🔔 NOVA NOTIFICAÇÃO:", data);

            // Atualiza a lista visualmente
            if (onRefreshData) onRefreshData();

            // Inicia Alerta Físico (Vibração + Som)
            startAlert();
        });

        // 2. Notificação Resolvida (Alguém atendeu)
        socketRef.current.on('notification_resolved', (data) => {
            console.log("✅ Notificação Resolvida:", data);

            // Para o alerta imediatamente
            stopAlert();

            // Atualiza a lista visualmente
            if (onRefreshData) onRefreshData();
        });

        // 3. Atualização genérica de mesa (status mudou)
        socketRef.current.on('table_updated', () => {
            if (onRefreshData) onRefreshData();
        });

        return () => {
            stopAlert();
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [onRefreshData]);

    // Função para INICIAR o Alerta
    const startAlert = () => {
        // Tocar Som
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio bloqueado (interaja com a tela primeiro):", e));
        }

        // Vibrar (Loop para Android)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            // Vibra: 500ms, Pausa: 300ms, Vibra: 500ms
            navigator.vibrate([500, 300, 500]);

            // Garante o loop infinito até parar
            if (!vibrationIntervalRef.current) {
                vibrationIntervalRef.current = setInterval(() => {
                    navigator.vibrate([500, 300, 500]);
                }, 2000);
            }
        }
    };

    // Função para PARAR o Alerta (Exposta para ser usada no botão "Confirmar")
    const stopAlert = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        if (vibrationIntervalRef.current) {
            clearInterval(vibrationIntervalRef.current);
            vibrationIntervalRef.current = null;
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(0);
        }
    };

    return { stopAlert };
}