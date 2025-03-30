'use client'

import { Question } from "@/lib/types"
import { format } from "date-fns"
import { useEffect, useState, useTransition } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { Button, buttonVariants } from "../ui/button"
import { CheckIcon, PenIcon, Trash2 } from "lucide-react"
import { InvalidateQueryFilters, useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteQuestion, ListQuestionsResp, updateAnswer } from "./question-actions"
import { useToast } from "@/lib/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { Separator } from "../ui/separator"
import TiptapEditor from "../text-editor/TiptapEditor"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { IconSpinner } from "../ui/icons"
import { AdditionalInfo } from "./additional-info"
import { TagsInput } from "./tags"
import { QuestionHistory } from "./question-history"

interface QuestionDisplayProps {
    question: Question | undefined
    packId: string
    page: number
    userId: string
    updateAnswerState: (answer: string, id: string) => void
}

export function QuestionDisplay(props: QuestionDisplayProps) {
    if (!props.question || !props.question?.id) {
        return (
            <div className="flex flex-col justify-center items-center p-8 text-muted-foreground text-sm">
                No question selected
            </div>
        );
    }
    return (
        <QuestionDisplayContent {...props as QuestionDisplayContentProps} />
    );
}

interface QuestionDisplayContentProps extends QuestionDisplayProps {
    question: Question
    updateAnswerState: (answer: string, id: string) => void
}

export function QuestionDisplayContent({ question, packId, page, userId, updateAnswerState }: QuestionDisplayContentProps) {
    const [editable, setEditable] = useState(false);
    const [alertDialogOpen, setAlertDialogOpen] = useState(false);
    const [currentContent, setCurrentContent] = useState("");
    const { toast } = useToast();
    const [transitioning, startTransition] = useTransition();
    const [mutationCount, setMutationCount] = useState(0);

    const queryClient = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: () => updateAnswer(question.id, currentContent.trim(), userId),
        onSuccess: async (resp) => {
            updateAnswerState(resp.answer, resp.id);
            // toast({ title: "Successfully updated answer" });
            setMutationCount((old) => old + 1);
        },
        onError: (error) => {
            console.error("failed to update answer:", error);
            toast({ title: "Failed to update the answer", variant: "destructive" });
        },
    }, queryClient);
    const deleteMutation = useMutation({
        mutationFn: () => deleteQuestion(question.id, question.question, userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries(["listQuestions", packId, page] as InvalidateQueryFilters)
            toast({ title: "Successfully deleted question" });
            setAlertDialogOpen(false);
            setMutationCount((old) => old + 1);
        },
        onError: (error) => {
            console.error("failed to delete question:", error);
            toast({ title: "Failed to delete the question", variant: "destructive" });
        }
    }, queryClient);

    const [accordionValue, setAccordionValue] = useState("");

    useEffect(() => {
        setAccordionValue("");
    }, [question.id])

    useEffect(() => {
        return () => {
            setEditable(false);
            setCurrentContent("");
            setMutationCount(0);
        }
    }, [question, userId]);

    return (
        <div className="flex h-full flex-col bg-muted/10 text-card-foreground rounded-lg shadow-md animate-in fade-in duration-200">
            {question ? (
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="w-full p-4">
                        <div className="font-semibold text-lg overflow-auto max-h-20">{question.question}</div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            {question.updatedAt && (
                                <span>{format(question.updatedAt, "PPpp")}</span>
                            )}
                            <span className="ml-2 text-muted-foreground">
                                | Updated by {question.updatedBy}
                            </span>
                            <div className="ml-auto flex justify-end gap-1 border-border">
                                <QuestionHistory questionId={question.id} mutationCount={mutationCount} />
                                {!editable &&
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-accent-foreground"
                                                onClick={() => {
                                                    if (!editable) {
                                                        setEditable(true)
                                                    }
                                                }}
                                            >
                                                <PenIcon className="h-4 w-4" />
                                                <span className="sr-only">Edit Answer</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-muted text-foreground rounded-lg shadow-md">
                                            Edit Answer
                                        </TooltipContent>
                                    </Tooltip>
                                    ||
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-accent-foreground"
                                                onClick={() => {
                                                    startTransition(() => {
                                                        if (editable) {
                                                            setEditable(false)
                                                        }
                                                        if (currentContent.trim().length) {
                                                            updateMutation.mutate();
                                                        }
                                                    });
                                                }}
                                            >
                                                {(updateMutation.isPending || transitioning) && <IconSpinner className="animate-spin" />}
                                                {(!updateMutation.isPending && !transitioning) && <CheckIcon className="h-4 w-4" />}
                                                <span className="sr-only">Save Answer</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-muted text-foreground rounded-lg shadow-md">
                                            Save Answer
                                        </TooltipContent>
                                    </Tooltip>
                                }

                                <Tooltip>
                                    <AlertDialog open={alertDialogOpen}>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-accent-foreground"
                                                    onClick={() => {
                                                        setAlertDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Move to trash</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this question from our servers.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => { setAlertDialogOpen(false) }}>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={() => { deleteMutation.mutate() }}>
                                                    {deleteMutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                        <TooltipContent className="bg-muted text-foreground rounded-lg shadow-md">
                                            Move to trash
                                        </TooltipContent>
                                    </AlertDialog>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    {/* Answer Content */}
                    <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed overflow-auto">
                        <div className="p-4">
                            <TiptapEditor
                                readonly={!editable}
                                hideBubbleMenu={false}
                                initialContent={question?.answer}
                                contentMaxHeight="50vh"
                                contentMinHeight="50vh"
                                onContentChange={(value) => { setCurrentContent(value as string) }}
                                ssr
                            />
                        </div>
                        <div className="p-6">
                            <Accordion type="single" collapsible value={accordionValue} onValueChange={(value) => setAccordionValue(value)}>
                                <AccordionItem value="additional-info">
                                    <AccordionTrigger className="text-base">
                                        <div className="flex flex-1 w-full items-center justify-between">
                                            <span>Additional Information</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <AdditionalInfo question={question} userId={userId} setMutationCount={setMutationCount} packId={packId} />
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="tags">
                                    <AccordionTrigger className="text-base">
                                        <div className="flex flex-1 w-full items-center justify-between">
                                            <span>Tags</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <TagsInput question={question} packId={packId} userId={userId} setMutationCount={setMutationCount} />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col justify-center items-center p-8 text-muted-foreground text-sm">
                    No question selected
                </div>
            )}
        </div>
    )
}
