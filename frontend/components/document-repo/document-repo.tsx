'use client'

import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, } from "@/components/ui/dialog";
import { useState } from "react";
import { SidebarButton } from "./sidebar-button";
import { DocumentDialog } from "./document-dialog";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSocket } from "@/lib/hooks/use-socket";

interface DocumentRepoProps {
    highlightStyle: string
    userId: string
}

export function DocumentRepo({ userId }: DocumentRepoProps) {
    const [uploadRunning, setUploadRunning] = useState(false);
    const token = useAuthToken();
    const socket = useSocket({ socketNamespace: "jarvis", userId, token });

    return (
        <>
            <Tooltip>
                <Dialog modal={false}>
                    <SidebarButton />
                    <DocumentDialog
                        userId={userId}
                        uploadRunning={uploadRunning}
                        setUploadRunning={setUploadRunning}
                        socket={socket}
                    />
                </Dialog>
                <TooltipContent side="right">Document Repository</TooltipContent>
            </Tooltip>
        </>
    );
}