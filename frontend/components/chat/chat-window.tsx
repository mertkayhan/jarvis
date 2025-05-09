'use client'

import { HashLoader } from "react-spinners";
import { ChatList } from "./chat-list";
import { EmptyScreen } from "@/components/chat/empty-screen";
import { Message } from "@/lib/types";
import { Dispatch, SetStateAction, useRef, useEffect } from "react";

interface ChatWindowProps {
    messages: Message[]
    isLoading: boolean
    setCurrentContext: Dispatch<SetStateAction<string | null | undefined>>
    initialized: boolean
    greeting: string
    autoScroll: boolean
}

export function ChatWindow({
    messages, initialized, isLoading, setCurrentContext,
    greeting, autoScroll }: ChatWindowProps) {

    const messageEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!messages.length) {
            return;
        }

        const isUser = messages[messages.length - 1].role === "user";
        const lastMessage = document.getElementById(`message-${messages.length - 1}`);

        const lastMessageVisible = (() => {
            if (!lastMessage) return false;
            const rect = lastMessage.getBoundingClientRect();
            return rect.bottom <= window.innerHeight && rect.top >= 0;
        })();

        if (isUser) {
            messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else if (!isLoading && !lastMessageVisible) {
            messageEndRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            });
        }
    }, [messages, isLoading]);

    return (
        <>
            {messages.length > 0 &&
                (
                    <div className="flex flex-col flex-1 h-full">
                        <div className="flex-1 h-full" id='chat-container'>
                            <div
                                className="h-full pl-2 md:pl-12"
                                id="chat-list-container"
                            >
                                <ChatList
                                    messages={messages}
                                    streaming={isLoading}
                                    setCurrentContext={setCurrentContext}
                                    messageEndRef={messageEndRef}
                                />

                            </div>
                        </div>
                    </div>
                )}
            {messages.length === 0 &&
                (
                    <div className="flex flex-col flex-1">
                        <div className="flex-1 overflow-y-auto overflow-x-auto" id='chat-container'>
                            <EmptyScreen greeting={greeting} />
                        </div>
                    </div>
                )
            }

        </>
    )
}