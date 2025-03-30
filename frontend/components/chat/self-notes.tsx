'use client'

import { Dispatch, SetStateAction } from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface SelfNotesProps {
    input: string
    setInput: Dispatch<SetStateAction<string>>
}

export function SelfNotes({ input, setInput }: SelfNotesProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type='button'
                        variant="ghost"
                        className="hidden md:inline-flex cursor-pointer justify-center rounded-lg p-2 text-slate-500 dark:text-slate-400 dark:hover:text-slate-50"
                        onClick={() => {
                            if (!input.includes("@self")) {
                                const trimmed = input.trimEnd()
                                if (!trimmed.length) {
                                    setInput("@self ")
                                } else {
                                    setInput(trimmed + " @self ")
                                }
                            }
                        }}
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 15 15"
                            strokeWidth="2"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                            </path>
                        </svg>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className='text-sm'>Add notes (These notes will not be visible to the AI)</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}