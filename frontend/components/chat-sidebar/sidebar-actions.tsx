'use client'

import { UserChat } from "@/lib/types";
import { Dispatch, useState } from "react";
import { TooltipProvider } from "../ui/tooltip";
import { Dialog } from "../ui/dialog";
import { RenameDialog } from "./rename-dialog";
import { ChatShareDialog } from "./chat-share-dialog";
import { DeleteChatDialog } from "@/components/chat-sidebar/delete-chat-dialog";
import { ChatDropdown } from "./chat-dropdown";


interface SidebarActionsProps {
    chat: UserChat
    path: string
    userId: string
    dispatch: Dispatch<any>
}


export function SidebarActions({
    chat,
    path,
    userId,
    dispatch,
}: SidebarActionsProps) {
    const [title, setTitle] = useState("");
    const [currentDialog, setCurrentDialog] = useState("");
    const [open, setOpen] = useState(false);

    const shareChat = (id: string) => {
        return { sharePath: `${path}/shared/${btoa(chat.userId)}/${id}` } as UserChat
    }

    const dialogHandler = (currentDialog: string) => {
        switch (currentDialog) {
            case "rename":
                return <RenameDialog setTitle={setTitle} title={title} chat={chat} setOpen={setOpen} />
            case "share":
                return <ChatShareDialog
                    chat={chat}
                    shareChat={shareChat}
                />
            case "delete":
                return <DeleteChatDialog chatId={chat.id} userId={userId} dispatch={dispatch} />
        }
    }

    return (
        <>
            <TooltipProvider>
                <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
                    <ChatDropdown setCurrentDialog={setCurrentDialog} chat={chat} userId={userId} />
                    {dialogHandler(currentDialog)}
                </Dialog>
            </TooltipProvider >
        </>
    )
}
