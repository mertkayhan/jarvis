'use client'

import { Dispatch, SetStateAction, useEffect } from "react"
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Loading } from "./loading-screen"
import { UploadButton } from "./buttons"
import { DocumentList } from "./document-list"
import { useQuery } from "@tanstack/react-query"
import { listDocuments } from "./document-repo-actions"
import { useToast } from "@/lib/hooks/use-toast"
import { Socket } from "socket.io-client"

interface DocumentDialogProps {
    userId: string
    uploadRunning: boolean
    setUploadRunning: Dispatch<SetStateAction<boolean>>
    socket: Socket | null
}

export function DocumentDialog({ userId, uploadRunning, setUploadRunning, socket }: DocumentDialogProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["listDocuments", userId],
        queryFn: () => listDocuments(userId),
        enabled: !!userId,
    });
    const { toast } = useToast();
    useEffect(() => {
        if (error) {
            toast({
                title: "Failed to fetch documents",
                variant: "destructive"
            })
        }
    }, [error]);

    return (
        <DialogContent
            className="max-w-none border w-[80vw] h-[80vh] overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 p-10 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black"
        >
            {isLoading && <Loading />}
            {!isLoading && !error && <div>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text">Document Repository</DialogTitle>
                    <DialogDescription className="text-base text-gray-500 dark:text-gray-400 mb-4">
                        <span>Manage your documents easily. Upload, download, or delete files as needed.</span>
                        <br></br>
                        <span className="text-xs text-slate-600">Note: Your documents will be processed and parsed which can take some time depending on the complexity and number of pages.</span>
                    </DialogDescription>
                </DialogHeader>

                {/* Upload Section */}
                <div className="flex flex-col overflow-auto">
                    <div className="mb-4 justify-end flex gap-2">
                        <UploadButton
                            uploadRunning={uploadRunning}
                            userId={userId}
                            setUploadRunning={setUploadRunning}
                            socket={socket}
                        />
                    </div>
                    {/* Document List */}
                    <DocumentList documents={data?.docs} userId={userId} />
                </div>
            </div>}
        </DialogContent>
    );
}