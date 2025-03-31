'use client'

import React, { useState, useEffect } from "react";
import remarkGfm from "remark-gfm";
import { MemoizedReactMarkdown } from "@/components/chat/markdown";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContextExplorerProps {
    context: string | null | undefined;
}

interface ParsedContext {
    input: string
    name: string
    metadata: Record<string, string>
    pageContent: string
}

export default function ContextExplorer({ context }: ContextExplorerProps) {
    const [parsedContext, setParsedContext] = useState<ParsedContext[] | null>(null);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        if (!context) return;
        setCurrentPage(0);
        try {
            const parsed = JSON.parse(context).map((ctx: string) => {
                const item = JSON.parse(ctx);
                return item.tool_output.map((output: any) => {
                    return {
                        input: item.tool_input,
                        name: item.tool_name,
                        metadata: output.kwargs.metadata || {},
                        pageContent: output.kwargs.page_content.replaceAll("\\n", "\n"),
                    }
                });
            });
            setParsedContext(parsed.flat());
        } catch (error) {
            console.error("Error parsing context:", error);
        }
        return () => {
            setParsedContext(null);
        }
    }, [context]);

    if (!context || !parsedContext?.length) {
        return (
            <div className="w-full h-full flex flex-col bg-background p-4 overflow-y-auto">
                <h1 className="text-3xl font-extrabold text-primary underline decoration-dotted decoration-primary/50">
                    <span className="flex justify-center items-center gap-x-2">
                        <svg
                            className="w-6 h-6"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                        Context Explorer
                    </span>
                </h1>
                <span className="text-sm text-gray-500 p-2">Here you can explore the internal document snippets used to generate the response.</span>
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 mb-4 text-gray-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h6m-6 4h6M3.75 9v11.25A2.25 2.25 0 006 22.5h12a2.25 2.25 0 002.25-2.25V9m-15 0L12 2.25m-8.25 6.75h16.5"
                        />
                    </svg>
                    <p className="text-sm">No context available</p>
                    <p className="text-xs text-gray-700">The most likely reasons are either that the AI has used it&apos;s internal knowledge or a document attached to the chat to generate the response.</p>
                </div>
            </div>
        );
    }

    const handlePageChange = (direction: "prev" | "next") => {
        if (!parsedContext) return;
        setCurrentPage((prev) => {
            if (direction === "prev" && prev > 0) return prev - 1;
            if (direction === "next" && prev < parsedContext.length - 1) return prev + 1;
            return prev;
        });
    };

    const currentContext = parsedContext ? parsedContext[currentPage] : null;

    return (
        <div className="w-full h-full flex flex-col bg-background p-4 overflow-y-auto">
            <h1 className="text-3xl font-extrabold text-primary underline decoration-dotted decoration-primary/50">
                <span className="flex justify-center items-center gap-x-2">
                    <svg
                        className="w-6 h-6"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                    Context Explorer
                </span>
            </h1>
            <span className="text-sm text-gray-500 p-2">Here you can explore the internal document snippets used to generate the response.</span>
            {currentContext ? (
                <>
                    <div className="flex justify-between mb-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handlePageChange("prev")}
                                        disabled={currentPage === 0}
                                    >
                                        <svg
                                            className="h-6 w-6"
                                            viewBox="0 0 15 15"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M1 7.5C1 7.66148 1.07798 7.81301 1.20938 7.90687L8.20938 12.9069C8.36179 13.0157 8.56226 13.0303 8.72879 12.9446C8.89533 12.8589 9 12.6873 9 12.5L9 10L11.5 10C11.7761 10 12 9.77614 12 9.5L12 5.5C12 5.22386 11.7761 5 11.5 5L9 5L9 2.5C9 2.31271 8.89533 2.14112 8.72879 2.05542C8.56226 1.96972 8.36179 1.98427 8.20938 2.09313L1.20938 7.09314C1.07798 7.18699 1 7.33853 1 7.5ZM8 3.4716L8 5.5C8 5.77614 8.22386 6 8.5 6L11 6L11 9L8.5 9C8.22386 9 8 9.22386 8 9.5L8 11.5284L2.36023 7.5L8 3.4716Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                        </svg>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Show previous snippet
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handlePageChange("next")}
                                        disabled={currentPage === (parsedContext?.length || 1) - 1}
                                    >
                                        <svg
                                            className="h-6 w-6"
                                            viewBox="0 0 15 15"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M14 7.5C14 7.66148 13.922 7.81301 13.7906 7.90687L6.79062 12.9069C6.63821 13.0157 6.43774 13.0303 6.27121 12.9446C6.10467 12.8589 6 12.6873 6 12.5L6 10L3.5 10C3.22386 10 3 9.77614 3 9.5L3 5.5C3 5.22386 3.22386 5 3.5 5L6 5L6 2.5C6 2.31271 6.10467 2.14112 6.27121 2.05542C6.43774 1.96972 6.63821 1.98427 6.79062 2.09313L13.7906 7.09314C13.922 7.18699 14 7.33853 14 7.5ZM7 3.4716L7 5.5C7 5.77614 6.77614 6 6.5 6L4 6L4 9L6.5 9C6.77614 9 7 9.22386 7 9.5L7 11.5284L12.6398 7.5L7 3.4716Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                        </svg>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Show next snippet
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <TooltipProvider>
                        <div className="hidden md:flex md:flex-col gap-y-2 mb-2">
                            {Object.entries(currentContext.metadata).map(([key, value], i) => {
                                return (
                                    <span
                                        key={i}
                                        className={`inline-flex items-center gap-x-2 rounded-full bg-amber-600/20 px-2.5 py-1 text-xs md:text-sm font-semibold leading-5 text-amber-600`}
                                    >
                                        <span className={`inline-block bg-amber-600`}></span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="text-xs truncate">{key}: {value}</span>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                className="flex flex-wrap min-w-20 max-w-[300px] max-h-auto whitespace-normal break-words overflow-auto break-all"
                                                side="top"
                                                collisionPadding={10}
                                            >
                                                {value}
                                            </TooltipContent>
                                        </Tooltip>
                                    </span>
                                );
                            })}
                        </div>
                    </TooltipProvider>
                    <div className="dark:bg-slate-900 bg-slate-50 rounded-lg p-4 overflow-auto">
                        <MemoizedReactMarkdown
                            className="flex flex-col mx-auto prose break-words dark:prose-invert prose-p:leading-relaxed md:text-sm text-xs"
                            remarkPlugins={[remarkGfm]}
                        >
                            {currentContext?.pageContent || "No content available"}
                        </MemoizedReactMarkdown>
                    </div>
                </>
            ) : (
                <div className="h-full flex flex-col justify-center items-center">
                    <p className="text-gray-500 text-sm">No valid data to display.</p>
                </div>
            )}
        </div>
    );
}
