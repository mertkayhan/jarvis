'use client';

import { useQuery } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { listPersonalities } from "./personality-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "../ui/button";
import { IconArrowRight } from "../ui/icons";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { ClipLoader } from "react-spinners";
import { Personality } from "@/lib/types";

interface PersonalitySelectionMenuProps {
    title: string | undefined;
    userId: string;
    setSelectedPersonality: Dispatch<SetStateAction<Personality | undefined>>;
}


export function PersonalitySelectionMenu({ title, userId, setSelectedPersonality }: PersonalitySelectionMenuProps) {
    const [open, setOpen] = useState(false);

    const { data, error, isLoading } = useQuery({
        queryKey: ["listPersonalities", userId],
        queryFn: () => listPersonalities(userId),
        enabled: !!userId,
    });

    // const { toast } = useToast();
    useEffect(() => {
        if (error) {
            // toast({ title: "Failed to list personalities", variant: "destructive" });
            console.error("failed to list personalities");
        }
    }, [error]);

    return (
        <div className='flex'>
            <Button
                variant="ghost"
                className="group flex items-center gap-3 px-0 py-3 text-base font-medium text-slate-700 transition-all hover:text-indigo-500 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-transparent"
                onClick={() => {
                    setOpen(true);
                }}
            >
                <IconArrowRight className="h-5 w-5 group-hover:translate-x-1 text-slate-400 transition-transform group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400" />
                <span className='pr-2'>{title}</span>
            </Button>
            <CommandDialog modal={true} open={open} onOpenChange={setOpen}>
                <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-xl shadow-md dark:from-slate-800 dark:via-slate-900 dark:to-black">
                    <CommandInput
                        className="mb-4 w-full rounded-md border border-slate-200 bg-white p-4 mt-6 text-slate-700 focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:ring-purple-400"
                        placeholder="Type a command or search..."
                    />
                    <CommandList className="max-h-48 overflow-y-auto">
                        {!isLoading && <CommandEmpty className="px-4 py-2 text-slate-600 dark:text-slate-400">
                            No results found.
                        </CommandEmpty>}
                        <CommandGroup heading="Suggestions">
                            {isLoading && <div className='flex flex-col w-full mx-auto items-center justify-center h-10'>
                                <ClipLoader color="#94a3b8" />
                            </div>}
                            {!isLoading && data?.personalities &&
                                data?.personalities.map((personality, i) => {
                                    return (
                                        <CommandItem
                                            className="cursor-pointer px-4 py-2 rounded-md hover:bg-purple-50 hover:text-purple-500 dark:hover:bg-slate-700 dark:hover:text-purple-400"
                                            onSelect={() => {
                                                //console.log("selected", personality.name);
                                                setSelectedPersonality(personality);
                                                setTimeout(() => { setOpen(false); }, 100);
                                            }}
                                            key={i}
                                        >
                                            {personality.name}
                                        </CommandItem>
                                    );
                                })}
                        </CommandGroup>
                    </CommandList>
                </div>
            </CommandDialog>
        </div>
    );
}