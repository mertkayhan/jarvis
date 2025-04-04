import { loadMessageHistory } from "@/components/chat/chat-actions";
import { useQuery } from "@tanstack/react-query";

export function useMessageHistory(userId: string, id: string | undefined | null) {
    const { refetch } = useQuery({
        queryFn: () => loadMessageHistory(userId, id as string),
        queryKey: ["loadMessageHistory", userId, id],
        enabled: false,
    });
    return { refetch };
}
