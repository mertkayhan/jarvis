'use client'

import { useEffect, useState, useTransition } from "react";
import { deletePack, listPacks, ListPacksResp, updatePack } from "./question-packs-actions";
import { ClimbingBoxLoader } from "react-spinners";
import { Button, buttonVariants } from "../ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTrigger } from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { IconSpinner } from "../ui/icons";
import { QuestionPack } from "@/lib/types";

interface ExistingQuestionPacksProps {
    userId: string
    moduleName: string
}


export function ExistingQuestionPacks({ userId, moduleName }: ExistingQuestionPacksProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["listPacks"],
        queryFn: () => listPacks(userId),
        enabled: !!userId
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deletePack(id),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPacks"], (old: ListPacksResp) => {
                return { packs: old.packs.filter((p) => p.id !== resp.id) };
            });
            toast({ title: "Successfully deleted question pack" });
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to delete question pack", variant: "destructive" });
        }
    }, queryClient);

    useEffect(() => {
        if (error) {
            toast({ title: "Failed to list question packs", variant: "destructive" });
        }
    }, [error]);

    if (isLoading || deleteMutation.isPending) {
        return (
            <div className="flex w-full h-full items-center justify-center mx-auto my-auto">
                <ClimbingBoxLoader color="#94a3b8" size={20} />
            </div>
        )
    }

    if (!data?.packs.length) {
        return (
            <div className="w-full h-full flex flex-1 flex-col items-center justify-center p-10">
                <span className="text-sm dark:text-slate-400 text-slate-500 p-4">
                    No question packs found, please create one in the next tab.
                </span>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full h-full flex-grow overflow-y-auto max-h-[600px] border p-4">
            <div className="flex flex-col w-full h-full space-y-2">
                {data.packs.map((pack, i) => (
                    <AlertDialog key={i}>
                        <div
                            className="flex items-center justify-between rounded-lg p-3 dark:hover:bg-slate-800 hover:bg-slate-200 transition-colors duration-200"
                            key={i}
                        >
                            <a
                                href={`/question-repo?pack_id=${pack.id}`}
                                className="flex flex-col w-full mr-4"
                            >
                                <span className="font-medium truncate">{pack.name}</span>
                                <span className="text-slate-500 text-xs break-words leading-tight">
                                    {pack.description}
                                </span>
                            </a>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:text-blue-500 flex justify-center items-center"
                                    type="button"
                                    key={i}
                                >
                                    <svg
                                        className="w-5 h-5"
                                        viewBox="0 0 15 15"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                    </svg>
                                </Button>
                            </AlertDialogTrigger>
                            <EditDialog pack={pack} />
                            <Button
                                className="hover:text-red-500 hover:bg-transparent p-2 rounded-full"
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    deleteMutation.mutate(pack.id);
                                }}
                                aria-label={`Delete ${pack.name}`}
                            >
                                <svg
                                    className="w-5 h-5 md:w-6 md:h-6"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z"
                                        fill="currentColor"
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                    ></path>
                                </svg>
                            </Button>
                        </div>
                    </AlertDialog>
                ))}
            </div>
        </div>
    )
}

interface EditDialogProps {
    pack: QuestionPack
}

function EditDialog({ pack }: EditDialogProps) {
    const [currentName, setCurrentName] = useState(pack.name);
    const [currentDescription, setCurrentDescription] = useState(pack.description);
    const [transitioning, startTransition] = useTransition();

    const reset = () => {
        setCurrentName(pack.name);
        setCurrentDescription(pack.description);
    };

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: (pack: QuestionPack) => updatePack(pack),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPacks"], (old: ListPacksResp) => {
                return { packs: old.packs.map((p) => (p.id === resp.id) ? { id: resp.id, description: resp.description, name: resp.name } : p) };
            });
            toast({ title: "Successfully updated question pack" });
        },
        onError: (error) => {
            console.error("error updating question pack:", error);
            toast({ title: "Failed to update question pack", variant: "destructive" });
        }
    }, queryClient);

    return (
        <AlertDialogContent>
            <AlertDialogHeader>Edit {pack.name}</AlertDialogHeader>
            <AlertDialogDescription>
                You can make your updates here and click save when you are done.
            </AlertDialogDescription>
            <Label>Name</Label>
            <Input
                className="w-full text-sm"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
            />
            <Label>Description</Label>
            <textarea
                className="flex bg-transparent border resize-none w-full focus:outline-none p-2 text-sm rounded-lg"
                rows={4}
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
            />
            <AlertDialogFooter>
                <AlertDialogCancel
                    className={cn(buttonVariants({ variant: "outline" }))}
                    onClick={() => reset()}
                    disabled={updateMutation.isPending || transitioning}
                >
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                    className={cn(buttonVariants({ variant: "secondary" }))}
                    disabled={updateMutation.isPending || transitioning}
                    onClick={() => {
                        startTransition(() => updateMutation.mutate({
                            id: pack.id,
                            description: currentDescription,
                            name: currentName
                        } as QuestionPack));
                    }}
                >
                    {(updateMutation.isPending || transitioning) && <IconSpinner className="mr-2 animate-spin" />}
                    Save
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}