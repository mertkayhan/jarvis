'use client'

import Loading from "@/app/loading";
import { getPack, ListPacksResp, updatePack } from "@/components/question-packs/question-packs-actions";
import { Sidebar } from "@/components/sidebar/chat-sidebar";
import { Button } from "@/components/ui/button";
import { IconSpinner } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { QuestionPack } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Label } from "@radix-ui/react-dropdown-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function usePackDetails(id: string, userId: string) {
    const { data, isLoading } = useQuery({
        queryKey: ["userQuestionPack", id],
        queryFn: () => getPack(id, userId),
        enabled: !!userId,
    });
    return { pack: data, packLoading: isLoading };
}

export default function Page() {
    const params = useParams<{ id: string }>();
    const { user, error, isLoading } = useUser();
    const { pack, packLoading } = usePackDetails(params.id, user?.email as string);
    const [currentName, setCurrentName] = useState("");
    const [currentDescription, setCurrentDescription] = useState("");
    const router = useRouter();
    const reset = () => {
        setCurrentName(pack?.name || "");
        setCurrentDescription(pack?.description || "");
    };
    useEffect(() => {
        if (!pack) {
            return;
        }
        setCurrentName(pack.name);
        setCurrentDescription(pack.description);
    }, [pack]);

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: (pack: QuestionPack) => updatePack(pack),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPacks"], (old: ListPacksResp) => {
                return { packs: old.packs.map((p) => (p.id === resp.id) ? { id: resp.id, description: resp.description, name: resp.name } : p) };
            });
            toast({ title: "Successfully updated question pack" });
            router.push("/chat");
        },
        onError: (error) => {
            console.error("error updating question pack:", error);
            toast({ title: "Failed to update question pack", variant: "destructive" });
        }
    }, queryClient);

    if (isLoading || packLoading) {
        return (
            <Loading />
        )
    }

    return (
        <div className="flex h-full">
            <div
                className='flex h-full flex-col border-slate-300 bg-background transition-all duration-300'
            >
                <Sidebar
                    highlight={false}
                    showChatList={false}
                    moduleName="jarvis"
                    userId={user?.email as string}
                />

            </div>
            <main className="container h-ful rounded-lg">
                <header className="py-4">
                    <h2 className="text-lg">Edit {pack?.name}</h2>
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                        You can make your updates here and click save when you are done.
                    </span>
                </header>
                <div className="flex flex-col space-y-2 pb-2">
                    <Label>Name</Label>
                    <Input
                        className="w-full text-sm"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                    />
                    <Label>Description</Label>
                    <textarea
                        className="flex bg-transparent border resize-none w-full focus:outline-none p-2 text-sm rounded-lg"
                        rows={4}
                        value={currentDescription}
                        onChange={(e) => setCurrentDescription(e.target.value)}
                    />
                </div>
                <div className="flex w-full gap-x-4 pt-4">
                    <Button
                        variant="destructive"
                        onClick={() => {
                            reset();
                        }}
                        disabled={updateMutation.isPending}
                        className="flex w-full"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        disabled={updateMutation.isPending}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateMutation.mutate({
                                id: pack?.id,
                                description: currentDescription,
                                name: currentName
                            } as QuestionPack);
                        }}
                        className="flex w-full"
                    >
                        {updateMutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                        Save
                    </Button>
                </div>
            </main>
        </div>
    );
}