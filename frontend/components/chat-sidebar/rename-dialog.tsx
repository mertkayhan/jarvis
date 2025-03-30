'use client'

import { Dispatch, SetStateAction, useTransition } from "react";
import { UserChat } from "@/lib/types";
import { useRef } from "react";
import { DialogContent, DialogFooter, DialogHeader, DialogClose } from '../ui/dialog';
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ListChatsResp, updateChatTitle } from "./chat-sidebar-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { IconSpinner } from "../ui/icons";

interface RenameDialogProps {
    setTitle: Dispatch<SetStateAction<string>>
    title: string,
    chat: UserChat
}

export function RenameDialog({ setTitle, title, chat }: RenameDialogProps) {
    const hiddenCloseButtonRef = useRef<HTMLButtonElement | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [transitioning, startTransition] = useTransition();
    const renameMutation = useMutation({
        mutationFn: (newTitle: string) => updateChatTitle(chat.id, chat.userId, newTitle),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listChats", chat.userId], (old: ListChatsResp) => {
                return { chats: old.chats.map((c) => (c.id === resp.id) ? { ...c, title: resp.newTitle } : c) };
            });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to update chat title", variant: "destructive" });
        }
    }, queryClient);

    return (
        <DialogContent>
            <DialogHeader>
                Update Chat Title
            </DialogHeader>
            <DialogClose asChild>
                <button hidden ref={hiddenCloseButtonRef} onClick={e => e.stopPropagation()}></button>
            </DialogClose>
            <div
                className="flex w-full max-w-sm items-center space-x-2"
            >
                <form
                    className="flex w-full items-center"
                    action="#"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (title.trim()) {
                            startTransition(() => {
                                renameMutation.mutate(title.trim());
                                setTitle("");
                                hiddenCloseButtonRef.current?.click();
                            });
                        }
                    }}
                >
                    <Input
                        type='text'
                        placeholder="New title"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value) }}
                    />
                </form>
            </div>
            <DialogFooter>
                <DialogClose>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                            if (title.trim()) {
                                startTransition(() => {
                                    renameMutation.mutate(title.trim());
                                    setTitle("");
                                });
                            }
                        }}
                    >
                        {(renameMutation.isPending || transitioning) && <IconSpinner className="ml-2 animate-spin" />}
                        Save
                    </Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}
