'use client'

import { Dispatch, SetStateAction } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";

interface ChatButtonProps {
    moduleName: string
    highlightStyle: string
    selectedStyle: string
}

export function ChatButton({ moduleName, highlightStyle, selectedStyle }: ChatButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href={`/chat`}
                    className={`${highlightStyle} ${selectedStyle} rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 md:h-6 md:w-6"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path
                            d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10"
                        ></path>
                        <path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2"></path>
                    </svg>
                </a>
            </TooltipTrigger>
            <TooltipContent side="right">
                Chat
            </TooltipContent>
        </Tooltip>
    );
}

export function LogOutButton() {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href={"/api/auth/logout"}
                    className="rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 md:w-6 md:h-6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
                    </svg>
                </a>
            </TooltipTrigger>
            <TooltipContent>
                Log out
            </TooltipContent>
        </Tooltip>
    );
}

interface ChatListButtonProps {
    setShowChatList: Dispatch<SetStateAction<boolean>>
}

export function ChatListButton({ setShowChatList }: ChatListButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant='ghost'
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        if (setShowChatList) {
                            setShowChatList(true);
                        }
                    }}
                    className="rounded-lg hover:bg-slate-200 p-1.5 transition-colors duration-200 dark:hover:bg-slate-800 "
                >
                    <svg
                        className="h-4 w-4 md:h-6 md:w-6"
                        viewBox="0 0 15 15"
                        fill="none"
                        strokeWidth={2}
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.14645 11.1464C1.95118 11.3417 1.95118 11.6583 2.14645 11.8536C2.34171 12.0488 2.65829 12.0488 2.85355 11.8536L6.85355 7.85355C7.04882 7.65829 7.04882 7.34171 6.85355 7.14645L2.85355 3.14645C2.65829 2.95118 2.34171 2.95118 2.14645 3.14645C1.95118 3.34171 1.95118 3.65829 2.14645 3.85355L5.79289 7.5L2.14645 11.1464ZM8.14645 11.1464C7.95118 11.3417 7.95118 11.6583 8.14645 11.8536C8.34171 12.0488 8.65829 12.0488 8.85355 11.8536L12.8536 7.85355C13.0488 7.65829 13.0488 7.34171 12.8536 7.14645L8.85355 3.14645C8.65829 2.95118 8.34171 2.95118 8.14645 3.14645C7.95118 3.34171 7.95118 3.65829 8.14645 3.85355L11.7929 7.5L8.14645 11.1464Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
                Toggle chat sidebar
            </TooltipContent>
        </Tooltip>
    );
}