"use client"

import * as React from "react"
import {
    Lightbulb,
    File,
    HelpCircle,
    FolderSearch2,
    PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { DocumentList } from "../document-repo/document-list"
import { useQuery } from "@tanstack/react-query"
import { listDocuments } from "../document-repo/document-repo-actions"
import { useToast } from "@/lib/hooks/use-toast"
import { UserDocument } from "@/lib/types"
import { UploadButton } from "../document-repo/buttons"
import { Skeleton } from "./skeleton"
import { Tooltip, TooltipTrigger } from "./tooltip"
import { TooltipContent } from "@radix-ui/react-tooltip"
import { ExistingQuestionPacks } from "../question-packs/existing-question-packs"
import { useRouter } from "next/navigation"

const data = {
    nav: [
        { name: "Documents", icon: File },
        { name: "Question Packs", icon: HelpCircle },
        { name: "Document Packs", icon: FolderSearch2 },
    ],
}

interface BuildDialogContentProps {
    selection: string,
    userId: string,
    data: UserDocument[] | null | undefined,
    uploadRunning: boolean
    setUploadRunning: React.Dispatch<React.SetStateAction<boolean>>
    docsLoading: boolean
}

function BuildDialogContent({ selection, userId, data, uploadRunning, setUploadRunning, docsLoading }: BuildDialogContentProps) {
    const router = useRouter();
    switch (selection) {
        case "Documents":
            return (
                <div className="flex flex-col w-full h-full p-4 space-y-2">
                    <header className="flex flex-col h-12 items-center">
                        <div className="items-center w-full justify-end flex">
                            <UploadButton
                                uploadRunning={uploadRunning}
                                userId={userId}
                                setUploadRunning={setUploadRunning}
                            />
                        </div>
                    </header>
                    {docsLoading &&
                        <div className="space-y-2">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                        ||
                        <DocumentList documents={data} userId={userId} />
                    }
                    <span className="text-xs text-slate-600 mt-2">Note: Your documents will be processed and parsed which can take some time depending on the complexity and number of pages.</span>
                </div>
            );
        case "Question Packs":
            return (
                <div className="flex flex-col w-full h-full p-4 space-y-2">
                    <header className="flex flex-col h-12 items-center">
                        <div className="items-center w-full justify-end flex">
                            <Button
                                onClick={() => router.push("/question-repo/new")}
                                variant="ghost"
                                className="group border flex items-center gap-3 px-0 pl-2 py-2 text-sm font-medium text-slate-700 transition-all hover:text-purple-500 dark:text-slate-300 dark:hover:text-purple-400"
                            >
                                <span className="pr-2 text-xs flex gap-x-2">
                                    <PlusCircle className="w-4 h-4" /> New Question Pack
                                </span>
                            </Button>
                        </div>
                    </header>
                    <ExistingQuestionPacks userId={userId} />
                </div>
            );
        case "Document Packs":
            return (
                <div className="flex mx-auto w-full h-full border rounded-lg items-center justify-center p-4 mt-20">
                    <span className="text-slate-400">Coming soon</span>
                </div>
            );
        default:
            return null;
    }
}

function useDocuments(userId: string) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["listDocuments", userId],
        queryFn: () => listDocuments(userId),
        enabled: !!userId,
    });
    const { toast } = useToast();
    React.useEffect(() => {
        if (error) {
            toast({
                title: "Failed to fetch documents",
                variant: "destructive"
            })
        }
    }, [error]);
    return { docs: data, docsLoading: isLoading };
}

export function SettingsDialog({ userId }: { userId: string }) {
    const [open, setOpen] = React.useState(false);
    const [selection, setSelection] = React.useState("Documents");
    const { docs, docsLoading } = useDocuments(userId);
    const [uploadRunning, setUploadRunning] = React.useState(false);

    return (
        <Dialog modal={false} open={open} onOpenChange={(open) => {
            setSelection("Documents");
            setOpen(open);
        }}>
            <Tooltip>
                <DialogTrigger asChild>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setOpen(true)}
                            className="rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200"
                        >
                            <Lightbulb className="h-4 w-4 md:h-6 md:w-6" />
                        </Button>
                    </TooltipTrigger>
                </DialogTrigger>
                <TooltipContent side="right" className="text-xs border p-2 rounded-lg">
                    Knowledge
                </TooltipContent>
            </Tooltip>
            <DialogContent className="overflow-hidden p-0 max-w-none w-[80vw] h-[80vh] bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
                <SidebarProvider className="items-start">
                    <Sidebar collapsible="none" className="hidden md:flex bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
                        <SidebarContent>
                            <SidebarGroup>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {data.nav.map((item) => (
                                            <SidebarMenuItem key={item.name} >
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={item.name === selection}
                                                    className="hover:text-purple-500 dark:text-slate-300 dark:hover:text-purple-400 dark:data-[active=true]:bg-slate-600 data-[active=true]:text-purple-500 dark:data-[active=true]:text-purple-400 data-[active=true]:bg-slate-200"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        className="justify-start flex w-full dark:hover:bg-slate-600 hover:bg-slate-200"
                                                        onClick={() => setSelection(item.name)}
                                                    >
                                                        <item.icon />
                                                        <span>{item.name}</span>
                                                    </Button>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>
                    </Sidebar>
                    <main className="flex h-[480px] flex-1 flex-col overflow-hidden p-4">
                        <BuildDialogContent
                            selection={selection}
                            userId={userId}
                            data={docs?.docs}
                            setUploadRunning={setUploadRunning}
                            uploadRunning={uploadRunning}
                            docsLoading={docsLoading}
                        />
                    </main>
                </SidebarProvider>
            </DialogContent>
        </Dialog>

    )
}
