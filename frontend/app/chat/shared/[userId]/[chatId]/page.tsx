'use client';

import Loading from '@/app/loading';
import { Chat } from '@/components/chat/chat';
import { Sidebar } from '@/components/sidebar/chat-sidebar';
import { useParams } from 'next/navigation';
import { useAuthToken } from '@/lib/hooks/use-auth-token';
import { useSocket } from '@/lib/hooks/use-socket';
import { Reducer, useEffect, useReducer, useState } from 'react';
import { chatGeneratingReducer } from '@/components/chat/chat-reducers';
import { useQuery } from '@tanstack/react-query';


export default function Page() {
    const params = useParams<{ userId: string; chatId: string; }>();
    const id = params?.chatId;
    const token = useAuthToken(params.userId);
    const [userId, setUserId] = useState<string | null>(null);
    const socket = useSocket({ socketNamespace: "jarvis", userId: userId, token });
    const [chatGenerating, chatGeneratingDispatch] = useReducer<Reducer<Record<string, boolean>, any>>(chatGeneratingReducer, {});

    useEffect(() => {
        if (typeof window !== "undefined" && params?.userId) {
            setUserId(atob(decodeURIComponent(params.userId)));
        }
    }, [params?.userId]);


    if (!id || !userId) {
        return <Loading />;
    }

    return (
        <div className='h-full flex flex-col flex-1'>
            <title>J.A.R.V.I.S.</title>
            <div className='flex flex-col h-full'>
                <div className="flex h-screen">
                    <div
                        className='flex h-full flex-col border-slate-300 bg-background transition-all duration-300'
                    >
                        <Sidebar
                            highlight={false}
                            showChatList={false}
                            moduleName="jarvis"
                            userId={userId as string}
                        />
                    </div>
                    <div
                        className="flex w-full h-full overflow-auto pl-0 animate-in duration-300 ease-in-out peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
                    >
                        <Chat
                            path="chat"
                            greeting="Hi I'm Jarvis, how can I help you?"
                            socket={socket}
                            id={id}
                            dispatch={(_: any) => { }}
                            userId={userId}
                            defaultPersonality={undefined}
                            selectedPersonality={undefined}
                            setSelectedPersonality={(_: any) => { }}
                            isLoading={chatGenerating}
                            setLoading={chatGeneratingDispatch}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
}
