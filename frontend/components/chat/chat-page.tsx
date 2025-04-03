'use client'

import { useUser } from '@auth0/nextjs-auth0/client';
import Loading from '@/app/loading';
import { Dispatch, Reducer, useEffect, useReducer, useState } from 'react';
import { Chat } from '@/components/chat/chat'
import { Sidebar } from '@/components/sidebar/chat-sidebar';
import { ChatHistoryList } from '../chat-sidebar/chat-history-list';
import { PromptTemplate } from '@/lib/prompt-template';
import { Personality } from '@/lib/types';
import { defaultSystemPrompt } from '@/lib/prompt-template';
import { getDefaultPersonality } from '@/components/personalities/personality-actions';
import { useQuery } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { chatGeneratingReducer } from './chat-reducers';

interface ChatPageProps {
    path: string
    greeting: string
    moduleName: string
    promptTemplate?: PromptTemplate
    title: string
    socket: Socket | null
    id: string
    dispatch: Dispatch<any>
}

function useDefaultPersonality(userId: string) {
    const { data } = useQuery({
        queryKey: ["getDefaultPersonality", userId],
        queryFn: () => getDefaultPersonality(userId as string),
        enabled: !!userId
    });
    return data?.personality;
}

export default function ChatPage({
    path,
    greeting,
    moduleName,
    promptTemplate,
    title,
    socket,
    id,
    dispatch,
}: ChatPageProps) {
    const { user, error, isLoading } = useUser();
    const [showChatList, setShowChatList] = useState(true);
    const defaultPersonality = useDefaultPersonality(user?.email as string);
    const [selectedPersonality, setSelectedPersonality] = useState<Personality>(defaultSystemPrompt);
    const [loadedChatHistory, setLoadedChatHistory] = useState(false);
    const [chatGenerating, chatGeneratingDispatch] = useReducer<Reducer<Record<string, boolean>, any>>(chatGeneratingReducer, {});

    useEffect(() => {
        if (defaultPersonality) {
            setSelectedPersonality((old) => (old === defaultSystemPrompt) ? defaultPersonality : old);
        }
        return () => {
            setLoadedChatHistory(false);
        }
    }, [defaultPersonality]);

    if (isLoading) {
        return (
            <>
                <title>Loading...</title>
                <Loading />
            </>
        )
    }
    if (error) return <p>{error.message}</p>

    return (
        <div className='h-full flex flex-col flex-1'>
            <title>{title}</title>
            <div className='flex flex-col h-full'>
                <div className="flex h-screen">
                    <div
                        className='flex h-full flex-col border-slate-300 bg-background transition-all duration-300'
                    >
                        <Sidebar
                            highlight={false}
                            showChatList={showChatList}
                            setShowChatList={setShowChatList}
                            moduleName={moduleName}
                            userId={user?.email as string}
                        >
                            <ChatHistoryList
                                setShowChatList={setShowChatList}
                                userId={user?.email as string}
                                path={path}
                                setLoadedChatHistory={setLoadedChatHistory}
                                id={id}
                                dispatch={dispatch}
                            />
                        </Sidebar>
                    </div>
                    <div
                        className="flex w-full h-full overflow-auto pl-0 animate-in duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
                    >
                        {loadedChatHistory &&
                            <Chat
                                userId={user?.email as string}
                                path={path}
                                greeting={greeting}
                                hasSystemPrompt
                                promptTemplate={promptTemplate}
                                selectedPersonality={selectedPersonality}
                                setSelectedPersonality={setSelectedPersonality}
                                socket={socket}
                                id={id}
                                dispatch={dispatch}
                                isLoading={chatGenerating}
                                setLoading={chatGeneratingDispatch}
                            />
                        }
                    </div>
                </div>
            </div>
        </div >
    )

}

