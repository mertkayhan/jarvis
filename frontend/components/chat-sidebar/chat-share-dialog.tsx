"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { toast } from "react-hot-toast";

import { type UserChat } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconSpinner } from "@/components/ui/icons";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";

interface ChatShareDialogProps extends DialogProps {
  chat: Pick<UserChat, "id" | "title" | "messages">;
  shareChat: (id: string) => UserChat;
}

export function ChatShareDialog({
  chat,
  shareChat,
  ...props
}: ChatShareDialogProps) {
  const { copyToClipboard } = useCopyToClipboard({ timeout: 1000 });
  const [isSharePending, startShareTransition] = React.useTransition();

  const copyShareLink = React.useCallback(
    async (chat: UserChat) => {
      if (!chat.sharePath) {
        return toast.error("Could not copy share link to clipboard");
      }

      const url = new URL(window.location.href);
      url.pathname = chat.sharePath;
      url.search = "";
      copyToClipboard(decodeURIComponent(url.toString()));
      toast.success("Share link copied to clipboard", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
          fontSize: "14px",
        },
        iconTheme: {
          primary: "white",
          secondary: "black",
        },
      });
    },
    [copyToClipboard]
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share link to chat</DialogTitle>
        <DialogDescription>
          Users can view the shared chat with this URL.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="items-center">
        <DialogClose asChild>
          <Button
            variant="outline"
            disabled={isSharePending}
            onClick={(e) => {
              e.stopPropagation();
              // @ts-ignore
              startShareTransition(async () => {
                const result = shareChat(chat.id);

                if (result && "error" in result) {
                  toast.error(result.error as string);
                  return;
                }

                copyShareLink(result);
              });
            }}
          >
            {isSharePending ? (
              <>
                <IconSpinner className="mr-2 animate-spin" />
                Copying...
              </>
            ) : (
              <>Copy link</>
            )}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
