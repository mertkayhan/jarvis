'use client'

import { useToast } from "@/lib/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Dispatch, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Command } from "../ui/command";
import { IconSpinner } from "../ui/icons";
import { cn } from "@/lib/utils";
import { listAllTags } from "./question-actions";
import { QuestionFilter } from "@/lib/types";

interface MultiSelectTagsProps {
    packId?: string | null
    filter: QuestionFilter
    dispatch: Dispatch<any>
}

export function MultiSelectTags({ packId, filter, dispatch }: MultiSelectTagsProps) {
    const [open, setOpen] = useState(false);
    const { data, isLoading, error } = useQuery({
        queryKey: ["listAllTags", packId],
        queryFn: () => listAllTags(packId as string),
        enabled: !!packId
    });
    const { toast } = useToast();
    useEffect(() => {
        if (error) {
            toast({ title: "Failed to list tags", variant: "destructive" });
        }
    }, [error]);

    const handleSelect = (currentValue: string) => {
        (filter.tags.has(currentValue)) ? dispatch({ type: "REMOVE TAG", value: currentValue }) : dispatch({ type: "ADD TAG", value: currentValue });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {filter.tags.size > 0
                        ? `${filter.tags.size} item(s) selected`
                        : "Select values..."}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search options..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No options found.</CommandEmpty>
                        <CommandGroup>
                            {isLoading && <IconSpinner className="animate-spin" />}
                            {!isLoading && data?.tags && data?.tags.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={() => handleSelect(option)}
                                >
                                    {option}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            filter.tags.has(option) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}