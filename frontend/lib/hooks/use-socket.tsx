import { getWSUrl } from "@/components/chat/chat-actions";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketProps {
    socketNamespace: string;
    userId?: string | null;
    token?: string | null;
}

export function useSocket({ socketNamespace, userId, token }: UseSocketProps) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!token || !userId) {
            return;
        }

        let s: Socket | null = null;

        const initializeSocket = async () => {
            // console.log(socketNamespace, socket?.id);
            // console.log(token, userId);
            try {
                const url = await getWSUrl();
                s = io(`${url}/${socketNamespace}`, {
                    auth: { "user_id": userId, "token": token },
                    transports: ["websocket"],
                    reconnection: true,
                    reconnectionAttempts: Infinity,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                });

                setSocket(s);
            } catch (error) {
                console.error("Failed to connect to WebSocket:", error);
            }
        };

        initializeSocket();

        return () => {
            if (s && s.connected) {
                s.disconnect();
                s.offAny();
                setSocket(null);
            }
        };

    }, [socketNamespace, userId, token]);

    return socket;
}