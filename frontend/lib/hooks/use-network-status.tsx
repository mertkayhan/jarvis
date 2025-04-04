import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useToast } from "./use-toast";
import { ToastAction } from "@/components/ui/toast";

interface UseNetworkStatusProps {
    socket: Socket | null;
    path: string;
}

export function useNetworkStatus({ socket, path }: UseNetworkStatusProps): void {
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const handleOnline = (): void => {
            console.log("handle online");
            if (!socket) {
                toast({
                    title: "Connection Error",
                    description: "Please refresh the page",
                    action: <ToastAction altText="Refresh page" onClick={() => router.push(`/${path}`)}>Refresh page</ToastAction>,
                    variant: "destructive",
                    duration: Infinity,
                });
                return;
            }
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
    }, [socket, path]);
}