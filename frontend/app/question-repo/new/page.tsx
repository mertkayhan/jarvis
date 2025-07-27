'use client';

import Loading from "@/app/loading";
import { createPack, ListPacksResp } from "@/components/question-packs/question-packs-actions";
import { Sidebar } from "@/components/sidebar/chat-sidebar";
import { Button } from "@/components/ui/button";
import { IconSpinner } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { uuidv4 } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
    const router = useRouter();
    const { user, error, isLoading } = useUser();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (newId: string) => createPack(newId, description, name, user?.email as string),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPacks"], (old: ListPacksResp) => {
                return { packs: [...old?.packs, { ...resp }] };
            });
            toast({ title: "Successfully created question pack" });
            setName("");
            setDescription("");
            router.push("/chat");
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to create question pack", variant: "destructive" });
        }
    }, queryClient);

    if (isLoading) {
        return (
            <Loading />
        );
    }

    if (error) {
        router.push("/forbidden");
    }

    if (!user) {
        redirect("/api/auth/login");
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
            <main className="container h-full rounded-lg">
                <header className="p-2">
                    <h2 className="text-lg">New Question Pack</h2>
                </header>
                <form
                    className="flex flex-col w-full h-full flex-grow space-y-4 p-4 rounded-lg items-center justify-between mt-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const newId = uuidv4();
                        mutation.mutate(newId);
                    }}
                >
                    <div className="w-full flex-grow flex flex-col space-y-4">
                        <div className="flex flex-col space-y-2 w-full">
                            <Label>Name</Label>
                            <Input
                                className="w-full text-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col space-y-2 w-full flex-grow">
                            <Label>Description</Label>
                            <textarea
                                className="flex bg-transparent border resize-none w-full focus:outline-none p-2 text-sm rounded-lg h-full"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex w-full">
                        <Button
                            variant="outline"
                            className="w-full"
                            type="submit"
                            disabled={description.trim().length === 0 || name.trim().length === 0}
                        >
                            {mutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}