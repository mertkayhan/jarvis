'use client'

import { useToast } from "@/lib/hooks/use-toast";
import { InvalidateQueryFilters, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";
import { createQuestion } from "./question-actions";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { IconSpinner } from "../ui/icons";
import { QuestionFilter } from "@/lib/types";
import { useRouter } from "next/navigation";

interface NewQuestionProps {
    userId: string
    packId: string
    setCurrentFilters: Dispatch<SetStateAction<QuestionFilter | null>>
    dispatch: Dispatch<any>
}

export function NewQuestion({ userId, packId, setCurrentFilters, dispatch }: NewQuestionProps) {
    const router = useRouter();
    const [question, setQuestion] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: () => createQuestion(packId, question, userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries(["listQuestions", packId, 1] as InvalidateQueryFilters);
            toast({ title: "Successfully created new question" });
            setQuestion("");
            setCurrentFilters(null);
            dispatch({ type: "RESET" });
            router.replace(`?pack_id=${packId}&page=1`);
        },
        onError: (error) => {
            console.error("Error creating question:", error);
            toast({ title: "Failed to create question", variant: "destructive" });
        },
    }, queryClient);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-5/6">
                    <svg
                        className="w-4 h-4"
                        viewBox="0 0 15 15"
                        strokeWidth={2}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                    <span className="px-2">New Question</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col">
                <DialogHeader>
                    <DialogTitle>New Question</DialogTitle>
                    <DialogDescription>
                        Enter question details here. Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        mutation.mutate();
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col flex-1">
                            <Label className="text-start pb-2">
                                Question
                            </Label>
                            <textarea
                                value={question}
                                onChange={(e) => { setQuestion(e.target.value) }}
                                rows={4}
                                className="w-full bg-background/80 border focus:outline-none p-2 text-sm resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose>
                            <Button type="submit" variant="outline" >
                                {mutation.isPending && <IconSpinner className="mr-2 animate-spin" />}
                                Save changes
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}