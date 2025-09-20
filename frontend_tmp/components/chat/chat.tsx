"use client";

import { Typewriter } from 'react-simple-typewriter';
import { ChatInput } from './chat-input';
import { Reducer, useReducer, useState } from 'react';
import { AppShell } from '../app-shell';
import { AIModel, DocumentPack, ImageContent, Message, Personality, TextContent } from '@/lib/types';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useSocket } from '@/hooks/use-socket';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useSocketHandlers } from '@/hooks/use-socket-handlers';
import { uuidv4 } from '@/lib/utils';
import imageCompression from "browser-image-compression";
import { Card, CardContent } from '../ui/card';
import { FC, memo } from 'react';
import ReactMarkdown, { Options } from 'react-markdown';
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";


interface ChatProps {
    history?: { name: string; url: string; icon?: undefined; id: string; }[];
    docs?: { name: string; url: string; icon?: undefined; id: string; }[];
    userId: string;
    defaultPersonality: Personality;
    models: AIModel[];
    modelSelection: string;
    personalities: Personality[];
}

const readFileAsync = (file: File) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = () => {
            reader.abort();
            reject(new DOMException("Problem parsing input file."));
        };

        reader.readAsDataURL(file);
    });
};

export function Chat({ history, docs, userId, defaultPersonality, models, modelSelection, personalities }: ChatProps) {
    const [input, setInput] = useState("");
    const [id, setId] = useState(uuidv4());
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [selectedDocumentPack, setSelectedDocumentPack] =
        useState<DocumentPack | null>(null);
    const token = useAuthToken(userId);
    const socket = useSocket({
        socketNamespace: "jarvis",
        userId: userId,
        token,
    });
    const [isLoading, setIsLoading] = useReducer<Record<string, boolean>, any>(chatGeneratingReducer, {});
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
    const [personality, setPersonality] = useState(defaultPersonality);


    useNetworkStatus({ socket });
    useSocketHandlers(
        socket,
        id,
        userId,
        setMessages,
        // setCurrentContext,
        // setSelectedPersonality,
        setIsLoading,
        setSelectedDocuments,
        setSelectedDocumentPack
    );

    const append = (msg: Message) => {
        if (isLoading[id] || !socket) {
            return;
        }
        setMessages((currentMessages) => {
            return [...(currentMessages || []).concat(msg as Message)];
        });
        setIsLoading({ type: "UPDATE_CHAT_STATUS", status: true, id: id });
        // setCurrentContext(null);
        socket.emit("chat_message", msg);
    };

    const onSubmit = async (value: string, onComplete: () => void, additionalDocs: string[]) => {
        const msgId = uuidv4();
        const imgs = [];
        // console.log("start reading images");
        const options = {
            maxSizeMB: 0.5, // Reduce to 500 KB
            maxWidthOrHeight: 1024, // Resize if needed
            useWebWorker: true,
        };

        for (let i = 0; i < selectedImages.length; i++) {
            try {
                const compressedImage = await imageCompression(
                    selectedImages[i],
                    options
                );
                const res = await readFileAsync(compressedImage);
                imgs.push(res);
            } catch (error) {
                console.error("failed to read image:", error);
            }
        }
        append({
            id: msgId,
            content: [
                { type: "text", text: value } as TextContent,
                ...imgs.map((i) => {
                    return {
                        type: "image_url",
                        image_url: { url: i },
                    } as ImageContent;
                }),
            ],
            chatId: id,
            userId: userId,
            role: "user",
            data: {
                personality: personality,
                docs: Array.from(
                    new Set([...selectedDocuments, ...additionalDocs])
                ),
                first_message: messages.length === 0,
                detect_hallucination: false,  // TODO:
                document_pack: selectedDocumentPack,
            },
        });
        setIsLoading({ type: "UPDATE_CHAT_STATUS", id: id, status: true });
        setSelectedImages([]);
        setSelectedPreviews([]);
        setSelectedDocuments((old) => [...old, ...additionalDocs]);
        setTimeout(() => onComplete(), 50);
    };

    return (
        <AppShell
            history={history}
            docs={docs}
        >
            {messages.length === 0 &&
                <div className="mx-auto h-full flex items-center justify-center my-auto flex-col w-full">
                    <h1 className='text-2xl'>
                        <Typewriter
                            words={["Hi I'm Jarvis, how can I help you?"]}
                            loop={0}
                            cursor
                            cursorStyle="|"
                            typeSpeed={100}
                            deleteSpeed={100}
                            delaySpeed={2000}
                        />
                    </h1>
                    <ChatInput
                        onSubmit={onSubmit}
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading[id]}
                        selectedImages={[]}
                        setSelectedImages={() => { }}
                        selectedPreviews={[]}
                        setSelectedPreviews={() => { }}
                        reload={() => { }}
                        stop={() => { }}
                        messageCount={messages.length}
                        detectHallucination={false}
                        setDetectHallucination={() => { }}
                        userId={userId}
                        setSelectedDocumentPack={setSelectedDocumentPack}
                        modelSelection={modelSelection}
                        models={models}
                        personalities={personalities}
                        personalitySelection={defaultPersonality}
                    />
                </div> ||
                <div className='flex-col flex h-full'>
                    <div className='my-8 mx-20 space-y-4 h-full overflow-auto'>
                        {messages.map((m) => {
                            if (m.role === "user") {
                                return (
                                    <Card key={m.id}>
                                        <CardContent className='text-xs'>
                                            {m.content[0].text}
                                        </CardContent>
                                    </Card>
                                );
                            }
                            return (

                                <div key={m.id} className='text-xs py-4 px-6'>
                                    {m.content[0].text}
                                </div>
                            );
                        })}
                    </div>
                    <div className='justify-end'>
                        <ChatInput
                            onSubmit={onSubmit}
                            input={input}
                            setInput={setInput}
                            isLoading={isLoading[id]}
                            selectedImages={[]}
                            setSelectedImages={() => { }}
                            selectedPreviews={[]}
                            setSelectedPreviews={() => { }}
                            reload={() => { }}
                            stop={() => { }}
                            messageCount={messages.length}
                            detectHallucination={false}
                            setDetectHallucination={() => { }}
                            userId={userId}
                            setSelectedDocumentPack={setSelectedDocumentPack}
                            modelSelection={modelSelection}
                            models={models}
                            personalities={personalities}
                            personalitySelection={defaultPersonality}
                        />
                    </div>
                </div>
            }
        </AppShell>
    );
}

function chatGeneratingReducer(
    state: Record<string, boolean>,
    action: any
) {
    let newState = null;
    switch (action.type) {
        case "ADD_CHAT":
            const chatId = action["id"] as string;
            newState = { ...state };
            newState[chatId] = false;
            return newState;
        case "UPDATE_CHAT_STATUS":
            newState = { ...state };
            newState[action.id] = action.status;
            return newState;
        case "DISCONNECT":
            newState = {} as Record<string, boolean>;
            for (const [key, _] of Object.entries(state)) {
                newState[key] = false;
            }
            return newState;
        default:
            return state;
    }
}

function chatIdReducer(state: string | null, action: any) {
    switch (action.type) {
        case "UPDATE_ID":
            return action.payload;
        case "RESET_ID":
            return uuidv4();
        default:
            return state;
    }
}



// const MemoizedReactMarkdown: FC<Options> = memo(
//     ReactMarkdown,
//     (prevProps, nextProps) =>
//         prevProps.children === nextProps.children &&
//         prevProps.className === nextProps.className
// );

// function AIMessage() {
//     return (
//         <MemoizedReactMarkdown
//             className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 md:text-sm text-xs max-w-none w-full"
//             remarkPlugins={[remarkGfm, remarkMath]}
//             rehypePlugins={[rehypeKatex]}
//             components={{
//                 p({ children }) {
//                     return <p className="mb-2 last:mb-0">{children}</p>;
//                 },
//                 code({ node, inline, className, children, ...props }) {
//                     try {
//                         if (children.length) {
//                             if (children[0] == "▍") {
//                                 return (
//                                     <span className="mt-1 cursor-default animate-pulse">▍</span>
//                                 );
//                             }

//                             children[0] = (children[0] as string).replace("`▍`", "▍");
//                         }

//                         const match = /language-(\w+)/.exec(className || "");

//                         if (inline) {
//                             return (
//                                 <code className={className} {...props}>
//                                     {children}
//                                 </code>
//                             );
//                         }

//                         return (
//                             <CodeBlock
//                                 key={Math.random()}
//                                 language={(match && match[1]) || ""}
//                                 value={String(children).replace(/\n$/, "")}
//                                 {...props}
//                             />
//                         );
//                     } catch (err) {
//                         return (
//                             <code className={className} {...props}>
//                                 {children}
//                             </code>
//                         );
//                     }
//                 },
//             }}
//         >
//             {message}
//         </MemoizedReactMarkdown>
//     );
// }
