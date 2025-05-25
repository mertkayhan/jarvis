'use client'

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { deleteDocument, ListDocumentsResp } from "./document-repo-actions";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconSpinner } from "../ui/icons";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Input } from "../ui/input";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { uuidv4 } from "@/lib/utils";
import { ToastAction } from "../ui/toast";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { getBackendUrl } from "../chat/chat-actions";

interface UploadButtonProps {
    uploadRunning: boolean
    userId: string
    setUploadRunning: Dispatch<SetStateAction<boolean>>
}

function useBackendUrl() {
    const [url, setUrl] = useState("");
    useEffect(() => {
        const getUrl = async () => {
            const backendUrl = await getBackendUrl();
            setUrl(backendUrl);
        }
        getUrl();
    }, []);
    return url;
}

export function UploadButton({ uploadRunning, userId, setUploadRunning }: UploadButtonProps) {
    const [chosenFile, setChosenFile] = useState<File | null>(null);
    const [processingMode, setProcessingMode] = useState("accurate");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const token = useAuthToken(userId);
    const backendUrl = useBackendUrl();

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const { dismiss } = toast({
                title: "Processing file...",
                action: <ToastAction altText="spinner"><IconSpinner className="animate-spin" /></ToastAction>,
                duration: Infinity
            });

            const formData = new FormData();
            const uploadId = uuidv4();
            formData.append("fileb", file);
            formData.append("upload_id", uploadId);
            // formData.append("user_id", userId);
            formData.append("mode", processingMode);
            formData.append("module", "document_repo");

            const resp = await fetch(`${backendUrl}/api/v1/uploads/document`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(`upload failed: ${JSON.stringify(data)}`);
            }
            return { resp: data, dismiss: dismiss, fname: file.name, uploadId };
        },
        onSuccess: (resp) => {
            if (resp.resp.success) {
                resp.dismiss(); // Close the toast
                toast({ title: "Successfully processed document", duration: 3000 });
                queryClient.setQueryData(["listDocuments", userId], (old: ListDocumentsResp) => {
                    return {
                        docs: [
                            {
                                name: resp.fname,
                                id: resp.uploadId,
                                owner: userId,
                                href: resp.resp.url,
                                createdAt: new Date(),
                                pageCount: resp.resp["num_pages"],
                                tokenCount: resp.resp["num_tokens"],
                            },
                            ...(old?.docs ?? [])
                        ]
                    };
                });
            } else if (resp.resp.message === "unknown document type") {
                toast({ title: "Document processing failed", description: "Unknown document type", variant: "destructive", duration: Infinity });
            } else {
                resp.dismiss(); // Close the toast
                toast({ title: "Document processing failed", description: "Internal server error", variant: "destructive", duration: Infinity });
            }
        },
        onError: (error) => {
            console.error("File upload failed:", error);
            toast({ title: "Processing failed", description: "File upload failed", variant: "destructive", duration: Infinity });
        }
    }, queryClient);

    const reset = () => {
        setChosenFile(null);
        setProcessingMode("accurate");
    };

    useEffect(() => {
        setUploadRunning(uploadMutation.isPending);
    }, [uploadMutation.isPending]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="group border flex items-center gap-3 px-0 pl-2 py-2 text-sm font-medium text-slate-700 transition-all hover:text-purple-500 dark:text-slate-300 dark:hover:text-purple-400"
                    disabled={uploadRunning}
                    onClick={() => reset()}
                >
                    {uploadRunning && <IconSpinner className="animate-spin mr-2" />}
                    {!uploadRunning &&
                        <>
                            <svg
                                className="w-4 h-4"
                                viewBox="0 0 15 15"
                                strokeWidth={2}
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M7.81825 1.18188C7.64251 1.00615 7.35759 1.00615 7.18185 1.18188L4.18185 4.18188C4.00611 4.35762 4.00611 4.64254 4.18185 4.81828C4.35759 4.99401 4.64251 4.99401 4.81825 4.81828L7.05005 2.58648V9.49996C7.05005 9.74849 7.25152 9.94996 7.50005 9.94996C7.74858 9.94996 7.95005 9.74849 7.95005 9.49996V2.58648L10.1819 4.81828C10.3576 4.99401 10.6425 4.99401 10.8182 4.81828C10.994 4.64254 10.994 4.35762 10.8182 4.18188L7.81825 1.18188ZM2.5 9.99997C2.77614 9.99997 3 10.2238 3 10.5V12C3 12.5538 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2238 12.2239 9.99997 12.5 9.99997C12.7761 9.99997 13 10.2238 13 10.5V12C13 13.104 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2238 2.22386 9.99997 2.5 9.99997Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                            <span className="pr-2 text-xs">Upload Document</span>
                        </>}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[50vw] max-w-full p-6">
                <DialogTitle>
                    Upload Dialog
                    <DialogDescription>Select a file to parse. Supported formats: PDF, CSV, TXT, and XLSX. For PDFs, you can choose between fast or accurate processing.</DialogDescription>
                </DialogTitle>
                <div className="grid w-full gap-4 p-4">
                    <div className="w-full">
                        <Input
                            id="file"
                            type="file"
                            accept=".csv,.txt,.pdf,.xlsx"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setChosenFile(file);
                                }
                            }} />
                    </div>

                    {chosenFile && chosenFile.type === "application/pdf" &&
                        <div className="border-t pt-4">
                            <span className="font-semibold">Please choose a PDF processing mode</span>
                            <span className="text-xs text-gray-500 block">
                                &quot;Accurate&quot; provides the best text extraction quality but may take longer,
                                while &quot;Fast&quot; speeds up processing with potential trade-offs in accuracy.
                            </span>
                            <div className="flex flex-col gap-2 mt-3">
                                <RadioGroup defaultValue="accurate" onValueChange={newValue => setProcessingMode(newValue)}>
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="accurate" id="accurate" />
                                        <Label htmlFor="accurate">Accurate – High precision, slower processing</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="fast" id="fast" />
                                        <Label htmlFor="fast">Fast – Quicker results, may reduce accuracy</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>}
                </div>
                <DialogClose asChild>
                    <div className="flex w-full justify-end space-x-2">
                        <Button variant="destructive">Cancel</Button>
                        <Button
                            variant="ghost"
                            disabled={!Boolean(chosenFile)}
                            type="button"
                            onClick={() => {
                                if (chosenFile) {
                                    uploadMutation.mutate(chosenFile);
                                }
                            }}>
                            Submit
                        </Button>
                    </div>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );

}

interface DownloadButtonProps {
    href: string
}

export function DownloadButton({ href }: DownloadButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    className="hover:text-blue-500"
                    href={href}
                    target="_blank"
                >
                    <svg
                        className="w-4 h-4"
                        viewBox="0 0 15 15"
                        strokeWidth={2}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M7.50005 1.04999C7.74858 1.04999 7.95005 1.25146 7.95005 1.49999V8.41359L10.1819 6.18179C10.3576 6.00605 10.6425 6.00605 10.8182 6.18179C10.994 6.35753 10.994 6.64245 10.8182 6.81819L7.81825 9.81819C7.64251 9.99392 7.35759 9.99392 7.18185 9.81819L4.18185 6.81819C4.00611 6.64245 4.00611 6.35753 4.18185 6.18179C4.35759 6.00605 4.64251 6.00605 4.81825 6.18179L7.05005 8.41359V1.49999C7.05005 1.25146 7.25152 1.04999 7.50005 1.04999ZM2.5 10C2.77614 10 3 10.2239 3 10.5V12C3 12.5539 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2239 12.2239 10 12.5 10C12.7761 10 13 10.2239 13 10.5V12C13 13.1041 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2239 2.22386 10 2.5 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                </a>
            </TooltipTrigger>
            <TooltipContent>Download file</TooltipContent>
        </Tooltip>

    );
}

interface DeleteButtonProps {
    id: string
    userId: string
}

export function DeleteButton({ id, userId }: DeleteButtonProps) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (id: string) => deleteDocument(userId, id),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listDocuments", userId], (old: ListDocumentsResp) => {
                if (!old.docs) {
                    return null;
                }
                return { docs: old.docs.filter((d) => d.id !== resp.id) };
            });
        },
        onError: (error) => {
            console.error("Error updating model:", error);
        },
    }, queryClient);
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="hover:text-red-500"
                    onClick={() => {
                        // Implement the delete functionality
                        mutation.mutate(id);
                    }}
                    disabled={mutation.isPending}
                >
                    {!mutation.isPending &&
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 15 15"
                            strokeWidth={2}
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                    }
                    {mutation.isPending && <IconSpinner className="animate-spin" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>Delete file</TooltipContent>
        </Tooltip>
    );
}