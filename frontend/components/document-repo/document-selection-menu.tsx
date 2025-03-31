'use client'

import { useQuery } from "@tanstack/react-query"
import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react"
import { listDocuments } from "./document-repo-actions"
import { useToast } from "@/lib/hooks/use-toast"
import { Button } from "../ui/button"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command"
import { Checkbox } from "../ui/checkbox"
import { ClipLoader } from "react-spinners"
import { TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip"
import { Tooltip, TooltipContent } from "../ui/tooltip"

interface DocumentSelectionMenuProps {
    userId: string
    setSelectedDocuments: Dispatch<SetStateAction<string[]>>
    selectedDocuments: string[]
    children?: ReactNode
    buttonStyle?: string
    buttonVariant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined
    tooltipContent?: string
    onOpenChange?: (open: boolean) => void
}

export function DocumentSelectionMenu({
    userId,
    setSelectedDocuments,
    selectedDocuments,
    children,
    buttonStyle,
    buttonVariant,
    tooltipContent,
    onOpenChange
}: DocumentSelectionMenuProps) {
    const [open, setOpen] = useState(false);
    const shouldHighlight = (docId: string) => selectedDocuments.includes(docId);

    const { data, isLoading, error } = useQuery({
        queryKey: ["listDocuments", userId],
        queryFn: () => listDocuments(userId),
        enabled: !!userId,
    });
    const { toast } = useToast();
    useEffect(() => {
        if (error) {
            toast({ title: "failed to fetch documents", variant: "destructive" });
        }
    }, [error]);

    return (
        <>
            {children &&
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={buttonVariant || "secondary"}
                                className={buttonStyle || "group flex items-center gap-3 px-0 py-3"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpen(true);
                                    if (onOpenChange) {
                                        onOpenChange(true);
                                    }
                                }}
                            >
                                {children}
                            </Button>
                        </TooltipTrigger>
                        {tooltipContent &&
                            <TooltipContent>
                                <p className='text-sm'>{tooltipContent}</p>
                            </TooltipContent>
                        }
                    </Tooltip>
                </TooltipProvider>
            }

            <CommandDialog modal={true} open={open} onOpenChange={(open) => {
                if (onOpenChange) {
                    onOpenChange(open);
                }
                setOpen(open)
            }}>
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
                            {!isLoading && data?.docs &&
                                data?.docs.map((doc, i) => {
                                    return (
                                        <CommandItem
                                            key={i}
                                            className="cursor-pointer px-4 py-2 rounded-md hover:bg-purple-50 hover:text-purple-500 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                                            onSelect={() => {
                                                // console.log("select item");
                                                if (!selectedDocuments.includes(doc.id)) {
                                                    setSelectedDocuments((old) => old.concat(doc.id));
                                                } else {
                                                    setSelectedDocuments((old) => [...old.filter((o) => o !== doc.id)]);
                                                }
                                            }}
                                        >
                                            <span className='flex items-center justify-center'>
                                                <Checkbox
                                                    className={`mx-2 ${(shouldHighlight(doc.id) ? 'bg-indigo-400' : '')}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (!selectedDocuments.includes(doc.id)) {
                                                            setSelectedDocuments((old) => old.concat(doc.id));
                                                        } else {
                                                            setSelectedDocuments((old) => [...old.filter((o) => o !== doc.id)]);
                                                        }
                                                    }}
                                                />
                                                {doc.name}
                                            </span>
                                        </CommandItem>
                                    )
                                }) ||
                                <div className='flex flex-col w-full mx-auto items-center justify-center h-10'>
                                    <ClipLoader color="#94a3b8" />
                                </div>
                            }
                        </CommandGroup>
                    </CommandList>
                    <div className='flex justify-end gap-2 mt-4'>
                        <Button
                            variant="secondary"
                            type='button'
                            disabled={selectedDocuments.length === 0 || data?.docs?.length === 0}
                            onClick={() => {
                                setSelectedDocuments([]);
                                setOpen(false);
                                if (onOpenChange) {
                                    onOpenChange(false);
                                }
                            }}
                        >
                            Clear selection
                        </Button>
                        <Button
                            variant="secondary"
                            type='button'
                            onClick={() => {
                                setOpen(false);
                                if (onOpenChange) {
                                    onOpenChange(false);
                                }
                            }}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </CommandDialog>
        </>
    )
}