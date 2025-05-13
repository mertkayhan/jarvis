import { getToken } from "@/components/chat/chat-actions";
import { useEffect, useRef, useState } from "react";

export function useAuthToken(userId: string | null | undefined) {
    const [token, setToken] = useState<string | null>(null);
    const isMounted = useRef(true);

    async function fetchToken() {
        if (!userId) {
            return;
        }
        console.log("Fetching token...");
        try {
            const newToken = await getToken(userId);
            setToken((old) => (old !== newToken) ? newToken : old);
        } catch (error) {
            console.error("failed to fetch token", error);
        }

    }

    useEffect(() => {
        if (!userId) {
            return;
        }
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
