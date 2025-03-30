'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { NewPersonality } from "./new-personality";
import { ExistingPersonalities } from "./existing-personalities";
import { Dialog, DialogTrigger, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { useEffect, useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { listPersonalities } from "@/components/personalities/personality-actions";
import { ClimbingBoxLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

interface PersonalitiesProps {
    userId: string
    highlightStyle: string
}

export function Personalities({ userId, highlightStyle }: PersonalitiesProps) {
    const { data, error, isLoading } = useQuery({
        queryKey: ["listPersonalities", userId],
        queryFn: () => listPersonalities(userId),
        enabled: !!userId,
    });
    const { toast } = useToast();
    useEffect(() => {
        if (error) {
            toast({ title: "Failed to list personalities", variant: "destructive" });
        }
    }, [error]);

    return (
        <Dialog modal={false}>
            <Tooltip>
                <DialogTrigger asChild>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            className={`${highlightStyle} rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200`}
                            type="button"
                        >
                            <svg
                                className="w-4 h-4 md:w-6 md:h-6"
                                viewBox="0 0 15 15"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                        </Button>
                    </TooltipTrigger>
                </DialogTrigger>
                <TooltipContent side="right">Personalities</TooltipContent>
            </Tooltip>
            <DialogContent className="hidden md:flex max-w-none w-[80vw] h-[80vh] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-10 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
                {isLoading &&
                    <div className="flex w-full h-full items-center justify-center mx-auto my-auto">
                        <ClimbingBoxLoader color="#94a3b8" size={20} />
                    </div>
                }
                {!isLoading && <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                    <Tabs defaultValue="existing">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="existing" className="data-[state=active]:dark:bg-slate-900 data-[state=active]:bg-slate-300 text-indigo-500">Existing Personalities</TabsTrigger>
                            <TabsTrigger value="create" className="data-[state=active]:dark:bg-slate-900 data-[state=active]:bg-slate-300 text-indigo-500">Create New Personality</TabsTrigger>
                        </TabsList>
                        <TabsContent value="create">
                            <NewPersonality userId={userId} />
                        </TabsContent>
                        <TabsContent value="existing">
                            <ExistingPersonalities
                                personalities={data?.personalities}
                                userId={userId}
                            />
                        </TabsContent>
                    </Tabs>
                </div>}
            </DialogContent>
        </Dialog>
    )
}