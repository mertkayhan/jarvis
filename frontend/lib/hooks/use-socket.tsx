import { useEffect, useState } from "react";
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

        const url = process.env.NEXT_PUBLIC_WS_URL || "unknown";
        const s = io(`${url}/${socketNamespace}`, {
            auth: { "user_id": userId, "token": token },
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        setSocket(s);

        return () => {
            if (s.connected) {
                s.disconnect();
            }
        };
    }, [socketNamespace, userId, token]);

    return socket;
}