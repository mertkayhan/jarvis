'use client'

import Textarea from 'react-textarea-autosize'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useState, useRef, Dispatch, SetStateAction, useEffect } from 'react'
import Image from 'next/image'
import { useToast } from '@/lib/hooks/use-toast'
import { RegenerateResponse } from './regenerate-response'
import { DetectHallucination } from './detect-hallucination'
import { SubmitButton } from './submit-button'
import { UploadMenu } from './upload-menu'
import { Button } from '../ui/button'
import { IconClose } from '../ui/icons'
import { DocumentPack, QuestionPack } from '@/lib/types'

export interface ChatInputProps {
    input: string
    setInput: Dispatch<SetStateAction<string>>
    onSubmit: (value: string, onComplete: () => void, additionalDocs: string[]) => void
    isLoading: boolean
    selectedImages: File[]
    setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>
    selectedPreviews: string[]
    setSelectedPreviews: React.Dispatch<React.SetStateAction<string[]>>
    reload: () => void
    generateFollowUp: () => void
    stop: () => void
    messageCount: number
    hasSystemPrompt: boolean
    autoScroll: boolean
    setAutoScroll: Dispatch<SetStateAction<boolean>>
    detectHallucination: boolean
    setDetectHallucination: Dispatch<SetStateAction<boolean>>
    userId: string
    setSelectedQuestionPack: Dispatch<SetStateAction<QuestionPack | null>>
    setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>
}


export function ChatInput({
    onSubmit,
    input,
    setInput,
    isLoading,
    selectedImages,
    setSelectedImages,
    setSelectedPreviews,
    selectedPreviews,
    reload,
    generateFollowUp,
    stop,
    messageCount,
    autoScroll,
    setAutoScroll,
    detectHallucination,
    setDetectHallucination,
    userId,
    setSelectedQuestionPack,
    setSelectedDocumentPack
}: ChatInputProps) {
    const [appendDone, setAppendDone] = useState(true);
    const { formRef, onKeyDown } = useEnterSubmit()
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();
    const [additionalDocs, setAdditionalDocs] = useState<string[]>([]);
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        const totalSize = selectedImages.map((img) => (img.size / (1024 * 1024))).reduce((prevValue, size) => prevValue + Math.min(size, 0.5), 0);
        if (totalSize >= 1) {
            toast({ title: "Too many images", description: "The total size of attached images should not exceed 1 Mb!", variant: "destructive", duration: 5000 });
        }
    }, [selectedImages]);

    const onComplete = () => {
        setAdditionalDocs([]);
        setAppendDone(true);
        setInput('');
    }

    return (
        <div className='flex flex-col w-full items-center'>
            <form
                className='w-full'
                ref={formRef}
                onSubmit={async e => {
                    // console.log("submit triggered", e)
                    e.preventDefault()
                    if (!input?.trim()) {
                        return
                    }
                    if (isDropdownOpen) {
                        return
                    }
                    // console.log("after overlay open");
                    setAppendDone(false);
                    if (!isLoading) {
                        onSubmit(input, onComplete, additionalDocs);
                    }
                }}
            >
                <div
                    id="chat-input-form"
                    className={`${messageCount === 0 ? 'dark:bg-slate-900 bg-slate-100' : 'bg-transparent'} md:mb-4 w-full max-w-3xl rounded-lg border bg-background shadow-lg items-center justify-center ${(!appendDone) ? 'pointer-events-none opacity-50' : ''}`}
                    onFocusCapture={(e) => {
                        setTimeout(() => {
                            if (inputRef.current && !isDropdownOpen) {
                                inputRef.current.focus();
                                // Move cursor to the end of the text
                                const length = inputRef.current.value.length;
                                inputRef.current.setSelectionRange(length, length);
                            }
                        }, 100);
                    }}
                >
                    {(selectedPreviews.length > 0) && <div className='p-2 grid-cols-5 space-2'>
                        {selectedPreviews.map((img, i) => {
                            return (
                                <div
                                    key={i}
                                    className="relative group cursor-pointer w-[50px] h-[50px]"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedPreviews((old) => old.filter((_, idx) => idx !== i));
                                        setSelectedImages((old) => old.filter((_, index) => i !== index));
                                        inputRef.current?.focus();
                                    }}
                                >
                                    <Image
                                        src={img}
                                        alt="Uploaded image"
                                        height={50}
                                        width={50}
                                        className="rounded-lg transition duration-300 ease-in-out group-hover:brightness-50 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6 text-white"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6l-2 14H7L5 6"></path>
                                            <path d="M10 11v6"></path>
                                            <path d="M14 11v6"></path>
                                        </svg>
                                    </div>
                                </div>

                            );
                        })}
                    </div>}
                    {additionalDocs.length > 0 && (
                        <span
                            className='ml-2 text-xs px-3 py-1 rounded-md bg-gradient-to-r from-indigo-500 to-blue-400 text-white shadow-lg transition-all duration-300 ease-in-out'
                        >
                            <>
                                {additionalDocs.length} additional document{additionalDocs.length > 1 ? 's' : ''} attached 📄✨
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => setAdditionalDocs([])}
                                    className='hover:bg-transparent hover:text-red-500 w-3 items-center justify-center ml-2'
                                >
                                    <IconClose className='h-3 w-3' />
                                </Button>
                            </>
                        </span>
                    )}
                    <div
                        className="max-h-60 overflow-auto rounded-lg rounded-b-none p-2 md:p-4 bg-transparent"
                    >
                        <label htmlFor="prompt-input" className="sr-only">Enter your prompt</label>
                        <Textarea
                            ref={inputRef}
                            autoFocus
                            tabIndex={0}
                            onKeyDown={onKeyDown}
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Enter your prompt"
                            spellCheck={true}
                            className="flex bg-transparent resize-none focus-within:outline-none text-xs w-full border-0 px-0 md:text-sm text-slate-900 focus:outline-none dark:text-slate-200 dark:placeholder-slate-400 overflow-hidden"
                            onPaste={(e) => {
                                // console.log(e);
                                // console.log(e.clipboardData.getData("text"));
                                // console.log(e.clipboardData.files);
                                const validFiles: File[] = [];
                                const validPreviews: string[] = [];
                                for (const clipboardItem of e.clipboardData.files) {
                                    if (clipboardItem.type === "image/png" || clipboardItem.type === "image/jpeg") {
                                        validFiles.push(clipboardItem);
                                        validPreviews.push(URL.createObjectURL(clipboardItem));
                                    }
                                }
                                setSelectedImages((old) => [...old, ...validFiles]);
                                setSelectedPreviews((old) => [...old, ...validPreviews]);
                            }}
                        />
                    </div>
                    <div className="flex items-center justify-between md:p-2">
                        <div className='flex'>
                            <UploadMenu
                                setSelectedImages={setSelectedImages}
                                setSelectedPreviews={setSelectedPreviews}
                                selectedDocuments={additionalDocs}
                                setSelectedDocuments={setAdditionalDocs}
                                userId={userId}
                                messagesLength={messageCount}
                                isDropdownOpen={isDropdownOpen}
                                setDropdownOpen={setDropdownOpen}
                                setSelectedQuestionPack={setSelectedQuestionPack}
                                setSelectedDocumentPack={setSelectedDocumentPack}
                            />
                            <RegenerateResponse reload={reload} messageCount={messageCount} />
                        </div>
                        <div className='flex justify-end items-center gap-2 w-full'>
                            <DetectHallucination detectHallucination={detectHallucination} setDetectHallucination={setDetectHallucination} />
                            <SubmitButton isLoading={isLoading} input={input} stop={stop} />
                        </div>
                    </div>
                </div >
            </form >
        </div >
    )
}

