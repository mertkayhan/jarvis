'use client'

import { DocumentPack, Message, Personality, QuestionPack } from '@/lib/types'
import { ChatPanel } from '@/components/chat/chat-panel'
import React, { useState, Dispatch, SetStateAction } from 'react';
import { defaultSystemPrompt, PromptTemplate } from '@/lib/prompt-template'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import useScreenSize from '@/lib/hooks/use-screen-size';
import ContextExplorer from '@/components/chat/context-explorer'
import { ChatWindow } from './chat-window';
import { appendFn, cancelFn, generateFollowUpFn, reloadFn } from './chat-functions';
import { useNetworkStatus } from '@/lib/hooks/use-network-status';
import { useSocketHandlers } from '@/lib/hooks/use-socket-handlers';
import { HashLoader } from 'react-spinners';
import { motion } from "framer-motion";
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DocumentSelectionMenu } from '../document-repo/document-selection-menu';
import { IconArrowRight } from '../ui/icons';
import { QuestionPackSelectionMenu } from '../question-packs/question-pack-selection-menu';
import { PersonalitySelectionMenu } from '../personalities/personality-selection-menu';
import { Socket } from 'socket.io-client';
import { DocumentPackSelectionMenu } from '../document-packs/document-pack-selection-menu';


export interface ChatProps {
    initialMessages?: Message[]
    userId: string
    path: string
    greeting: string
    hasSystemPrompt: boolean
    promptTemplate?: PromptTemplate
    selectedPersonality: Personality
    setSelectedPersonality: Dispatch<SetStateAction<Personality>>
    socket: Socket | null
    id: string
    dispatch: Dispatch<any>
    isLoading: Record<string, boolean>
    setLoading: Dispatch<any>
}

export function Chat({
    userId,
    path,
    greeting,
    hasSystemPrompt,
    promptTemplate,
    selectedPersonality,
    setSelectedPersonality,
    socket,
    id,
    isLoading,
    setLoading
}: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const screenSize = useScreenSize();
    const [currentContext, setCurrentContext] = useState<string | null | undefined>(null);
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [selectedQuestionPack, setSelectedQuestionPack] = useState<QuestionPack | null>(null);
    const [selectedDocumentPack, setSelectedDocumentPack] = useState<DocumentPack | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    useNetworkStatus({ socket, path });
    useSocketHandlers(socket, setInitialized, id, userId, setMessages, setCurrentContext, setSelectedPersonality, setLoading, setSelectedDocuments, setSelectedQuestionPack, setSelectedDocumentPack);

    const append = appendFn(id, isLoading, setMessages, setLoading, socket, setCurrentContext);
    const cancel = cancelFn(socket, setLoading, id);
    const reload = reloadFn(id, socket, setLoading, messages, setMessages);
    const generateFollowUp = generateFollowUpFn(socket, append, id, userId);

    // console.log("connected", socket?.connected);

    // console.log("is loading", isLoading);

    return (
        <ResizablePanelGroup direction='horizontal'>
            {/* Chat Interface */}
            <ResizablePanel defaultSize={(screenSize.width >= 768) ? 70 : 100}>
                {(!socket?.connected) &&
                    <div className='flex w-full h-full mx-auto my-auto items-center justify-center'>
                        <HashLoader color="#94a3b8" />
                    </div>
                }
                {socket?.connected &&
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            layout
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className={`flex flex-col flex-1 ${messages.length > 0 ? 'h-full' : 'my-auto h-full'}`}
                        >
                            {/* Chat Messages Section */}
                            <motion.div
                                className={`flex flex-col flex-grow transition-all overflow-auto ${messages.length > 0 ? 'h-full' : 'justify-end h-full items-center'}`}
                            >
                                <ChatWindow
                                    messages={messages}
                                    isLoading={isLoading[id]}
                                    setCurrentContext={setCurrentContext}
                                    initialized={initialized}
                                    greeting={greeting}
                                    autoScroll={autoScroll}
                                />
                            </motion.div>
                            {initialized && messages.length === 0 &&
                                <TooltipProvider>
                                    <div className='hidden w-full md:flex flex-1 grid-cols-3 items-center gap-x-2 h-10 justify-center'>
                                        <div className="space-y-2">
                                            <div className='flex'>
                                                <PersonalitySelectionMenu
                                                    title={(selectedPersonality.name === "default") ? 'Pick personality' : selectedPersonality.name}
                                                    userId={userId}
                                                    setSelectedPersonality={setSelectedPersonality}
                                                />
                                                {selectedPersonality.name !== "default" &&
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    type='button'
                                                                    className='hover:bg-transparent hover:text-red-500 w-3 h-3'
                                                                    onClick={() => setSelectedPersonality(defaultSystemPrompt)}
                                                                >
                                                                    <svg
                                                                        className="w-3 h-3"
                                                                        viewBox="0 0 15 15"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                                                    </svg>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Click to reset</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                }
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className='flex'>
                                                <DocumentSelectionMenu
                                                    userId={userId}
                                                    setSelectedDocuments={setSelectedDocuments}
                                                    selectedDocuments={selectedDocuments}
                                                    buttonStyle='group flex bg-transparent hover:bg-transparent items-center gap-3 px-0 py-3 text-base font-medium text-slate-700 transition-all hover:text-indigo-500 dark:text-slate-300 dark:hover:text-indigo-400'
                                                >
                                                    <IconArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400" />
                                                    <span className='pr-2'>{(selectedDocuments.length === 0) ? "Add docs" : `${selectedDocuments.length} document(s) selected`}</span>
                                                </DocumentSelectionMenu>
                                                {selectedDocuments.length > 0 &&
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    type='button'
                                                                    className='hover:bg-transparent hover:text-red-500 w-3 h-3'
                                                                    onClick={() => setSelectedDocuments([])}
                                                                >
                                                                    <svg
                                                                        className="w-3 h-3"
                                                                        viewBox="0 0 15 15"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                                                    </svg>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Click to reset</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                }
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            <div className='flex'>
                                                <QuestionPackSelectionMenu
                                                    title={(!selectedQuestionPack) ? 'Add question pack' : selectedQuestionPack.name}
                                                    userId={userId}
                                                    setSelectedQuestionPack={setSelectedQuestionPack}
                                                />
                                                {Boolean(selectedQuestionPack) &&
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    type='button'
                                                                    className='hover:bg-transparent hover:text-red-500 w-3 h-3'
                                                                    onClick={() => setSelectedQuestionPack(null)}
                                                                >
                                                                    <svg
                                                                        className="w-3 h-3"
                                                                        viewBox="0 0 15 15"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                                                    </svg>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Click to reset</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                }
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            <div className='flex'>
                                                <DocumentPackSelectionMenu
                                                    title={(!selectedDocumentPack) ? 'Add doc pack' : selectedDocumentPack.name}
                                                    userId={userId}
                                                    setSelectedDocumentPack={setSelectedDocumentPack}
                                                />
                                                {Boolean(selectedDocumentPack) &&
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    type='button'
                                                                    className='hover:bg-transparent hover:text-red-500 w-3 h-3'
                                                                    onClick={() => setSelectedDocumentPack(null)}
                                                                >
                                                                    <svg
                                                                        className="w-3 h-3"
                                                                        viewBox="0 0 15 15"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                                                    </svg>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Click to reset</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </TooltipProvider>
                            }
                            {/* Chat Input Box Section - Initially Centered */}
                            {initialized &&
                                <motion.div
                                    className={`md:pt-4 w-full flex flex-col transition-all items-center mx-auto ${messages.length > 0 ? '' : 'justify-start h-full flex-grow'}`}
                                >
                                    <ChatPanel
                                        id={id as string}
                                        isLoading={isLoading[id]}
                                        stop={cancel}
                                        append={append}
                                        reload={reload}
                                        messageCount={messages?.length || 0}
                                        input={input}
                                        setInput={setInput}
                                        userId={userId}
                                        path={path}
                                        generateFollowUp={generateFollowUp}
                                        hasSystemPrompt={hasSystemPrompt}
                                        promptTemplate={promptTemplate}
                                        selectedDocuments={selectedDocuments}
                                        selectedPersonality={selectedPersonality}
                                        autoScroll={autoScroll}
                                        setAutoScroll={setAutoScroll}
                                        selectedQuestionPack={selectedQuestionPack}
                                        setSelectedDocuments={setSelectedDocuments}
                                        selectedDocumentPack={selectedDocumentPack}
                                        dispatch={setLoading}
                                    />
                                </motion.div>
                            }
                        </motion.div>
                    </>
                }
            </ResizablePanel>
            <ResizableHandle withHandle />
            {/* Context Explorer */}
            <ResizablePanel defaultSize={(screenSize.width >= 768) ? 30 : 0} minSize={(screenSize.width >= 768) ? 5 : 0}>
                <div
                    className={`hidden w-full h-full md:flex md:flex-col border-l p-4 overflow-y-auto bg-background transition-opacity duration-500 ${initialized ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                >
                    {initialized && <ContextExplorer context={currentContext} />}
                </div>
            </ResizablePanel>
        </ResizablePanelGroup >
    );
}
