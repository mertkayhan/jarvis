'use client'

import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { getQuestionHistory } from "./question-actions";
import { useEffect } from "react";
import { useToast } from "@/lib/hooks/use-toast";

interface QuestionHistoryProps {
    questionId: string
    mutationCount: number
}

export function QuestionHistory({ questionId, mutationCount }: QuestionHistoryProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: [questionId, mutationCount],
        queryFn: () => getQuestionHistory(questionId),
    });
    const { toast } = useToast();
    useEffect(() => {
        if (error) {
            toast({ title: "Failed to fetch question history", variant: "destructive" });
        }
    }, [error]);

    return (
        <Dialog>
            <Tooltip>
                <DialogTrigger asChild>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="text-muted-foreground hover:text-accent-foreground"
                        >
                            <span className='sr-only'>View question history</span>
                            <svg
                                className='h-5 w-5'
                                viewBox="0 0 15 15"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                        </Button>
                    </TooltipTrigger>
                </DialogTrigger>
                <TooltipContent className="bg-muted text-foreground rounded-lg shadow-md">View question history</TooltipContent>
                <DialogContent className="max-w-none w-[60vw] overflow-auto h-[60vh]">
                    <DialogHeader>
                        <DialogTitle>Question history</DialogTitle>
                        <DialogDescription>Here you can see the audit logs for the question</DialogDescription>
                    </DialogHeader>
                    <Table className="p-4">
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="w-[250px]">Timestamp</TableHead>
                                <TableHead>Operation</TableHead>
                                <TableHead>Previous Value</TableHead>
                                <TableHead>Current Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.history.map((h, i) => {
                                return (
                                    <TableRow key={i}>
                                        <TableCell>{h["user_id"]}</TableCell>
                                        <TableCell>{new Date(h["created_at"]).toUTCString()}</TableCell>
                                        <TableCell>{h["operation"]}</TableCell>
                                        <TableCell>{h["prev_value"]}</TableCell>
                                        <TableCell>{h["current_value"]}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Tooltip>
        </Dialog>
    );
}