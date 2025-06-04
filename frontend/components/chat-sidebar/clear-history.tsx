"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { IconSpinner } from "@/components/ui/icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChats } from "./chat-sidebar-actions";
import { useToast } from "@/lib/hooks/use-toast";

interface ClearHistoryProps {
  isEnabled: boolean;
  userId: string;
  dispatch: React.Dispatch<any>;
}

export function ClearHistory({
  isEnabled = false,
  userId,
  dispatch,
}: ClearHistoryProps) {
  const [isPending, startTransition] = React.useTransition();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const clearMutation = useMutation(
    {
      mutationFn: () => deleteChats(userId),
      onSuccess: async () => {
        await queryClient.setQueryData(["listChats", userId], () => {
          return { chats: [] };
        });
        dispatch({ type: "RESET_ID" });
      },
      onError: (error) => {
        console.log(error);
        toast({ title: "Failed to clear chats", variant: "destructive" });
      },
    },
    queryClient
  );

  return (
    <div className="hidden md:block">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="w-full justify-start text-slate-500 dark:text-slate-400 dark:hover:text-slate-50"
            size="sm"
            variant="ghost"
            disabled={!isEnabled || isPending}
          >
            {isPending && <IconSpinner className="mr-2" />}
            <svg
              className="w-4 h-4"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
            <p className="px-2">Clear history</p>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete your chat history and remove your
              data from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <div className="flex gap-2">
                <Button disabled={isPending} variant="outline">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(() => {
                      clearMutation.mutate();
                    });
                  }}
                >
                  {isPending && <IconSpinner className="mr-2 animate-spin" />}
                  Delete
                </Button>
              </div>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
