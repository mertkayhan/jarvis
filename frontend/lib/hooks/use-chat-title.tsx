import { getChatTitle } from "@/components/chat/chat-actions";
import { useQuery } from "@tanstack/react-query";

export function useChatTitle(id: string | undefined | null) {
    const { refetch } = useQuery({
        queryKey: ["getChatTitle", id],
        queryFn: () => getChatTitle(id as string),
        enabled: false,
    });
    return { refetch };
}