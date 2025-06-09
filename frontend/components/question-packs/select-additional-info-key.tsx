'use client';

import { useEffect, useState } from "react";
import { listAdditionalInfoKeys } from "./question-actions";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { IconSpinner } from "../ui/icons";
import { useToast } from "@/lib/hooks/use-toast";

interface SelectAdditionalInfoKeyProps {
    packId?: string | null;
    value: string;
    setValue: (value: string) => void;
}

export function SelectAdditionalInfoKey({ packId, value, setValue }: SelectAdditionalInfoKeyProps) {
    const [open, setOpen] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ["listAdditionalInfoKeys", packId],
        queryFn: () => listAdditionalInfoKeys(packId as string),
        enabled: !!packId
    });
    // const { toast } = useToast();
    useEffect(() => {
        if (error) {
            // toast({ title: "Failed to list additional information keys", variant: "destructive" });
            console.error("failed to list additional information keys");
        }
    }, [error]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? data?.keys.find((option) => option === value)
                        : "Select key..."}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search keys..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No key found.</CommandEmpty>
                        <CommandGroup>
                            {isLoading && <IconSpinner className="animate-spin" />}
                            {!isLoading && data?.keys.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    {option}
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === option ? "opacity-100" : "opacity-0"
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