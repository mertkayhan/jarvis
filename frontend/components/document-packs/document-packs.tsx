'use client'

import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NewDocumentPack } from "./new-document-pack";
import { ExistingDocumentPacks } from "./existing-document-packs";

interface DocumentPacksProps {
    highlightStyle: string
    selectedStyle: string
    userId: string
}


export function DocumentPacks({ highlightStyle, selectedStyle, userId }: DocumentPacksProps) {
    return (
        <Tooltip>
            <Dialog modal={false}>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className={`${highlightStyle} ${selectedStyle} rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 md:h-6 md:w-6"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 7h-3a2 2 0 0 1-2-2V2" /><path d="M21 6v6.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5H17Z" /><path d="M7 8v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H15" /><path d="M3 12v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H11" />
                            </svg>
                            <span className="sr-only">Document Packs</span>
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                    Document Packs
                </TooltipContent>
                <DialogContent className="max-w-none border w-[80vw] h-[80vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 p-10 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
                    <div className="flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text">Document Packs</DialogTitle>
                            <DialogDescription className="text-base text-gray-500 dark:text-gray-400 mb-4">
                                Manage your domain specific documents easily.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 h-full">
                            <Tabs defaultValue="existing">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing" className="data-[state=active]:dark:bg-slate-900 data-[state=active]:bg-slate-300 text-indigo-500">Existing Packs</TabsTrigger>
                                    <TabsTrigger value="create" className="data-[state=active]:dark:bg-slate-900 data-[state=active]:bg-slate-300 text-indigo-500">Create New Pack</TabsTrigger>
                                </TabsList>
                                <TabsContent value="create">
                                    <NewDocumentPack userId={userId} />
                                </TabsContent>
                                <TabsContent value="existing">
                                    <ExistingDocumentPacks />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Tooltip>
    )
}