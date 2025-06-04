"use client";

import { Dispatch, SetStateAction, useTransition } from "react";
import { UserChat } from "@/lib/types";
import { DialogContent, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ListChatsResp, updateChatTitle } from "./chat-sidebar-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { IconSpinner } from "../ui/icons";

interface RenameDialogProps {
  setTitle: Dispatch<SetStateAction<string>>;
  title: string;
  chat: UserChat;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export function RenameDialog({
  setTitle,
  title,
  chat,
  setOpen,
}: RenameDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [transitioning, startTransition] = useTransition();
  const renameMutation = useMutation(
    {
      mutationFn: (newTitle: string) =>
        updateChatTitle(chat.id, chat.userId, newTitle),
      onSuccess: async (resp) => {
        await queryClient.setQueryData(
          ["listChats", chat.userId],
          (old: ListChatsResp) => {
            return {
              chats: old.chats.map((c) =>
                c.id === resp.id ? { ...c, title: resp.newTitle } : c
              ),
            };
          }
        );
      },
      onError: (error) => {
        console.error(error);
        toast({ title: "Failed to update chat title", variant: "destructive" });
      },
    },
    queryClient
  );

  return (
    <DialogContent>
      <DialogHeader>Update Chat Title</DialogHeader>
      <form
        className="flex w-full items-center space-x-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) {
            startTransition(() => {
              renameMutation.mutate(title.trim());
              setTitle("");
              setOpen(false);
            });
          }
        }}
      >
        <Input
          type="text"
          placeholder="New title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
          className="flex w-full"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={renameMutation.isPending || transitioning}
          onClick={(e) => e.stopPropagation()}
        >
          {(renameMutation.isPending || transitioning) && (
            <IconSpinner className="mr-2 animate-spin" />
          )}
          Save
        </Button>
      </form>
    </DialogContent>
  );
}
