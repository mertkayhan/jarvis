'use client'

import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NewQuestionPack } from "./new-question-pack";
import { ExistingQuestionPacks } from "./existing-question-packs";


interface QuestionPacksProps {
    highlightStyle: string
    selectedStyle: string
    userId: string
    moduleName: string
}


export function QuestionPacks({ highlightStyle, selectedStyle, userId, moduleName }: QuestionPacksProps) {
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
                                className="h-4 w-4 md:h-6 md:w-6"
                                viewBox="0 0 15 15"
                                fill="none"
                                strokeWidth={4}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M5.07505 4.10001C5.07505 2.91103 6.25727 1.92502 7.50005 1.92502C8.74283 1.92502 9.92505 2.91103 9.92505 4.10001C9.92505 5.19861 9.36782 5.71436 8.61854 6.37884L8.58757 6.4063C7.84481 7.06467 6.92505 7.87995 6.92505 9.5C6.92505 9.81757 7.18248 10.075 7.50005 10.075C7.81761 10.075 8.07505 9.81757 8.07505 9.5C8.07505 8.41517 8.62945 7.90623 9.38156 7.23925L9.40238 7.22079C10.1496 6.55829 11.075 5.73775 11.075 4.10001C11.075 2.12757 9.21869 0.775024 7.50005 0.775024C5.7814 0.775024 3.92505 2.12757 3.92505 4.10001C3.92505 4.41758 4.18249 4.67501 4.50005 4.67501C4.81761 4.67501 5.07505 4.41758 5.07505 4.10001ZM7.50005 13.3575C7.9833 13.3575 8.37505 12.9657 8.37505 12.4825C8.37505 11.9992 7.9833 11.6075 7.50005 11.6075C7.0168 11.6075 6.62505 11.9992 6.62505 12.4825C6.62505 12.9657 7.0168 13.3575 7.50005 13.3575Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                            <span className="sr-only">Question Repository</span>
                        </Button>
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                    Question Packs
                </TooltipContent>
                <DialogContent className="max-w-none border w-[80vw] h-[80vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 p-10 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
                    <div className="flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text">Question Packs</DialogTitle>
                            <DialogDescription className="text-base text-gray-500 dark:text-gray-400 mb-4">
                                Manage your domain specific question answer pairs easily.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 h-full">
                            <Tabs defaultValue="existing">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing" className="data-[state=active]:dark:bg-slate-900 data-[state=active]:bg-slate-300 text-indigo-500">Existing Packs</TabsTrigger>
                                    <TabsTrigger value="create" className="data-[state=active]:dark:bg-slate-900 data-[state=active]:bg-slate-300 text-indigo-500">Create New Pack</TabsTrigger>
                                </TabsList>
                                <TabsContent value="create">
                                    <NewQuestionPack userId={userId} />
                                </TabsContent>
                                <TabsContent value="existing">
                                    <ExistingQuestionPacks userId={userId} />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Tooltip>
    )
}