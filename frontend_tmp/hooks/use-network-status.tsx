import { useEffect } from "react";
import { Socket } from "socket.io-client";

interface UseNetworkStatusProps {
    socket: Socket | null;
}

export function useNetworkStatus({ socket }: UseNetworkStatusProps): void {
    useEffect(() => {
        const handleOnline = (): void => {
            console.log("handle online");
            if (socket && !socket.connected && !socket.active) {
                socket.connect();
            }
        };

        const handleOffline = (): void => {
            console.log("window went offline");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return (): void => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [socket]);
}