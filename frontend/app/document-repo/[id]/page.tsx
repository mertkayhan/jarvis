'use client'

import Loading from "@/app/loading";
import { getPack, ListDocumentPacksResp, updatePack } from "@/components/document-packs/document-packs-actions";
import { Sidebar } from "@/components/sidebar/chat-sidebar";
import { Button } from "@/components/ui/button";
import { IconSpinner } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { DocumentPack } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function usePackDetails(id: string, userId: string) {
    const { data, isLoading } = useQuery({
        queryKey: ["userDocumentPack", id],
        queryFn: () => getPack(id, userId),
        enabled: !!userId,
    });
    return { pack: data, packLoading: isLoading };
}

export default function Page() {
    const params = useParams<{ id: string }>();
    const { user, error, isLoading } = useUser();
    const { pack, packLoading } = usePackDetails(params.id, user?.email as string);
    const router = useRouter();

    const [currentName, setCurrentName] = useState("");
    const [currentDescription, setCurrentDescription] = useState("");

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
        mutationFn: (pack: DocumentPack) => updatePack(pack.id, pack.name, pack.description),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listDocumentPacks"], (old: ListDocumentPacksResp) => {
                return { packs: old?.packs.map((p) => (p.id === resp.id) ? { id: resp.id, description: resp.description, name: resp.name } : p) };
            });
            toast({ title: "Successfully updated question pack" });
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
            <main className="container h-full dark:bg-slate-900 rounded-lg bg-slate-200">
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
                    <div className="flex flex-col w-full gap-y-2 pb-4">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                reset();
                            }}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={updateMutation.isPending}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateMutation.mutate({
                                    id: pack?.id,
                                    description: currentDescription,
                                    name: currentName
                                } as DocumentPack);
                                router.push("/chat");
                            }}
                        >
                            {updateMutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </div>
            </main >
        </div >
    );
}