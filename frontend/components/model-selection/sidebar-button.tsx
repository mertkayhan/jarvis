'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

export function SidebarButton() {
    return (
        <Tooltip>
            <DialogTrigger asChild>
                <TooltipTrigger asChild>
                    <Button
                        variant='ghost'
                        className="rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200"
                    >
                        <svg
                            className="h-4 w-4 md:h-6 md:w-6"
                            viewBox="0 0 15 15"
                            strokeWidth={2}
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M4.5 2C3.11929 2 2 3.11929 2 4.5C2 5.88072 3.11929 7 4.5 7C5.88072 7 7 5.88072 7 4.5C7 3.11929 5.88072 2 4.5 2ZM3 4.5C3 3.67157 3.67157 3 4.5 3C5.32843 3 6 3.67157 6 4.5C6 5.32843 5.32843 6 4.5 6C3.67157 6 3 5.32843 3 4.5ZM10.5 2C9.11929 2 8 3.11929 8 4.5C8 5.88072 9.11929 7 10.5 7C11.8807 7 13 5.88072 13 4.5C13 3.11929 11.8807 2 10.5 2ZM9 4.5C9 3.67157 9.67157 3 10.5 3C11.3284 3 12 3.67157 12 4.5C12 5.32843 11.3284 6 10.5 6C9.67157 6 9 5.32843 9 4.5ZM2 10.5C2 9.11929 3.11929 8 4.5 8C5.88072 8 7 9.11929 7 10.5C7 11.8807 5.88072 13 4.5 13C3.11929 13 2 11.8807 2 10.5ZM4.5 9C3.67157 9 3 9.67157 3 10.5C3 11.3284 3.67157 12 4.5 12C5.32843 12 6 11.3284 6 10.5C6 9.67157 5.32843 9 4.5 9ZM10.5 8C9.11929 8 8 9.11929 8 10.5C8 11.8807 9.11929 13 10.5 13C11.8807 13 13 11.8807 13 10.5C13 9.11929 11.8807 8 10.5 8ZM9 10.5C9 9.67157 9.67157 9 10.5 9C11.3284 9 12 9.67157 12 10.5C12 11.3284 11.3284 12 10.5 12C9.67157 12 9 11.3284 9 10.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                    </Button>
                </TooltipTrigger>
            </DialogTrigger>
            <TooltipContent side="right">Model selection</TooltipContent>
        </Tooltip>
    );
}