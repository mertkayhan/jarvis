'use client'

import { uuidv4 } from "@/lib/utils";
import { useState } from "react";
import { ClimbingBoxLoader } from "react-spinners";
import { createPack, ListPacksResp } from "./question-packs-actions";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

interface NewQuestionPackProps {
    userId: string
}

export function NewQuestionPack({ userId }: NewQuestionPackProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (newId: string) => createPack(newId, description, name, userId),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPacks"], (old: ListPacksResp) => {
                return { packs: [...old.packs, { ...resp }] };
            })
            toast({ title: "Successfully created question pack" });
            setName("");
            setDescription("");
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to create question pack", variant: "destructive" });
        }
    }, queryClient);

    if (mutation.isPending) {
        return (
            <div className="flex w-full h-full items-center justify-center mx-auto my-auto">
                <ClimbingBoxLoader color="#94a3b8" size={20} />
            </div>
        )
    }

    return (
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
                        className="w-full text-sm dark:border-indigo-300 border-slate-200"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="flex flex-col space-y-2 w-full flex-grow">
                    <Label>Description</Label>
                    <textarea
                        className="flex bg-transparent border resize-none w-full focus:outline-none p-2 text-sm rounded-lg dark:border-indigo-300 border-slate-200 h-full"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex w-full justify-end">
                <Button
                    variant="secondary"
                    className="w-full"
                    type="submit"
                    disabled={description.trim().length === 0 || name.trim().length === 0}
                >
                    Save
                </Button>
            </div>
        </form>

    )
}