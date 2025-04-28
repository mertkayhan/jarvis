'use client'

import { useEffect } from "react";
import { deletePack, listPacks, ListPacksResp } from "./question-packs-actions";
import { Button } from "../ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

interface ExistingQuestionPacksProps {
    userId: string
}


export function ExistingQuestionPacks({ userId }: ExistingQuestionPacksProps) {
    const router = useRouter();
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

    if (isLoading) {
        return (
            <div className="flex w-full h-full items-center justify-center mx-auto my-auto">
                <div className="space-y-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                </div>
            </div>
        )
    }

    if (!data?.packs.length) {
        return (
            <div className="w-full h-full flex flex-1 flex-col items-center justify-center p-10 border rounded-lg">
                <span className="text-sm dark:text-slate-400 text-slate-500 p-4">
                    No question packs found
                </span>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full h-full flex-grow overflow-y-auto max-h-[600px] border py-2 rounded-lg">
            <div className="flex flex-col w-full h-full space-y-2">
                {data.packs.map((pack, i) => (
                    <div
                        className="flex items-center justify-between p-2 dark:hover:bg-slate-800 hover:bg-slate-200 transition-colors duration-200"
                        key={i}
                    >
                        <a
                            href={`/question-repo?pack_id=${pack.id}`}
                            className="flex flex-col w-full mx-4"
                        >
                            <span className="font-medium truncate text-xs">{pack.name}</span>
                            <span className="text-slate-500 text-xs break-words leading-tight">
                                {pack.description}
                            </span>
                        </a>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-blue-500 flex justify-center items-center"
                            type="button"
                            key={i}
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(`/question-repo/${pack.id}`);
                            }}
                        >
                            <svg
                                className="w-4 h-4"
                                viewBox="0 0 15 15"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                        </Button>
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
                                className="w-4 h-4"
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
                    </div>))}
            </div>
        </div>
    )
}