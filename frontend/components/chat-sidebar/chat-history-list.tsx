'use client'

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { listChats } from "./chat-sidebar-actions";
import { RotateLoader } from "react-spinners";
import { HiddenChatListButton } from "@/components/chat-sidebar/hide-chat-list";
import { ListTitle } from "./chat-history-title";
import { SearchBox } from "@/components/chat-sidebar/chat-history-search-box";
import { Button } from "../ui/button";
import { ClearHistory } from "@/components/chat-sidebar/clear-history";
import { ChatListItem } from "./chat-list-item";
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

interface ChatListProps {
    setShowChatList: Dispatch<SetStateAction<boolean>>
    userId: string
    path: string
    setLoadedChatHistory: Dispatch<SetStateAction<boolean>>
    id?: string | null
    dispatch: Dispatch<any>
}

export function ChatHistoryList({
    setShowChatList,
    userId,
    path,
    setLoadedChatHistory,
    id,
    dispatch,
}: ChatListProps) {
    const [query, setQuery] = useState("");
    const { data, isLoading, error } = useQuery({
        queryKey: ["listChats", userId],
        queryFn: () => listChats(userId),
        enabled: !!userId,
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (error) {
            toast({ title: "Failed to list chats", variant: "destructive" });
        }
    }, [error]);
    useEffect(() => {
        if (data?.chats) {
            setLoadedChatHistory(true);
        }
    }, [data]);

    const filteredChats = data?.chats.filter((c) => (c.title?.toLowerCase().includes(query.toLowerCase()) || !c.title)) || [];

    if (isLoading) {
        return (
            <div
                className="h-full w-24 overflow-y-auto bg-background md:w-60 flex flex-col overflow-x-hidden items-center justify-center"
            >
                <RotateLoader color="#94a3b8" />
            </div>
        )
    }

    return (
        <div
            className="h-full w-24 overflow-y-auto bg-background md:w-60 flex flex-col overflow-x-hidden"
        >
            <div className="justify-end flex">
                <HiddenChatListButton setShowChatList={setShowChatList} />
            </div>
            <div className="flex items-start">
                <ListTitle chats={data?.chats} />
            </div>
            <div className="p-4">
                <SearchBox setQuery={setQuery} />
            </div>
            <div className="mx-2 space-y-4 flex-1 overflow-hidden hover:overflow-y-auto w-24 md:w-[95%]">
                {filteredChats.length ? (
                    filteredChats.map((chat, i) => {
                        return (
                            <motion.div
                                key={chat.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <ChatListItem
                                    key={i}
                                    chat={chat}
                                    path={path}
                                    i={i}
                                    userId={userId}
                                    id={id}
                                    dispatch={dispatch}
                                />
                            </motion.div>
                        )
                    })

                ) : (
                    <div className="p-8 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">No chat history</p>
                    </div>
                )}
            </div>
            <div className="mt-auto px-4 w-24 md:w-full py-2 overflow-hidden border-t">
                <Button
                    size='sm'
                    variant='ghost'
                    type="button"
                    className={`text-slate-500 dark:text-slate-400 dark:hover:text-slate-50 w-full`}
                    onClick={async () => {
                        dispatch({ type: "RESET_ID" });
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="hidden md:block h-4 h-4"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M8 9h8"></path>
                        <path d="M8 13h6"></path>
                        <path
                            d="M12.01 18.594l-4.01 2.406v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5"
                        ></path>
                        <path d="M16 19h6"></path>
                        <path d="M19 16v6"></path>
                    </svg>
                    <p className="px-4">New Chat</p>
                </Button>
                <ClearHistory
                    isEnabled={(data?.chats.length || 0) > 0}
                    userId={userId}
                    dispatch={dispatch}
                />
            </div>
        </div >
    )
}