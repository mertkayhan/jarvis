'use client'

import { useEffect, useState, useTransition } from "react";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { getAvailableModels, getUserModel, setUserModel } from "./model-selection-actions";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "../ui/command";
import { InvalidateQueryFilters, RefetchQueryFilters, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { models } from "@/lib/models";
import { IconSpinner } from "../ui/icons";

interface SelectionDialogProps {
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

export function SelectionDialog({ userId }: SelectionDialogProps) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("automatic");
    const [transitioning, startTransition] = useTransition();
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
        <DialogContent className="hidden w-[60vw] max-w-none md:flex flex-col justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-10 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black my-auto">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text my-auto">
                    Model Selection
                </DialogTitle>
                <DialogDescription>
                    Please select your LLM model below and click save. Automatic mode chooses the right LLM for the task and is recommended.
                </DialogDescription>
            </DialogHeader>
            <form className="flex flex-col space-y-4" onSubmit={(e) => {
                e.preventDefault();
                startTransition(() => mutation.mutate(value));
            }}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between dark:bg-slate-800 bg-slate-200 h-16"
                        >
                            {data
                                ? models?.find((model) => model.name === value)?.name
                                : "Select model name"}
                            {/* <ChevronsUpDown className="opacity-50" /> */}
                            <div className="flex flex-col justify-center">
                                <svg
                                    className="w-4 h-4 opacity-50"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                </svg>
                                <svg
                                    className="w-4 h-4 opacity-50"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                </svg>
                            </div>

                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[50vw] p-0" side="bottom">
                        <Command className="w-full flex flex-col">
                            {/* <CommandInput placeholder="Search model..." className="h-9" /> */}
                            <CommandList>
                                {/* <CommandEmpty>No framework found.</CommandEmpty> */}
                                <CommandGroup className="w-full flex-col flex">
                                    {models?.map((model) => (
                                        <CommandItem
                                            key={model.name}
                                            value={model.name}
                                            onSelect={(currentValue) => {
                                                setValue(currentValue === value ? "" : currentValue)
                                                setOpen(false)
                                            }}
                                            className="w-full flex flex-1"
                                        >
                                            <div className="flex flex-1 justify-between w-full">
                                                <span>{model.name}</span>
                                                {value === model.name &&
                                                    <svg
                                                        className="w-4 h-4"
                                                        viewBox="0 0 15 15"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path d="M7.49991 0.877045C3.84222 0.877045 0.877075 3.84219 0.877075 7.49988C0.877075 11.1575 3.84222 14.1227 7.49991 14.1227C11.1576 14.1227 14.1227 11.1575 14.1227 7.49988C14.1227 3.84219 11.1576 0.877045 7.49991 0.877045ZM1.82708 7.49988C1.82708 4.36686 4.36689 1.82704 7.49991 1.82704C10.6329 1.82704 13.1727 4.36686 13.1727 7.49988C13.1727 10.6329 10.6329 13.1727 7.49991 13.1727C4.36689 13.1727 1.82708 10.6329 1.82708 7.49988ZM10.1589 5.53774C10.3178 5.31191 10.2636 5.00001 10.0378 4.84109C9.81194 4.68217 9.50004 4.73642 9.34112 4.96225L6.51977 8.97154L5.35681 7.78706C5.16334 7.59002 4.84677 7.58711 4.64973 7.78058C4.45268 7.97404 4.44978 8.29061 4.64325 8.48765L6.22658 10.1003C6.33054 10.2062 6.47617 10.2604 6.62407 10.2483C6.77197 10.2363 6.90686 10.1591 6.99226 10.0377L10.1589 5.53774Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                                    </svg>
                                                }
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <DialogFooter className="justify-center my-4">
                    <DialogClose asChild>
                        <Button type="submit" variant="outline">
                            {(transitioning || mutation.isPending) && <IconSpinner className="animate-spin mr-2" />}
                            Save
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}