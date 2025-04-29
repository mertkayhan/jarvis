'use client'

import { useEffect, useState } from "react";
import { InvalidateQueryFilters, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { useUser } from "@auth0/nextjs-auth0/client";
import Loading from "@/app/loading";
import { deleteDefaultPersonality, getAvailableTools, getPersonality, setDefaultPersonality, updatePersonality } from "@/components/personalities/personality-actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useParams, useRouter } from "next/navigation";
import { KnowledgeMenu } from "@/components/knowledge/knowledge-selection-menu";
import { KnowledgeDropdown } from "@/components/knowledge/knowledge-dropdown";
import { Button } from "@/components/ui/button";
import { IconSpinner } from "@/components/ui/icons";
import { Sidebar } from "@/components/sidebar/chat-sidebar";
import { PersonalitySettings } from "@/components/personalities/personality-settings";
import { DocumentPack, QuestionPack } from "@/lib/types";

function useTools(userId: string | undefined | null) {
    const { data } = useQuery(
        {
            queryKey: ["availableTools", userId],
            queryFn: () => getAvailableTools(userId as string),
            enabled: !!userId
        }
    )
    return { tools: data?.tools };
}

function usePersonalityDetails(id: string, userId: string | undefined | null) {
    const { data, isLoading } = useQuery(
        {
            queryKey: ["userPersonality", id],
            queryFn: () => getPersonality(id, userId as string),
            enabled: !!userId,
        }
    )
    return { personality: data, personalityLoading: isLoading };
}

export default function Page() {
    const params = useParams<{ id: string }>();
    const { user, error, isLoading } = useUser();
    const { toast } = useToast();
    const [kind, setKind] = useState("");
    const [knowledgeOpen, setKnowledgeOpen] = useState(false);
    const { tools } = useTools(user?.email);
    const { personality, personalityLoading } = usePersonalityDetails(params.id, user?.email);
    const [currentName, setCurrentName] = useState("");
    const [currentDescription, setCurrentDescription] = useState("");
    const [currentInstruction, setCurrentInstruction] = useState("");
    const [currentToolSelection, setCurrentToolSelection] = useState<string[]>([]);
    const [currentDocumentSelection, setCurrentDocumentSelection] = useState<string[]>([]);
    // TODO:
    const [currentQuestionPackSelection, setCurrentQuestionPackSelection] = useState<QuestionPack | null>(null);
    const [currentDocumentPackSelection, setCurrentDocumentPackSelection] = useState<DocumentPack | null>(null);
    const [globallyAvailable, setGloballyAvailable] = useState(false);
    const [isDefault, setIsDefault] = useState(false);
    const queryClient = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: async (personalityId: string) => {
            const newOwner = (globallyAvailable) ? "system" : (user?.email as string);
            await updatePersonality(
                personalityId,
                currentName,
                currentDescription,
                currentInstruction,
                currentToolSelection,
                currentDocumentSelection,
                newOwner
            );
            if (isDefault) {
                await setDefaultPersonality(user?.email as string, personality?.id as string);
            } else if (personality?.isDefault && !isDefault) {
                await deleteDefaultPersonality(user?.email as string);
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries(["listPersonalities", user?.email] as InvalidateQueryFilters);
            toast({ title: "Successfully updated personality" });
        },
        onError: (error) => {
            console.error("Error updating personality:", error);
            toast({ title: "Failed to update personality", variant: "destructive" });
        },
    }, queryClient);
    const router = useRouter();
    useEffect(() => {
        if (!personality) {
            return;
        }
        setCurrentName(personality.name);
        setCurrentDescription(personality.description);
        setCurrentInstruction(personality.instructions);
        setCurrentToolSelection(personality.tools || []);
        setCurrentDocumentSelection(personality.doc_ids || []);
        setGloballyAvailable(personality.owner === "system");
        setIsDefault(personality.isDefault || false);
    }, [personality]);

    if (isLoading || personalityLoading) {
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
                <header className="py-4">
                    <h2 className="text-lg">Edit {personality?.name}</h2>
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                        You can make your updates here and click save when you are done.
                    </span>
                </header>
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
                                {tools?.map((tool: string) => {
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
                                selectedDocuments={currentDocumentSelection}
                                setSelectedDocuments={setCurrentDocumentSelection}
                                setSelectedDocumentPack={setCurrentDocumentPackSelection}
                                setSelectedQuestionPack={setCurrentQuestionPackSelection}
                            />
                        </div>
                        <Label className="pt-2">Settings</Label>
                        <PersonalitySettings
                            setGloballyAvailable={setGloballyAvailable}
                            setIsDefault={setIsDefault}
                            isDefault={isDefault}
                            isGlobal={globallyAvailable}
                        />
                    </div>
                </form>
                <div className="flex flex-col w-full gap-y-2 pb-4">
                    <Button
                        variant="destructive"
                        onClick={() => {
                            setCurrentName(personality?.name || "");
                            setCurrentDescription(personality?.description || "");
                            setCurrentInstruction(personality?.instructions || "");
                            setGloballyAvailable(personality?.owner === "system");
                            setIsDefault(personality?.isDefault || false);
                        }}
                        disabled={updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={updateMutation.isPending}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateMutation.mutate(personality?.id || "");
                            router.push("/chat");
                        }}
                    >
                        {updateMutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                        Save
                    </Button>
                </div>
            </main>
        </div>
    );
}