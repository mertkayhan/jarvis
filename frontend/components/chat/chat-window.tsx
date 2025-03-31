'use client'

import { HashLoader } from "react-spinners";
import { ChatList } from "./chat-list";
import { EmptyScreen } from "@/components/chat/empty-screen";
import { Message } from "@/lib/types";
import { Dispatch, SetStateAction, useRef, useEffect, useState } from "react";

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
        if (autoScroll) {
            messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <>
            {!initialized &&
                <div className='flex w-full h-full mx-auto my-auto items-center justify-center'>
                    <HashLoader color="#94a3b8" />
                </div>
            }
            {initialized && messages.length > 0 &&
                (
                    <div className="flex flex-col flex-1 h-full">
                        <div className="flex-1 overflow-y-auto overflow-x-auto h-full" id='chat-container'>
                            <div
                                className="h-full overflow-y-auto pl-2 md:pl-12"
                                id="chat-list-container"
                            >
                                <ChatList
                                    messages={messages}
                                    streaming={isLoading}
                                    setCurrentContext={setCurrentContext}
                                />
                                <div ref={messageEndRef} id="message-end"></div>
                            </div>
                        </div>
                    </div>
                )}
            {initialized && messages.length === 0 &&
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