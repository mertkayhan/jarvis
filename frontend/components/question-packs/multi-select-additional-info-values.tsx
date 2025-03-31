'use client'

import { Dispatch, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { listAdditinalInfoValues } from "./question-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { IconSpinner } from "../ui/icons";
import { QuestionFilter } from "@/lib/types";

interface MultiSelectAdditionalInfoValuesProps {
    selectedKey: string
    packId?: string | null
    filter: QuestionFilter
    dispatch: Dispatch<any>
    index: number
}

export function MultiSelectAdditionalInfoValues({ selectedKey, packId, filter, dispatch, index }: MultiSelectAdditionalInfoValuesProps) {
    const [open, setOpen] = useState(false);
    const { data, isLoading, error } = useQuery({
        queryKey: ["listAdditionalInfoValues", selectedKey, packId],
        queryFn: () => listAdditinalInfoValues(selectedKey, packId as string),
        enabled: !!selectedKey.length && !!packId
    });
    const { toast } = useToast();
    useEffect(() => {
        if (error) {
            toast({ title: "Failed to list additional info values for the given key", variant: "destructive" });
        }
    }, [error]);

    const handleSelect = (currentValue: string) => {
        return (filter.additionalInfo[index].value.has(currentValue))
            ? dispatch({ type: "REMOVE ADDITIONAL INFO VALUE", index: index, value: currentValue })
            : dispatch({ type: "ADD ADDITIONAL INFO VALUE", index: index, value: currentValue });
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
                    {filter.additionalInfo[index].value.size > 0
                        ? `${filter.additionalInfo[index].value.size} item(s) selected`
                        : "Select values..."}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search values..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No options found.</CommandEmpty>
                        <CommandGroup>
                            {isLoading && <IconSpinner className="animate-spin" />}
                            {!isLoading && data?.values && data?.values.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={() => handleSelect(option)}
                                >
                                    {option}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            filter.additionalInfo[index].value.has(option) ? "opacity-100" : "opacity-0"
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