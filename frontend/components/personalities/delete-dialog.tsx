'use client'

import { cn } from "@/lib/utils";
import { AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader } from "../ui/alert-dialog";
import { buttonVariants } from "../ui/button";
import { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePersonality, ListPersonalitiesResp } from "./personality-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { IconSpinner } from "../ui/icons";

interface DeleteDialogProps {
    personalityId: string
    setOpen: Dispatch<SetStateAction<boolean>>
    userId: string
}

export function DeleteDialog({ personalityId, setOpen, userId }: DeleteDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const deleteMutation = useMutation({
        mutationFn: (personalityId: string) => deletePersonality(userId, personalityId),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPersonalities", userId], (old: ListPersonalitiesResp) => {
                if (!old.personalities) {
                    return null;
                }
                return { personalities: old.personalities.filter((p) => p.id !== resp.id) };
            });
            toast({ title: "Successfully deleted personality" });
            setOpen(false);
        },
        onError: (error) => {
            console.error("Error deleting personality:", error);
            toast({ title: "Failed to delete personality", variant: "destructive" });
        },
    }, queryClient);

    return (
        <>
            <AlertDialogHeader>Are you sure?</AlertDialogHeader>
            <AlertDialogDescription>
                This will permanently delete this personality and remove it from our servers.
            </AlertDialogDescription>
            <AlertDialogFooter>
                <AlertDialogCancel
                    className={cn(buttonVariants({ variant: "outline" }))}
                    onClick={() => setOpen(false)}
                    disabled={deleteMutation.isPending}
                >
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                    className={cn(buttonVariants({ variant: "destructive" }))}
                    disabled={deleteMutation.isPending}
                    onClick={(e) => {
                        e.preventDefault();
                        deleteMutation.mutate(personalityId);
                    }}
                >
                    {deleteMutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </>
    );
}