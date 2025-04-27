'use client'

import { Dispatch, SetStateAction, useState } from "react";
import { AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader } from "../ui/alert-dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Personality } from "@/lib/types";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import { InvalidateQueryFilters, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAvailableTools, updatePersonality } from "./personality-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { IconSpinner } from "../ui/icons";
import { KnowledgeDropdown } from "../knowledge/knowledge-dropdown";
import { KnowledgeMenu } from "../knowledge/knowledge-selection-menu";

interface EditDialogProps {
    personality: Personality
    userId: string
    setOpen: Dispatch<SetStateAction<boolean>>
}

export function EditDialog({ personality, userId, setOpen }: EditDialogProps) {
    const [currentName, setCurrentName] = useState(personality.name);
    const [currentDescription, setCurrentDescription] = useState(personality.description);
    const [currentInstruction, setCurrentInstruction] = useState(personality.instructions);
    const [currentToolSelection, setCurrentToolSelection] = useState(personality.tools || []);
    const [currentDocumentSelection, setCurrentDocumentSelection] = useState(personality.doc_ids || []);
    const { toast } = useToast();
    const [kind, setKind] = useState("");
    const [knowledgeOpen, setKnowledgeOpen] = useState(false);

    const queryClient = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: (personalityId: string) => {
            return updatePersonality(personalityId, currentName, currentDescription, currentInstruction, currentToolSelection, currentDocumentSelection);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries(["listPersonalities", userId] as InvalidateQueryFilters);
            toast({ title: "Successfully updated personality" });
        },
        onError: (error) => {
            console.error("Error updating personality:", error);
            toast({ title: "Failed to update personality", variant: "destructive" });
        },
    }, queryClient);
    const { data } = useQuery(
        {
            queryKey: ["availableTools", userId],
            queryFn: () => getAvailableTools(userId),
            enabled: !!userId
        }
    )

    return (
        <>
            <AlertDialogHeader>Edit {personality.name}</AlertDialogHeader>
            <AlertDialogDescription>
                You can make your updates here and click save when you are done.
            </AlertDialogDescription>
            <form>
                <div className="w-full h-full flex flex-col space-y-2">
                    <Label>Name</Label>
                    <Input
                        className="w-full text-sm"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                    />
                    <Label>Description</Label>
                    <Input
                        className="w-full text-sm"
                        value={currentDescription}
                        onChange={(e) => setCurrentDescription(e.target.value)}
                    />
                    <Label>Instructions</Label>
                    <textarea
                        className="flex bg-transparent border resize-none w-full focus:outline-none p-2 text-sm rounded-lg"
                        rows={4}
                        value={currentInstruction}
                        onChange={(e) => setCurrentInstruction(e.target.value)}
                    />
                    <div className="flex flex-col gap-2">
                        <Label>Tools</Label>
                        <div className="flex space-x-2">
                            {data?.tools.map((tool: string) => {
                                return (
                                    <>
                                        <Checkbox
                                            id={tool}
                                            className="data-[state=checked]:bg-indigo-500 data-[state=checked]:text-indigo-500"
                                            checked={currentToolSelection.includes(tool)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setCurrentToolSelection((old) => [tool, ...old]);
                                                } else {
                                                    setCurrentToolSelection((old) => old.filter((o) => o !== tool));
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor="default-prompt"
                                            className="text-sm font-medium leading-none hover:cursor-pointer"
                                        >
                                            {tool}
                                        </label>
                                    </>
                                )
                            })}
                        </div>
                    </div>
                    {/* TODO:
                    <div className="flex py-2 gap-x-2 items-center">
                        <Label >Internal Knowledge</Label>
                        <KnowledgeDropdown
                            setKind={setKind}
                            setOpen={setKnowledgeOpen}
                            triggerButton={
                                <Button variant="secondary">
                                    Attach knowledge
                                </Button>
                            }
                        />
                        <KnowledgeMenu
                            userId={userId}
                            kind={kind}
                            open={knowledgeOpen}
                            setOpen={setKnowledgeOpen}
                            selectedDocuments={currentDocumentSelection}
                            setSelectedDocuments={setCurrentDocumentSelection}
                        />
                    </div> */}
                </div>
            </form>
            <AlertDialogFooter>
                <AlertDialogCancel
                    className={cn(buttonVariants({ variant: "destructive" }))}
                    onClick={() => {
                        setCurrentName(personality.name);
                        setCurrentDescription(personality.description);
                        setCurrentInstruction(personality.instructions);
                        setOpen(false);
                    }}
                    disabled={updateMutation.isPending}
                >
                    Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                    className={cn(buttonVariants({ variant: "secondary" }))}
                    disabled={updateMutation.isPending}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateMutation.mutate(personality.id);
                        setTimeout(() => setOpen(false), 100);
                    }}
                >
                    {updateMutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                    Save
                </AlertDialogAction>
            </AlertDialogFooter>
        </>
    );
}