"use client"

import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { InvalidateQueryFilters, RefetchQueryFilters, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAvailableModels, getUserModel, setUserModel } from "./model-selection-actions";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn } from "@/lib/utils";

interface ModelSelectionProps {
    userId: string
}

function useAvailableModels(userId: string) {
    const { data } = useQuery({
        queryKey: ["availableModels", userId],
        queryFn: () => getAvailableModels(userId),
        enabled: !!userId,
    });
    return { models: data?.models };

}

export function ModelSelection({ userId }: ModelSelectionProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    const { data } = useQuery({
        queryKey: ["getUserModel", userId],
        queryFn: () => getUserModel(userId),
        enabled: !!userId,
    });
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (modelName: string) => setUserModel(userId, modelName),
        onSuccess: async () => {
            await queryClient.invalidateQueries(["getUserModel", userId] as InvalidateQueryFilters);
            await queryClient.refetchQueries(["getUserModel", userId] as RefetchQueryFilters);
        },
        onError: (error) => {
            console.error("Error updating model:", error);
        },
    });
    useEffect(() => {
        if (data?.modelName) {
            setValue(data.modelName);
        }
    }, [data]);
    const { models } = useAvailableModels(userId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between text-xs"
                    size="sm"
                >
                    {data
                        ? models?.find((model) => model.name === value)?.name
                        : "Select model..."}
                    <ChevronsUpDown className="opacity-50 w-3 h-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search model..." className="h-9 text-xs" />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-xs text-slate-500">No model found.</CommandEmpty>
                        <CommandGroup>
                            {models?.map((model) => (
                                <CommandItem
                                    key={model.name}
                                    value={model.name}
                                    onSelect={(currentValue) => {
                                        mutation.mutate(currentValue);
                                        setValue(currentValue);
                                        setOpen(false);
                                    }}
                                    className='text-xs'
                                >
                                    {model.name}
                                    <Check
                                        className={cn(
                                            "ml-auto w-3 h-3",
                                            value === model.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover >
    )
}