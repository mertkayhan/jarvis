'use client'

import { TooltipTrigger } from "../ui/tooltip";
import { DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

export function SidebarButton() {
    return (
        <TooltipTrigger asChild>
            <DialogTrigger asChild>
                <Button
                    // disabled
                    variant="ghost"
                    className="rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200"
                >
                    <svg
                        className="w-4 h-4 md:w-6 md:h-6"
                        viewBox="0 0 15 15"
                        strokeWidth={2}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V6H8.5C8.22386 6 8 5.77614 8 5.5V2H3.5ZM9 2.70711L11.2929 5H9V2.70711ZM2 2.5C2 1.67157 2.67157 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645L12.8536 5.14645C12.9473 5.24021 13 5.36739 13 5.5V12.5C13 13.3284 12.3284 14 11.5 14H3.5C2.67157 14 2 13.3284 2 12.5V2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                    <span className="sr-only">Document Repository</span>
                </Button>
            </DialogTrigger>
        </TooltipTrigger>
    );
}