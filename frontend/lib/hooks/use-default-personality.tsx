import { getDefaultPersonality } from "@/components/personalities/personality-actions";
import { useQuery } from "@tanstack/react-query";

export function useDefaultPersonality(userId: string | undefined | null) {
  const { data, isFetching } = useQuery({
    queryKey: ["getDefaultPersonality", userId],
    queryFn: () => getDefaultPersonality(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
  return { data, isFetching };
}
