"use client";

import Textarea from "react-textarea-autosize";
import { useState, useRef, Dispatch, SetStateAction, ForwardRefExoticComponent, RefAttributes, ReactNode } from "react";
import Image from "next/image";
// import { RegenerateResponse; } from "./regenerate-response";
// import { DetectHallucination } from "./detect-hallucination";
// import { UploadMenu } from "./upload-menu";
import { Button } from "../ui/button";
import { AIModel, DocumentPack, Personality } from "@/lib/types";
import { Brain, Check, ChevronsUpDown, FilePlus2, FolderPlus, ImagePlus, Lightbulb, Plus, Send, StopCircle, User2, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Command } from "../ui/command";
import { cn } from "@/lib/utils";
import { Toggle } from "../ui/toggle";



export interface ChatInputProps {
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    onSubmit: (
        value: string,
        onComplete: () => void,
        additionalDocs: string[]
    ) => void;
    isLoading: boolean;
    selectedImages: File[];
    setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
    selectedPreviews: string[];
    setSelectedPreviews: React.Dispatch<React.SetStateAction<string[]>>;
    reload: () => void;
    stop: () => void;
    messageCount: number;
    detectHallucination: boolean;
    setDetectHallucination: Dispatch<SetStateAction<boolean>>;
    userId: string;
    setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>;
    models: AIModel[];
    modelSelection: string;
    personalities: Personality[];
    personalitySelection: Personality;
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
    stop,
    messageCount,
    detectHallucination,
    setDetectHallucination,
    userId,
    setSelectedDocumentPack,
    modelSelection,
    models,
    personalities,
    personalitySelection
}: ChatInputProps) {
    const [appendDone, setAppendDone] = useState(true);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [additionalDocs, setAdditionalDocs] = useState<string[]>([]);
    const [isUploadOpen, setUploadOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isModelSelectionOpen, setModelSelectionOpen] = useState(false);
    const [isPersonalitySelectionOpen, setPersonalitySelectionOpen] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);

    // useEffect(() => {
    //     const totalSize = selectedImages
    //         .map((img) => img.size / (1024 * 1024))
    //         .reduce((prevValue, size) => prevValue + Math.min(size, 0.5), 0);
    // if (totalSize >= 1) {
    //     toast({
    //         title: "Too many images",
    //         description:
    //             "The total size of attached images should not exceed 1 Mb!",
    //         variant: "destructive",
    //         duration: 5000,
    //     });
    // }
    // }, [selectedImages]);



    const onComplete = () => {
        setAdditionalDocs([]);
        setAppendDone(true);
        setInput("");
    };

    return (
        <div className="flex w-full p-6 items-center justify-center mx-auto">
            <form
                className="flex w-full mx-auto justify-center"
                ref={formRef}
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (!input?.trim() || isUploadOpen || isSettingsOpen) {
                        return;
                    }
                    setAppendDone(false);
                    if (!isLoading) {
                        onSubmit(input, onComplete, additionalDocs);
                    } else {
                        setAppendDone(true);
                    }
                }}
            >
                <div
                    id="chat-input-form"
                    className={`bg-accent-background w-full max-w-3xl rounded-lg border shadow-lg items-center justify-center ${!appendDone ? "pointer-events-none opacity-50" : ""}`}
                    onFocusCapture={(e) => {
                        setTimeout(() => {
                            if (inputRef.current && !isUploadOpen && !isSettingsOpen && !isModelSelectionOpen) {
                                inputRef.current.focus();
                                // Move cursor to the end of the text
                                const length = inputRef.current.value.length;
                                inputRef.current.setSelectionRange(length, length);
                            }
                        }, 100);
                    }}
                >
                    {selectedPreviews.length > 0 && (
                        <div className="p-2 grid-cols-5 space-2 flex">
                            {selectedPreviews.map((img, i) => {
                                return (
                                    <div
                                        key={i}
                                        className="relative group cursor-pointer w-[50px] h-[50px]"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedPreviews((old) =>
                                                old.filter((_, idx) => idx !== i)
                                            );
                                            setSelectedImages((old) =>
                                                old.filter((_, index) => i !== index)
                                            );
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
                        </div>
                    )}
                    {additionalDocs.length > 0 && (
                        <span className="ml-2 text-xs px-3 py-1 rounded-md bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-lg transition-all duration-300 ease-in-out">
                            <>
                                {additionalDocs.length} additional document
                                {additionalDocs.length > 1 ? "s" : ""} attached 📄✨
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => setAdditionalDocs([])}
                                    className="hover:bg-transparent hover:text-red-500 w-3 items-center justify-center ml-2"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </>
                        </span>
                    )}
                    <div className="max-h-40 overflow-auto rounded-lg rounded-b-none p-4 bg-transparent">
                        <label htmlFor="prompt-input" className="sr-only">
                            Enter your prompt
                        </label>
                        <Textarea
                            ref={inputRef}
                            autoFocus
                            tabIndex={0}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    formRef.current?.requestSubmit();
                                    e.preventDefault();
                                }
                            }}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter your prompt"
                            spellCheck={true}
                            className="flex bg-transparent resize-none focus-within:outline-none text-xs w-full border-0 px-0 text-accent-foreground focus:outline-none dark:placeholder-muted-foreground overflow-hidden"
                            onPaste={(e) => {
                                // console.log(e);
                                // console.log(e.clipboardData.getData("text"));
                                // console.log(e.clipboardData.files);
                                const validFiles: File[] = [];
                                const validPreviews: string[] = [];
                                for (const clipboardItem of e.clipboardData.files) {
                                    if (
                                        clipboardItem.type === "image/png" ||
                                        clipboardItem.type === "image/jpeg"
                                    ) {
                                        validFiles.push(clipboardItem);
                                        validPreviews.push(URL.createObjectURL(clipboardItem));
                                    }
                                }
                                setSelectedImages((old) => [...old, ...validFiles]);
                                setSelectedPreviews((old) => [...old, ...validPreviews]);
                            }}
                        />
                    </div>
                    <div className="flex space-x-2 p-2 items-center">
                        <DropdownMenu modal open={isUploadOpen} onOpenChange={setUploadOpen} >
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="rounded-full"><Plus /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top">
                                <DropdownMenuItem>
                                    <ImagePlus /> Upload images
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <FilePlus2 /> Attach document
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <FolderPlus /> Attach document pack
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Toggle className="flex sm:w-full" variant="outline">
                            <Lightbulb />
                            <span className="hidden sm:block text-xs truncate">Detect hallucination</span>
                        </Toggle>
                        <ModelSelection
                            models={models}
                            modelSelection={modelSelection}
                            open={isModelSelectionOpen}
                            setOpen={setModelSelectionOpen}
                        />
                        <PersonalitySelection
                            personalities={personalities}
                            personalitySelection={personalitySelection}
                            open={isPersonalitySelectionOpen}
                            setOpen={setPersonalitySelectionOpen}
                        />
                        <div className="flex justify-end items-center gap-2 w-full">
                            <SubmitButton isLoading={isLoading} input={input} stop={stop} />
                        </div>
                    </div>
                </div>
            </form >
        </div >
    );
}

interface SubmitButtonProps {
    isLoading: boolean;
    input: string;
    stop: () => void;
}


function SubmitButton({ isLoading, input, stop }: SubmitButtonProps) {
    return isLoading && (
        <Button
            onClick={() => { stop(); }}
            type="button"
            variant="outline"
            className="rounded-full"
        >
            <span className="sr-only">Stop generation</span>
            <div className="relative flex items-center justify-center">
                {/* Spinner */}
                <svg
                    className="animate-spin text-slate-500 dark:text-slate-400 absolute"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                </svg>
                {/* Stop Icon */}
                <StopCircle />
            </div>
        </Button>
    ) || (
            <Button
                disabled={input.trim().length === 0}
                size="icon"
                variant="outline"
                type="submit"
                className="rounded-full"
            >
                <span className="sr-only">Submit</span>
                <Send />
            </Button>
        );
}

interface ModelSelectionProps {
    models: AIModel[];
    modelSelection: string;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

function ModelSelection({ models, modelSelection, open, setOpen }: ModelSelectionProps) {
    return (
        <ItemSelection
            items={models}
            selection={modelSelection}
            open={open}
            setOpen={setOpen}
            selectPrompt="Select model..."
            searchPrompt="Search model..."
            icon={<Brain />}
        />
    );
}

interface PersonalitySelectionProps {
    personalities: Personality[];
    personalitySelection: Personality;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

function PersonalitySelection({ personalities, personalitySelection, open, setOpen }: PersonalitySelectionProps) {
    return (
        <ItemSelection
            items={personalities}
            selection={personalitySelection.name}
            open={open}
            setOpen={setOpen}
            selectPrompt="Select personality..."
            searchPrompt="Search personality..."
            icon={<User2 />}
        />
    );
}

interface ItemSelectionProps<T> {
    items: { name: string; }[];
    selection: string;
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    selectPrompt: string;
    searchPrompt: string;
    icon: ReactNode;
}

function ItemSelection<T>({ items, selection, open, setOpen, selectPrompt, searchPrompt, icon }: ItemSelectionProps<T>) {
    const [value, setValue] = useState(selection || "");

    return (
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="sm:w-[200px] justify-between text-xs border h-9"
                    size="sm"
                >
                    <div className="flex space-x-2">
                        {icon}
                        <span className="hidden sm:block">
                            {selection !== "" && selection !== "default"
                                ? items?.find((item) => item.name === value)?.name
                                : selectPrompt}
                        </span>
                    </div>
                    <ChevronsUpDown className="opacity-50 w-3 h-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" side="top">
                <Command>
                    <CommandInput placeholder={searchPrompt} className="h-9 text-xs" />
                    <CommandList>
                        <CommandEmpty className="py-6 text-center text-xs text-slate-500">
                            No model found.
                        </CommandEmpty>
                        <CommandGroup>
                            {items?.map((item, i) => (
                                <CommandItem
                                    key={item.name}
                                    value={item.name}
                                    onSelect={(currentValue) => {
                                        // TODO:
                                        // mutation.mutate(currentValue);
                                        setValue(currentValue);
                                        setOpen(false);
                                    }}
                                    className="text-xs"
                                >
                                    {item.name}
                                    <Check
                                        className={cn(
                                            "ml-auto w-3 h-3",
                                            value === item.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}