'use client'

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createPersonality, setDefaultPersonality } from "@/components/personalities/personality-actions";
import { uuidv4 } from "@/lib/utils";
import { InvalidateQueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { PersonalitySettings } from "@/components/personalities/personality-settings";
import { Tools } from "@/components/personalities/personality-tools";
import { KnowledgeDropdown } from "@/components/knowledge/knowledge-dropdown";
import { KnowledgeMenu } from "@/components/knowledge/knowledge-selection-menu";
import { useUser } from "@auth0/nextjs-auth0/client";
import Loading from "@/app/loading";
import { IconSpinner } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/chat-sidebar";


export default function Page() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");
    const [globallyAvailable, setGloballyAvailable] = useState(false);
    const [isDefault, setIsDefault] = useState(false);
    const [toolSelection, setToolSelection] = useState<string[]>([]);
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [kind, setKind] = useState("");
    const [knowledgeOpen, setKnowledgeOpen] = useState(false);
    const { user, error, isLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const queryClient = useQueryClient();
    const newPersonalityMutation = useMutation({
        mutationFn: (newId: string) => createPersonality(newId, name, description, instructions, (globallyAvailable) ? "system" : user?.email as string, toolSelection, selectedDocuments),
        onSuccess: async (data) => {
            if (isDefault) {
                defaultPersonalityMutation.mutate(data.id);
            } else {
                // default personality mutations also invalidates
                await queryClient.invalidateQueries(["createPersonality", user?.email] as InvalidateQueryFilters);
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
        mutationFn: (newId: string) => setDefaultPersonality(user?.email as string, newId),
        onSuccess: async () => {
            await queryClient.invalidateQueries(["getDefaultPersonality", user?.email] as InvalidateQueryFilters);
        },
        onError: (error) => {
            console.error("Failed to set default personality:", error);
        },
    }, queryClient);

    if (isLoading) {
        return (
            <Loading />
        )
    }

    return (
        <div className="flex h-full">
            <div
                className='flex h-full flex-col border-slate-300 bg-background transition-all duration-300'
            >
                <Sidebar
                    highlight={false}
                    showChatList={false}
                    moduleName="jarvis"
                    userId={user?.email as string}
                />

            </div>
            <main className="container h-full dark:bg-slate-900 rounded-lg bg-slate-200">
                <form
                    className="flex flex-col w-full h-full space-y-4 p-4 rounded-lg items-center justify-center mt-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        // console.log("submit", name, description, instructions);
                        const newId = uuidv4();
                        newPersonalityMutation.mutate(newId);
                        router.push("/chat");
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
                            <Input className="w-full text-sm" value={name} onChange={(e) => { setName(e.target.value) }} />
                            <Label>Description</Label>
                            <Input className="w-full text-sm" value={description} onChange={(e) => { setDescription(e.target.value) }} />
                            <Label>Instructions</Label>
                            <textarea
                                className="flex bg-transparent border resize-none w-full focus:outline-none p-2 text-sm rounded-lg"
                                rows={4}
                                value={instructions}
                                onChange={(e) => { setInstructions(e.target.value) }}
                            />
                            <Label className="pt-2">Settings</Label>
                            <PersonalitySettings setGloballyAvailable={setGloballyAvailable} setIsDefault={setIsDefault} />
                            <div className="flex flex-col gap-2">
                                <Label>Tools</Label>
                                <Tools toolSelection={toolSelection} setToolSelection={setToolSelection} userId={user?.email as string} />
                            </div>
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
                                    userId={user?.email as string}
                                    kind={kind}
                                    open={knowledgeOpen}
                                    setOpen={setKnowledgeOpen}
                                    selectedDocuments={selectedDocuments}
                                    setSelectedDocuments={setSelectedDocuments}
                                />
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
            </main>
        </div>
    )
}