"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconSpinner } from "@/components/ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChat, ListChatsResp } from "./chat-sidebar-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { Dispatch, useTransition } from "react";

interface DeleteChatDialogProps {
  chatId: string;
  userId: string;
  dispatch: Dispatch<any>;
}

export function DeleteChatDialog({
  chatId,
  userId,
  dispatch,
}: DeleteChatDialogProps) {
  const [transitioning, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useMutation(
    {
      mutationFn: () => deleteChat(chatId, userId),
      onSuccess: async (resp) => {
        await queryClient.setQueryData(
          ["listChats", userId],
          (old: ListChatsResp) => {
            return { chats: old.chats.filter((o) => o.id !== resp.id) };
          }
        );
        dispatch({ type: "RESET_ID" });
      },
      onError: (error) => {
        console.error(error);
        toast({ title: "Failed to delete chat", variant: "destructive" });
      },
    },
    queryClient
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogDescription>
          This will permanently delete your chat message and remove your data
          from our servers.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button
            disabled={deleteMutation.isPending || transitioning}
            variant="outline"
            onClick={(e) => e.preventDefault()}
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          variant="destructive"
          disabled={deleteMutation.isPending || transitioning}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            startTransition(() => {
              deleteMutation.mutate();
            });
          }}
        >
          {(deleteMutation.isPending || transitioning) && (
            <IconSpinner className="mr-2 animate-spin" />
          )}
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
