'use client'

import { InvalidateQueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { deleteDefaultPersonality, ListPersonalitiesResp, makePersonalityGlobal, setDefaultPersonality } from "./personality-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { Dispatch, SetStateAction } from "react";

interface DeleteDefaultButtonProps {
    userId: string
}

export function DeleteDefaultButton({ userId }: DeleteDefaultButtonProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const deleteDefaultMutation = useMutation({
        mutationFn: (userId: string) => deleteDefaultPersonality(userId),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPersonalities", userId], (old: ListPersonalitiesResp) => {
                if (!old.personalities) {
                    return null;
                }
                return { personalities: old.personalities.map((p) => (p.id === resp.id) ? { ...p, isDefault: false } : p) };
            });
            toast({ title: "Successfully unset default personality" });
        },
        onError: (error) => {
            console.error("Error deleting default personality:", error);
        },
    }, queryClient);

    return (
        <Button
            variant="ghost"
            size="icon" type="button"
            className="p-0 w-3 h-4 round overflow-hidden"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteDefaultMutation.mutate(userId);
            }}
        >
            <svg
                className="w-3 h-3"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
        </Button>
    );
}

interface EditButtonProps {
    setType: Dispatch<SetStateAction<string>>
    setOpen: Dispatch<SetStateAction<boolean>>
}

export function EditButton({ setType, setOpen }: EditButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="hover:text-blue-500 flex justify-center items-center"
            type="button"
            onClick={(e) => {
                e.preventDefault();
                setType("edit");
                setOpen(true);
            }}
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
    );
}

interface DeleteButtonProps {
    setType: Dispatch<SetStateAction<string>>
    setOpen: Dispatch<SetStateAction<boolean>>
}

export function DeleteButton({ setOpen, setType }: DeleteButtonProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="hover:text-red-500 flex justify-center items-center"
            type="button"
            onClick={e => {
                e.preventDefault();
                setType("delete");
                setOpen(true);
            }}
        >
            <svg
                className="w-5 h-5"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H5H10H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4L3.5 4C3.22386 4 3 3.77614 3 3.5ZM5 4H10V12H5V4Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
        </Button>
    );
}

interface MakeGlobalButtonProps {
    owner: string
    userId: string
    personalityId: string
}

export function MakeGlobalButton({ owner, userId, personalityId }: MakeGlobalButtonProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const makeGlobalMutation = useMutation({
        mutationFn: (personalityId: string) => makePersonalityGlobal(personalityId),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listPersonalities", userId], (old: ListPersonalitiesResp) => {
                if (!old.personalities) {
                    return null;
                }
                return {
                    personalities: old.personalities.map((p) => (p.id === resp.id) ? { ...p, owner: "system" } : p)
                };
            });
            toast({ title: "Successfully updated personality owner" });
        },
        onError: (error) => {
            console.error("Error making personality global:", error);
            toast({ title: "Failed to make the personality global", variant: "destructive" });
        },
    }, queryClient);

    return (
        <Button
            variant="outline"
            type="button"
            onClick={(e) => {
                e.preventDefault();
                makeGlobalMutation.mutate(personalityId);
            }}
            disabled={owner === "system"}
        >
            Make global
        </Button>
    );
}

interface MakeDefaultButtonProps {
    isDefault: boolean | undefined
    userId: string
    personalityId: string
}

export function MakeDefaultButton({ isDefault, userId, personalityId }: MakeDefaultButtonProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const setDefaultMutation = useMutation({
        mutationFn: (personalityId: string) => setDefaultPersonality(userId, personalityId),
        onSuccess: async (resp) => {
            await queryClient.invalidateQueries(["getDefaultPersonality", userId] as InvalidateQueryFilters);
            await queryClient.setQueryData(["listPersonalities", userId], (old: ListPersonalitiesResp) => {
                if (!old.personalities) {
                    return null;
                }
                return { personalities: old.personalities.map((p) => (p.id === resp.id) ? { ...p, isDefault: true } : p) };
            });
            toast({ title: "Successfully updated default personality" });
        },
        onError: (error) => {
            console.error("Error updating default personality:", error);
            toast({ title: "Failed updating default personality", variant: "destructive" });
        },
    }, queryClient);

    return (
        <Button
            variant="outline"
            type="button"
            disabled={isDefault}
            onClick={(e) => {
                e.preventDefault();
                setDefaultMutation.mutate(personalityId);
            }}
        >
            Make default
        </Button>
    );
}