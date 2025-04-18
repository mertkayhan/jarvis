'use client'

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createPersonality, setDefaultPersonality } from "@/components/personalities/personality-actions";
import { uuidv4 } from "@/lib/utils";
import { InvalidateQueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { DocumentSelectionMenu } from "../document-repo/document-selection-menu";
import { PersonalitySettings } from "./personality-settings";
import { Tools } from "./personality-tools";
import { IconSpinner } from "../ui/icons";

interface NewPersonalityProps {
    userId: string
}

export function NewPersonality({ userId }: NewPersonalityProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [globallyAvailable, setGloballyAvailable] = useState(false);
    const [isDefault, setIsDefault] = useState(false);
    const [toolSelection, setToolSelection] = useState<string[]>([]);
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

    const { toast } = useToast();

    const queryClient = useQueryClient();
    const newPersonalityMutation = useMutation({
        mutationFn: (newId: string) => createPersonality(newId, name, description, instructions, (globallyAvailable) ? "system" : userId, toolSelection, selectedDocuments),
        onSuccess: async (data) => {
            if (isDefault) {
                defaultPersonalityMutation.mutate(data.id);
            } else {
                // default personality mutations also invalidates
                await queryClient.invalidateQueries(["createPersonality", userId] as InvalidateQueryFilters);
            }
            toast({ title: "Successfully created new personality" });
            setName("");
            setDescription("");
            setInstructions("");
            setGloballyAvailable(false);
            setIsDefault(false);
        },
        onError: (error) => {
            console.error("Error creating personality:", error);
            toast({ title: "Failed to create personality", variant: "destructive" });
        },
    }, queryClient);
    const defaultPersonalityMutation = useMutation({
        mutationFn: (newId: string) => setDefaultPersonality(userId, newId),
        onSuccess: async () => {
            await queryClient.invalidateQueries(["getDefaultPersonality", userId] as InvalidateQueryFilters);
        },
        onError: (error) => {
            console.error("Failed to set default personality:", error);
        },
    }, queryClient);

    return (
        <form
            className="flex flex-col w-full h-full space-y-4 p-4 rounded-lg items-center justify-center mt-6"
            onSubmit={(e) => {
                e.preventDefault();
                // console.log("submit", name, description, instructions);
                const newId = uuidv4();
                newPersonalityMutation.mutate(newId);
            }}
        >
            <>
                <span
                    className="dark:text-slate-500 text-slate-400 text-base justify-start items-start w-full mb-4"
                >
                    Please fill out the form below and click save when you are done. &quot;Name&quot; and &quot;Instructions&quot; are required fields.
                </span>
                <div className="w-full h-full flex flex-col space-y-2">
                    <Label>Name</Label>
                    <Input className="w-full text-sm dark:border-indigo-300 border-slate-200" value={name} onChange={(e) => { setName(e.target.value) }} />
                    <Label>Description</Label>
                    <Input className="w-full text-sm dark:border-indigo-300 border-slate-200" value={description} onChange={(e) => { setDescription(e.target.value) }} />
                    <Label>Instructions</Label>
                    <textarea
                        className="flex bg-transparent border resize-none w-full focus:outline-none p-2 text-sm rounded-lg dark:border-indigo-300 border-slate-200"
                        rows={4}
                        value={instructions}
                        onChange={(e) => { setInstructions(e.target.value) }}
                    />
                    <Label className="pt-2">Settings</Label>
                    <PersonalitySettings setGloballyAvailable={setGloballyAvailable} setIsDefault={setIsDefault} />
                    <div className="flex flex-col gap-2">
                        <Label>Tools</Label>
                        <Tools toolSelection={toolSelection} setToolSelection={setToolSelection} />
                    </div>
                    <div className="flex py-2 gap-x-2 items-center">
                        <Label >Internal Knowledge</Label>
                        <DocumentSelectionMenu
                            userId={userId}
                            selectedDocuments={selectedDocuments}
                            setSelectedDocuments={setSelectedDocuments}
                        >
                            <span className='px-2'>Attach documents</span>
                        </DocumentSelectionMenu>
                    </div>
                </div>
                <div className="flex flex-col p-4 w-full justify-end items-end h-full">
                    <Button
                        variant="secondary"
                        className="w-full"
                        type="submit"
                        disabled={instructions.trim().length === 0 || name.trim().length === 0}
                    >
                        {(newPersonalityMutation.isPending || defaultPersonalityMutation.isPending) && <IconSpinner className="mr-2 animate-spin" />}
                        Save
                    </Button>
                </div>
            </>
        </form>
    )
}