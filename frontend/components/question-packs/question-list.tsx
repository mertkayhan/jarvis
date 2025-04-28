'use client'

import { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Dispatch, SetStateAction, useEffect, useRef, useState, useTransition } from "react";
import { Button, buttonVariants } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { PenIcon, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteQuestion, updateQuestion } from "./question-actions";
import { useToast } from "@/lib/hooks/use-toast";
import { IconSpinner } from "../ui/icons";

interface QuestionListProps {
    items: Question[] | undefined
    setSelectedQuestion: Dispatch<SetStateAction<Question | null>>
    selectedQuestion: Question | null
    updateQuestionState: (question: string, id: string) => void
    refreshState: () => void
    userId: string
}


export default function QuestionList({ items, selectedQuestion, setSelectedQuestion, updateQuestionState, userId, refreshState }: QuestionListProps) {
    const [dialogType, setDialogType] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [questionValue, setQuestionValue] = useState(selectedQuestion?.question || "");
    const [transitioning, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const updateMutation = useMutation({
        mutationFn: (questionId: string) => updateQuestion(questionId, questionValue, userId),
        onSuccess: (resp) => {
            console.log("Successfully updated question");
            updateQuestionState(resp.question, resp.id);
        },
        onError: (err) => {
            console.error("failed to update question", err);
            toast({ title: "Failed to update question", variant: "destructive" });
        }
    }, queryClient);
    const deleteMutation = useMutation({
        mutationFn: (questionId: string) => deleteQuestion(questionId, userId, selectedQuestion?.question || ''),
        onSuccess: () => {
            console.log("successfully deleted question");
            refreshState();
        },
        onError: (error) => {
            console.error("failed to delete question", error);
            toast({ title: "Failed to delete question", variant: "destructive" });
        }
    }, queryClient);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (selectedQuestion && selectedQuestion.question) {
            setQuestionValue(selectedQuestion.question);
        }
    }, [selectedQuestion]);

    useEffect(() => {
        if (dialogType === "edit" && dialogOpen) {
            setTimeout(() => {
                if (!inputRef.current) {
                    return;
                }
                const length = inputRef.current.value.length;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(length, length);
            }, 10);
        }
    }, [dialogType, dialogOpen]);

    const handleDialogMenu = (): JSX.Element | null => {
        switch (dialogType) {
            case "edit":
                return (
                    <AlertDialogContent
                        className="max-w-none w-[60vw]"
                        onEscapeKeyDown={(e) => e.preventDefault()}
                    >
                        <AlertDialogHeader>
                            <AlertDialogTitle>Edit Question</AlertDialogTitle>
                            <AlertDialogDescription>You can make your updates here and click save when you are done.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <textarea
                            ref={inputRef}
                            value={questionValue}
                            onChange={(e) => { setQuestionValue(e.target.value) }}
                            rows={4}
                            className="w-full bg-background/80 border focus:outline-none p-2 text-sm resize-none"
                        />
                        <div className="flex w-full justify-end gap-x-2">
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "secondary" }))}
                                onClick={() => {
                                    startTransition(() => {
                                        if (!selectedQuestion?.id) {
                                            return;
                                        }
                                        updateMutation.mutate(selectedQuestion.id);
                                    });
                                }}
                                disabled={questionValue.trim().length === 0 || transitioning || updateMutation.isPending}
                            >
                                {(updateMutation.isPending || transitioning) && <IconSpinner className="pr-2 animate-spin" />}
                                Save changes
                            </AlertDialogAction>
                            <AlertDialogCancel
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => setQuestionValue(selectedQuestion?.question || "")}
                                disabled={transitioning}
                            >
                                Cancel
                            </AlertDialogCancel>
                        </div>
                    </AlertDialogContent >
                );
            case "delete":
                return (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this question and remove it from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex w-full justify-end gap-x-2">
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => {
                                    startTransition(() => {
                                        if (!selectedQuestion?.id) {
                                            return;
                                        }
                                        deleteMutation.mutate(selectedQuestion.id);
                                    });
                                }}
                                disabled={transitioning}
                            >
                                {transitioning && <IconSpinner className="pr-2 animate-spin" />}
                                Delete
                            </AlertDialogAction>
                            <AlertDialogCancel
                                className={cn(buttonVariants({ variant: "secondary" }))}
                                disabled={transitioning}
                            >
                                Cancel
                            </AlertDialogCancel>
                        </div>
                    </AlertDialogContent >
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full overflow-y-scroll pb-4 animate-in fade-in duration-200">
            <div className="flex flex-col flex-1 gap-2 p-4 pt-0 overflow-x-hidden">
                {(!items || !items.length) &&
                    <div className="flex w-full h-full items-center justify-center">
                        <span className="text-base text-slate-200 dark:text-slate-600">No questions found</span>
                    </div>
                }
                {items?.map((item: Question) => (
                    <div
                        key={item.id}
                        className={cn(
                            "group flex flex-col break-all items-start gap-2 w-full overflow-hidden rounded-lg p-4 text-left border shadow-sm",
                            "hover:bg-accent hover:text-accent-foreground hover:cursor-pointer",
                            selectedQuestion?.id === item.id
                                ? "bg-muted text-foreground border-muted"
                                : "bg-card text-card-foreground border-border"
                        )}
                        onClick={() => setSelectedQuestion(item)}
                    >
                        <div
                            className={cn(
                                "flex w-full justify-between items-center",
                            )}
                        >
                            <div
                                className={cn(
                                    "font-medium text-base line-clamp-3 overflow-hidden w-full flex",
                                )}
                            >
                                <div className="flex justify-start items-center w-full">
                                    {item.question}
                                </div>
                                {selectedQuestion?.id === item.id &&
                                    <div className="flex justify-end items-center w-10 focus:outline-none focus:ring-0">
                                        <DropdownMenu key={item.id} modal={false}>
                                            <DropdownMenuTrigger asChild className="focus:outline-none focus:ring-0">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 hover:text-blue-500 focus:outline-none focus:ring-0"
                                                >
                                                    <span className="items-center justify-center w-4 h-4">...</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-32">
                                                <DropdownMenuItem onSelect={(e) => { setDialogType("edit"); setDialogOpen(true); e.stopPropagation() }}>
                                                    <PenIcon />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={(e) => { setDialogType("delete"); setDialogOpen(true); e.preventDefault() }}>
                                                    <Trash2 />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
                                            {handleDialogMenu()}
                                        </AlertDialog>
                                    </div>
                                }
                            </div>
                        </div>
                        <div
                            className={cn(
                                "text-xs text-muted-foreground/70 transition-opacity",
                            )}
                        >
                            Updated by {item.updatedBy}
                        </div>
                        <div
                            className={cn(
                                "text-xs text-muted-foreground transition-opacity",
                            )}
                        >
                            {formatDistanceToNow(new Date(item.updatedAt), {
                                addSuffix: true,
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}