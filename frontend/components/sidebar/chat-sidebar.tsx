'use client'

import { Dispatch, SetStateAction, ReactNode } from "react";
import Link from "next/link";
import { TooltipProvider } from "../ui/tooltip";
import { config } from "@/app/cfg";
import { usePathname } from 'next/navigation';
import { useTheme } from "next-themes";
import { Personalities } from "../personalities/personalities";
import { ModeToggle } from "./theme-toggle";
import { ChatButton, ChatListButton, LogOutButton } from "./buttons";
import { SettingsDialog } from "../ui/settings-dialog";


interface SidebarProps {
    highlight: boolean
    children?: ReactNode
    showChatList: boolean
    setShowChatList?: Dispatch<SetStateAction<boolean>>
    moduleName: string
    userId: string
}

export function Sidebar({
    highlight,
    children,
    showChatList,
    setShowChatList,
    moduleName,
    userId,
}: SidebarProps) {
    const highlightStyle = () => {
        return (highlight) ? 'scale-110 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : ''
    }
    const { resolvedTheme } = useTheme();
    const selectedStyle = (name: string) => {
        return (selectedModule === name) ? 'dark:bg-slate-800 bg-slate-200' : ''
    };
    const path = usePathname();
    const selectedModule = (path?.includes("/chat")) ? 'chat' : (path?.includes("/question-repo")) ? 'question-repo' : (path?.includes("/document-repo")) ? 'document-repo' : '';
    const badgeColor = (resolvedTheme === 'light') ? 'black' : 'white';

    return (
        <aside className="flex h-full">
            {/* First Column */}
            <div
                className="flex h-screen flex-col items-center space-y-8 border-r border-slate-300 bg-backgroud py-8 dark:border-slate-700 px-1"
            >
                <Link
                    href="/"
                >
                    {config.sidebar.logo && config.sidebar.logo({ fillColor: badgeColor })}
                </Link>
                <TooltipProvider>
                    {!showChatList && setShowChatList && <ChatListButton setShowChatList={setShowChatList} />}
                    <ChatButton moduleName={moduleName} highlightStyle={highlightStyle()} selectedStyle={selectedStyle("chat")} />
                    <SettingsDialog userId={userId} />
                    <Personalities
                        userId={userId}
                        highlightStyle={highlightStyle()}
                    />
                    <div className="flex flex-col h-full space-y-2 justify-end">
                        <ModeToggle />
                        <LogOutButton />
                    </div>
                </TooltipProvider>
            </div>
            {children && <div
                className={`h-screen transition-all duration-300 overflow-hidden ${showChatList ? 'md:w-60 w-24 border-r dark:border-slate-700 border-slate-300' : 'w-0'
                    } bg-background flex flex-col`}
            >
                {showChatList && children}
            </div>}

        </aside >
    )
}