'use client'

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useState, useEffect, useReducer, Reducer } from "react"
import { Question, QuestionFilter } from "@/lib/types"
import { listQuestions, ListQuestionsResp } from "@/components/question-packs/question-actions"
import { InvalidateQueryFilters, RefetchQueryFilters, useQuery, useQueryClient } from "@tanstack/react-query"
import { NewQuestion } from "./new-question"
import QuestionList from "./question-list"
import { QuestionFilters } from "./question-filters"
import { Searchbar } from "./searchbar"
import { PageSelector } from "./page-selector"
import { QuestionDisplay } from "./question-display"
import { useToast } from "@/lib/hooks/use-toast"
import { RotateLoader } from "react-spinners"
import { questionFilterReducer } from "./reducer"

interface QuestionsProps {
    page: number
    packId: string
    userId: string
}

export function Questions({
    page,
    packId,
    userId
}: QuestionsProps) {
    const [currentFilters, setCurrentFilters] = useState<QuestionFilter | null>(null);
    const [filters, dispatch] = useReducer<Reducer<QuestionFilter, any>>(questionFilterReducer, { additionalInfo: [], tags: new Set });
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [searchQuery, setSearchQuery] = useState<string | null>(null);
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["listQuestions", userId, packId, page, currentFilters, searchQuery],
        queryFn: () => listQuestions(userId, packId, page - 1, currentFilters, searchQuery),
        enabled: !!packId && !!page && !!userId,
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const updateAnswer = async (answer: string, id: string) => {
        await queryClient.setQueryData(["listQuestions", packId, page, currentFilters, searchQuery], (old: ListQuestionsResp) => {
            return { maxPageNo: old.maxPageNo, questions: old.questions.map((q) => (q.id === id) ? { ...q, answer: answer } : q) };
        });
    };
    const updateQuestion = async (question: string, id: string) => {
        await queryClient.setQueryData(["listQuestions", packId, page, currentFilters, searchQuery], (old: ListQuestionsResp) => {
            return {
                maxPageNo: old.maxPageNo, questions: old.questions.map((q) => (q.id === id) ? { ...q, question: question } : q)
            };
        });
    };
    const deleteQuestion = async () => {
        await queryClient.invalidateQueries(["listQuestions", packId, page, currentFilters, searchQuery] as InvalidateQueryFilters);
        await queryClient.refetchQueries(["listQuestions", packId, page, currentFilters, searchQuery] as RefetchQueryFilters)
    }

    useEffect(() => {
        if (currentFilters || searchQuery) {
            refetch();
        }
    }, [currentFilters, searchQuery]);

    useEffect(() => {
        if (data?.questions && data?.questions[0]) {
            setSelectedQuestion(data?.questions[0]);
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            toast({ title: "Failed to list questions", variant: "destructive" });
        }
    }, [error]);

    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup
                direction="horizontal"
                className="h-full items-stretch"
            >
                <ResizablePanel defaultSize={40}>
                    <div className="h-screen flex flex-col w-full">
                        <div className="w-full px-4 pt-4">
                            <div className="w-full flex gap-2">
                                <NewQuestion
                                    userId={userId}
                                    packId={packId}
                                    setCurrentFilters={setCurrentFilters}
                                    dispatch={dispatch}
                                />
                                <QuestionFilters
                                    setCurrentFilters={setCurrentFilters}
                                    filters={filters}
                                    dispatch={dispatch}
                                />
                            </div>
                        </div>
                        <div className="bg-background/95 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <Searchbar dispatch={setSearchQuery} />
                        </div>
                        <div className="flex flex-col overflow-auto h-full w-full">
                            {isLoading
                                &&
                                <div className="w-full h-full flex justify-center items-center">
                                    <RotateLoader color="#94a3b8" />
                                </div>
                                ||
                                <QuestionList
                                    items={data?.questions}
                                    setSelectedQuestion={setSelectedQuestion}
                                    selectedQuestion={selectedQuestion}
                                    updateQuestionState={updateQuestion}
                                    userId={userId}
                                    refreshState={deleteQuestion}
                                />
                            }
                        </div>
                        {data?.maxPageNo && <PageSelector page={page} packId={packId} maxPageCount={data?.maxPageNo} />}
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={60} minSize={5}>
                    <div className="h-screen overflow-auto">
                        <QuestionDisplay
                            question={data?.questions.find((item) => item.id === selectedQuestion?.id)}
                            packId={packId}
                            page={page}
                            userId={userId}
                            updateAnswerState={updateAnswer}
                        />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider >
    )
}