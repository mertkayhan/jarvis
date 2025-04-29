'use client'

import { Personality } from "@/lib/types";
import { AlertDialog, AlertDialogContent } from "../ui/alert-dialog";
import { useState } from "react";
import { Tooltip, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { DeleteButton, DeleteDefaultButton, EditButton } from "./buttons";
import { DeleteDialog } from "./delete-dialog";

interface PersonalityViewProps {
    personality: Personality
    userId: string
}

export function PersonalityView({ personality, userId }: PersonalityViewProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState("");

    return (
        <AlertDialog open={open}>
            <div className="flex flex-1 justify-between items-center pr-4 hover:dark:bg-slate-800 hover:bg-slate-200 min-h-16">
                <div className="w-full flex justify-start items-start flex-col p-1">
                    <div className="flex space-x-2">
                        <span className="px-2 text-sm">{personality.name}</span>
                        {personality.owner === "system" &&
                            <span className="inline-flex items-center gap-x-2 rounded-full bg-blue-600/20 px-2.5 py-1 text-xs md:text-sm font-semibold leading-5 text-indigo-400">
                                <span className="inline-block bg-blue-600"></span>
                                <span className="pr-2 text-xs">global</span>
                            </span>
                        }
                        {personality.isDefault &&
                            <span className="inline-flex items-center gap-x-2 rounded-full bg-blue-600/20 px-2.5 py-1 text-xs md:text-sm font-semibold leading-5 text-indigo-400">
                                <span className="inline-block bg-blue-600"></span>
                                <span className="pr-2 text-xs">default</span>
                                <DeleteDefaultButton userId={userId} />
                            </span>
                        }
                    </div>
                    <span className="px-2 text-slate-400 dark:text-slate-500 text-xs">{personality.description}</span>

                </div>
                <div className="flex w-full justify-end">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <EditButton personalityId={personality.id} />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black p-2 rounded-lg">Edit personality</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DeleteButton setOpen={setOpen} setType={setType} />
                            </TooltipTrigger>
                            <TooltipContent className="bg-black p-2 rounded-lg">Delete personality</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <AlertDialogContent>
                {type === "delete" &&
                    <DeleteDialog personalityId={personality.id} setOpen={setOpen} userId={userId} />
                }
            </AlertDialogContent>
        </AlertDialog >
    );
}