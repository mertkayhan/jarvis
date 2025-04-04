import { getToken } from "@/components/chat/chat-actions";
import { useEffect, useRef, useState } from "react";
import { useToast } from "./use-toast";

export function useAuthToken() {
    const [token, setToken] = useState<string | null>(null);
    const { toast } = useToast();
    const isMounted = useRef(true);

    async function fetchToken() {
        console.log("Fetching token...");
        try {
            const newToken = await getToken();
            setToken((old) => (old !== newToken) ? newToken : old);
        } catch (error) {
            console.error("failed to fetch token", error);
            toast({ title: "Internal error", description: "Failed to fetch bearer token", variant: "destructive", duration: Infinity });
        }

    }

    useEffect(() => {
        isMounted.current = true;
        fetchToken();

        const scheduleFetch = () => {
            setTimeout(async () => {
                await fetchToken();
                if (isMounted.current) {
                    scheduleFetch();
                }
            }, 60 * 1000);
        };

        scheduleFetch();

        return () => {
            isMounted.current = false;
        };
    }, []);


    return token;
}
