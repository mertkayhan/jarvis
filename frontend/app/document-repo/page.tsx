'use client'

import Loading from "@/app/loading";
import { getWSUrl } from "@/components/chat/chat-actions";
import { MemoizedReactMarkdown } from "@/components/chat/markdown";
import { getWorkflowStatus, listDocuments } from "@/components/document-packs/document-packs-actions";
import { Sidebar } from "@/components/sidebar/chat-sidebar";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { IconCheck, IconSpinner } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSocket } from "@/lib/hooks/use-socket";
import { useToast } from "@/lib/hooks/use-toast";
import { uuidv4 } from "@/lib/utils";
import { useUser } from '@auth0/nextjs-auth0/client';
import { DialogTitle } from "@radix-ui/react-dialog";
import { InvalidateQueryFilters, RefetchQueryFilters, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HashLoader } from "react-spinners";
import remarkGfm from "remark-gfm";

interface ReadResp {
    data: string | ArrayBuffer | null
    fname: string | null
}

interface QueryResp {
    response: string
    context_enriched: {
        sources: Sources[]
    }
}

interface Sources {
    document_title: string
    document_id: string
    text: string
}

enum Workflow {
    Upload = 0,
    Parse,
    Preprocess,
    Index,
    Finalize,
}

function useUserHook() {
    const { user, isLoading, error } = useUser();
    return { user, userLoading: isLoading, userError: error };
}

function useBackendUrl() {
    const [url, setUrl] = useState("");
    useEffect(() => {
        const getUrl = async () => {
            const backendUrl = await getWSUrl();
            setUrl(backendUrl);
        }
        getUrl();
    }, []);
    return url;
}

export default function Page() {
    const { user, userLoading, userError } = useUserHook();
    const params = useSearchParams();
    const { data, error, isLoading } = useQuery({
        queryKey: ["listPackDocs", params.get("pack_id")],
        enabled: !!params.get("pack_id"),
        queryFn: () => listDocuments(params.get("pack_id") as string)
    });
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [queryRunning, setQueryRunning] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchSummary, setSearchSummary] = useState("");
    const [searchResults, setSearchResults] = useState<Sources[]>([]);
    const [workflowStage, setWorkflowStage] = useState<Workflow>(Workflow.Upload);
    const [selectedSnippet, setSelectedSnippet] = useState<Sources | null>(null);
    const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
    const token = useAuthToken();
    const socket = useSocket({ socketNamespace: 'jarvis', userId: user?.email, token: token });
    const readFileContent = (file: File): Promise<ReadResp> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve({ data: reader.result, fname: file.name });
            reader.onerror = () => reject(new Error("Failed to read file content"));
        });
    };
    const queryClient = useQueryClient();
    const router = useRouter();
    const backendUrl = useBackendUrl();
    const handleUpload = async (files: FileList | null) => {
        if (!files) {
            return;
        }
        for (let i = 0; i < files.length; i++) {
            let readRes = {} as ReadResp;
            try {
                readRes = await readFileContent(files[i]);
            } catch (error) {
                console.error(error);
                toast({ title: "Upload failed", description: "Failed to read the file", duration: Infinity });
            }
            const formData = new FormData();
            const uploadId = uuidv4();
            formData.append("fileb", files[i]);
            formData.append("upload_id", uploadId);
            // formData.append("user_id", user?.email as string);
            formData.append("mode", "fast");
            formData.append("module", "document_pack");
            formData.append("pack_id", params.get("pack_id") as string);
            const resp = await fetch(`${backendUrl}/api/v1/users/${user?.email}/uploads/document`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            if (!resp.ok) {
                console.error(`File upload failed: ${JSON.stringify(data)}`);
                toast({ title: "Upload failed", description: "Failed to upload the file", duration: Infinity });
            }
        }
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };
    const workflowHandler = async (files: FileList | null) => {
        setWorkflowStage(Workflow.Upload);
        setOpen(true);
        localStorage.setItem(`document_repo_run_${params.get("pack_id")}`, "true");
        await handleUpload(files);
        socket?.emit("build_document_pack", { "pack_id": params.get("pack_id") }, async (resp: string) => {
            if (resp !== "done") {
                console.error("failed to create document pack");
                toast({ title: "Failed to create document pack", variant: "destructive", description: "Please check server logs for more information" });
                setTimeout(() => setOpen(false), 100);
                return;
            }
            await queryClient.invalidateQueries(["listPackDocs", params.get("pack_id")] as InvalidateQueryFilters);
            await queryClient.refetchQueries(["listPackDocs", params.get("pack_id")] as RefetchQueryFilters);
            localStorage.removeItem(`document_repo_run_${params.get("pack_id")}`);
            setTimeout(() => setOpen(false), 100);
        });
    }

    useEffect(() => {
        if (error) {
            toast({ title: "Failed to list documents", variant: "destructive" });
        }
    }, [error]);

    const resolveWorkflowStage = (stage: string) => {
        switch (stage) {
            default:
                return;
            case "fail":
                localStorage.removeItem(`document_repo_run_${params.get("pack_id")}`);
                return;
            case "uploading":
                setWorkflowStage(Workflow.Upload);
                return;
            case "parsing":
                setWorkflowStage(Workflow.Parse);
                return;
            case "preprocessing":
                setWorkflowStage(Workflow.Preprocess);
                return;
            case "indexing":
                setWorkflowStage(Workflow.Index);
                return;
            case "finalizing":
                setWorkflowStage(Workflow.Finalize);
                return;
            case "done":
                localStorage.removeItem(`document_repo_run_${params.get("pack_id")}`);
                setOpen(false);
                return;
        }
    }

    useEffect(() => {
        if (params.get("pack_id")) {
            const hasActiveRun = localStorage.getItem(`document_repo_run_${params.get("pack_id")}`);
            if (hasActiveRun === "true") {
                getWorkflowStatus(params.get("pack_id") as string).then((resp) => {
                    resolveWorkflowStage(resp);
                    setOpen(true);
                });
            }
        }

    }, [params.get("pack_id")]);

    useEffect(() => {
        if (!params.get("pack_id")) {
            return;
        }
        socket?.emit("join_pack_room", { "room_id": params.get("pack_id") });
        socket?.on("workflow_update", (data: { stage: string }) => {
            // console.log("update:", data);
            resolveWorkflowStage(data.stage);
        });
        return () => {
            socket?.off("workflow_update");
        }
    }, [socket, params.get("pack_id")]);

    if (isLoading || userLoading) {
        return (
            <Loading />
        );
    }

    if (userError || !params.get("pack_id")) {
        router.push("/forbidden");
    }

    return (
        <>
            <input
                ref={inputRef}
                className="hidden"
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => workflowHandler(e.target.files)}
            />
            <div className="flex h-full w-full">
                <Dialog open={snippetDialogOpen} onOpenChange={(open) => setSnippetDialogOpen(open)} modal>
                    {selectedSnippet &&
                        <DialogContent className="p-2 border rounded-lg w-[40vw] max-w-none overflow-auto h-[80vh]">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedSnippet.document_title}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="dark:bg-slate-900 bg-slate-200 mt-2 p-4 rounded-lg gap-x-2 overflow-auto max-h-[75vh]">
                                <MemoizedReactMarkdown
                                    className="flex flex-col mx-auto prose break-words dark:prose-invert prose-p:leading-relaxed md:text-sm text-xs"
                                    remarkPlugins={[remarkGfm]}
                                >
                                    {selectedSnippet.text}
                                </MemoizedReactMarkdown>
                            </div>
                        </DialogContent>
                    }
                </Dialog>
                <AlertDialog open={open}>
                    <AlertDialogContent className="w-[60vw] max-w-none">
                        <AlertDialogHeader>
                            <AlertDialogDescription>This may take a while depending on the complexity and number of the documents. You can refresh or close this window and come back to check the status any time.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex flex-col">
                            <div className="flex space-x-2">
                                {workflowStage === Workflow.Upload && <IconSpinner className="animate-spin" />}
                                {workflowStage > Workflow.Upload && <IconCheck />}
                                <span>Uploading documents</span>
                            </div>
                            <div className="flex space-x-2">
                                {workflowStage === Workflow.Parse && <IconSpinner className="animate-spin" />}
                                {workflowStage > Workflow.Parse && <IconCheck />}
                                <span className={`${(workflowStage < 1) ? 'pl-2' : ''}`}>Parsing documents</span>
                            </div>
                            <div className="flex space-x-2">
                                {workflowStage === Workflow.Preprocess && <IconSpinner className="animate-spin" />}
                                {workflowStage > Workflow.Preprocess && <IconCheck />}
                                <span className={`${(workflowStage < 2) ? 'pl-2' : ''}`}>Pre-processing documents</span>
                            </div>
                            <div className="flex space-x-2">
                                {workflowStage === Workflow.Index && <IconSpinner className="animate-spin" />}
                                {workflowStage > Workflow.Index && <IconCheck />}
                                <span className={`${(workflowStage < 3) ? 'pl-2' : ''}`}>Indexing documents</span>
                            </div>
                            <div className="flex space-x-2">
                                {workflowStage === Workflow.Finalize && <IconSpinner className="animate-spin" />}
                                {workflowStage > Workflow.Finalize && <IconCheck />}
                                <span className={`${(workflowStage < 4) ? 'pl-2' : ''}`}>Finalizing</span>
                            </div>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="relative left-0 z-0 flex h-full">
                    <div
                        className='flex h-full flex-col border-slate-300 bg-background dark:border-slate-700 transition-all duration-300'
                    >
                        <Sidebar
                            highlight={false}
                            showChatList={false}
                            moduleName="jarvis"
                            userId={user?.email as string}
                        />
                    </div>
                </div>
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={30}>
                        <div className="h-[100vh] px-4 overflow-auto">
                            <div className="max-w-3xl mx-auto dark:bg-slate-900 shadow-lg rounded-lg py-8 px-6 min-h-[90vh]">
                                <h1 className="text-2xl font-semibold dark:text-purple-400 mb-4">Documents</h1>
                                <div className="bg-transparent p-4 rounded-lg w-full space-y-4">
                                    {/* Upload Button */}
                                    <div className="flex justify-end gap-x-2">
                                        <Button
                                            variant="ghost"
                                            className="group border flex items-center gap-3 px-0 pl-2 py-2 text-sm font-medium text-slate-700 transition-all hover:text-purple-500 dark:text-slate-300 dark:hover:text-purple-400"
                                            type="button"
                                            onClick={() => inputRef.current?.click()}
                                        >
                                            <>
                                                <svg
                                                    className="w-4 h-4"
                                                    viewBox="0 0 15 15"
                                                    strokeWidth={2}
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M7.81825 1.18188C7.64251 1.00615 7.35759 1.00615 7.18185 1.18188L4.18185 4.18188C4.00611 4.35762 4.00611 4.64254 4.18185 4.81828C4.35759 4.99401 4.64251 4.99401 4.81825 4.81828L7.05005 2.58648V9.49996C7.05005 9.74849 7.25152 9.94996 7.50005 9.94996C7.74858 9.94996 7.95005 9.74849 7.95005 9.49996V2.58648L10.1819 4.81828C10.3576 4.99401 10.6425 4.99401 10.8182 4.81828C10.994 4.64254 10.994 4.35762 10.8182 4.18188L7.81825 1.18188ZM2.5 9.99997C2.77614 9.99997 3 10.2238 3 10.5V12C3 12.5538 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2238 12.2239 9.99997 12.5 9.99997C12.7761 9.99997 13 10.2238 13 10.5V12C13 13.104 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2238 2.22386 9.99997 2.5 9.99997Z"
                                                        fill="currentColor"
                                                        fillRule="evenodd"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <span className="pr-2 text-xs">Upload Document</span>
                                            </>
                                        </Button>
                                    </div>
                                    {/* Document List */}
                                    <div className="border rounded-md h-[70%] overflow-auto">
                                        {data?.docs && data?.docs.length > 0 ? (
                                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {data.docs.map((doc) => (
                                                    <li
                                                        key={doc.id}
                                                        className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <p className="text-sm font-medium">{doc.name}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                No documents available. Upload a new one!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={70} >
                        <div className="h-[95vh] overflow-auto">
                            <div className="p-4 space-y-2 h-full overflow-auto">
                                <h1 className="text-2xl font-semibold dark:text-purple-400">Snippet Search</h1>
                                <span className="dark:text-slate-500 text-slate-400 text-xs">Here you can search for relevant document snippets. Simply enter your query and press enter to see the results.</span>
                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        if (queryRunning) {
                                            return;
                                        }
                                        setQueryRunning(true);
                                        socket?.emit("query_docs", { "pack_id": params.get("pack_id"), "query": searchQuery }, (resp: QueryResp) => {
                                            setSearchSummary(resp.response);
                                            setSearchResults(resp.context_enriched.sources);
                                            setTimeout(() => setQueryRunning(false), 100);
                                            // console.log(resp["context_enriched"]);
                                        })
                                    }}
                                >
                                    <Input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search here"
                                        disabled={queryRunning}
                                    />
                                </form>
                                <div className="gap-2 mt-4 flex w-full border rounded-lg p-4 min-h-[70vh] overflow-auto">
                                    {queryRunning &&
                                        <div className='flex w-full h-full mx-auto my-auto items-center justify-center'>
                                            <HashLoader color="#94a3b8" />
                                        </div>
                                    }
                                    {searchSummary.length === 0 && !queryRunning &&
                                        <div className="flex items-center justify-center w-full h-full p-6">
                                            <div className="text-center">
                                                <svg
                                                    className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M11 17a4 4 0 100-8 4 4 0 000 8zm0 0v5m6-5a9 9 0 11-12 0 9 9 0 0112 0z"
                                                    ></path>
                                                </svg>
                                                <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                                                    You will be able to see your results here
                                                </p>
                                            </div>
                                        </div>
                                    }
                                    {searchSummary.length > 0 && !queryRunning &&
                                        <ResizablePanelGroup
                                            direction="horizontal"
                                            className="h-full items-stretch"
                                        >
                                            <ResizablePanel defaultSize={70}>
                                                <div className="flex flex-col flex-1 pr-4 min-h-[65vh] overflow-auto">
                                                    <h1 className="text-xl">Search Summary</h1>
                                                    <div className="dark:bg-slate-900 bg-slate-200 mt-2 p-4 rounded-lg gap-x-2 overflow-auto max-h-[75vh]">
                                                        <MemoizedReactMarkdown
                                                            className="flex flex-col mx-auto prose break-words dark:prose-invert prose-p:leading-relaxed md:text-sm text-xs"
                                                            remarkPlugins={[remarkGfm]}
                                                        >
                                                            {searchSummary}
                                                        </MemoizedReactMarkdown>
                                                    </div>
                                                </div>
                                            </ResizablePanel>
                                            <ResizableHandle withHandle />
                                            <ResizablePanel defaultSize={30}>
                                                <div className="flex flex-col flex-1 pl-4 min-h-[65vh] overflow-auto gap-2">
                                                    <h1 className="text-xl">Matching Documents</h1>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500">Click to view the relevant snippets</span>
                                                    {searchResults.map((r, i) => {
                                                        return (
                                                            <Button
                                                                variant="outline"
                                                                key={i}
                                                                className="max-w-full truncate"
                                                                onClick={() => {
                                                                    setSelectedSnippet(r);
                                                                    setSnippetDialogOpen(true);
                                                                }}>
                                                                <span className="truncate inline-block max-w-full">{`Snippet ${i + 1} (${r.document_title})`}</span>
                                                            </Button>
                                                        );
                                                    })}


                                                </div>
                                            </ResizablePanel>
                                        </ResizablePanelGroup>
                                    }
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </>
    );
}