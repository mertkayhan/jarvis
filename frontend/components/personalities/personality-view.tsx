'use client'

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Personality } from "@/lib/types";
import { AlertDialog, AlertDialogContent } from "../ui/alert-dialog";
import { AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
import { useState } from "react";
import { Tooltip, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { DeleteButton, DeleteDefaultButton, EditButton, MakeDefaultButton, MakeGlobalButton } from "./buttons";
import { DeleteDialog } from "./delete-dialog";
import { EditDialog } from "./edit-dialog";

interface PersonalityViewProps {
    personality: Personality
    userId: string
}

export function PersonalityView({ personality, userId }: PersonalityViewProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState("");

    return (
        <AlertDialog open={open}>
            <AccordionItem
                value={personality.id}
                className="border hover:dark:bg-slate-800 hover:bg-slate-200 px-4 rounded-lg data-[state=open]:dark:bg-slate-800 data-[state=open]:bg-slate-200"
            >
                <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 justify-between items-center pr-4">
                        <div className="w-full flex justify-start items-start flex-col">
                            <span className="p-2 underline">{personality.name}</span>
                            <div className="flex justify-start items-start w-full gap-x-2 min-h-6">
                                {personality.owner === "system" &&
                                    <span className="inline-flex items-center gap-x-2 rounded-full bg-blue-600/20 px-2.5 py-1 text-xs md:text-sm font-semibold leading-5 text-indigo-400">
                                        <span className="inline-block bg-blue-600"></span>
                                        <span className="pr-2">global</span>
                                    </span>
                                }
                                {personality.isDefault &&
                                    <span className="inline-flex items-center gap-x-2 rounded-full bg-blue-600/20 px-2.5 py-1 text-xs md:text-sm font-semibold leading-5 text-indigo-400">
                                        <span className="inline-block bg-blue-600"></span>
                                        <span className="pr-2">default</span>
                                        <DeleteDefaultButton userId={userId} />
                                    </span>
                                }
                            </div>
                        </div>
                        <div className="flex w-full justify-end">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <EditButton setOpen={setOpen} setType={setType} />
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
                </AccordionTrigger>
                <AccordionContent>
                    <div className="flex flex-col dark:bg-slate-800 bg-slate-200 p-4 rounded-lg space-y-4">
                        <Label>Description</Label>
                        <div className="flex space-y-4 items-center justify-center flex-1 space-x-2">
                            <Input
                                disabled
                                value={personality.description}
                                className="border flex"
                                autoFocus
                            />
                        </div>
                        <Label>Tools</Label>
                        <Input
                            disabled
                            value={personality.tools?.join(", ")}
                            className="border flex"
                            autoFocus
                        />
                        <Label>Instructions</Label>
                        <div className="flex space-y-4 justify-center items-center flex-1 space-x-2 overflow-hidden">
                            <textarea
                                disabled
                                value={personality.instructions}
                                className="border flex flex-col w-full resize-none bg-transparent p-3 text-gray-400"
                                rows={4}
                            />
                        </div>
                        <div className="flex">
                            <MakeGlobalButton owner={personality.owner} personalityId={personality.id} userId={userId} />
                            <MakeDefaultButton isDefault={personality.isDefault} personalityId={personality.id} userId={userId} />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AlertDialogContent>
                {type === "delete" &&
                    <DeleteDialog personalityId={personality.id} setOpen={setOpen} userId={userId} />
                }
                {type === "edit" &&
                    <EditDialog personality={personality} userId={userId} setOpen={setOpen} />
                }
            </AlertDialogContent>
        </AlertDialog>
    );
}