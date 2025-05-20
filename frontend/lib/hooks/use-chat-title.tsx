import { getChatTitle } from "@/components/chat/chat-actions";
import { useQuery } from "@tanstack/react-query";

export function useChatTitle(userId: string, id: string | undefined | null) {
    const { refetch } = useQuery({
        queryKey: ["getChatTitle", id],
        queryFn: () => getChatTitle(userId, id as string),
        enabled: false,
    });
    return { refetch };
}