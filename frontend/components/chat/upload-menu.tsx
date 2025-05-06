'use client'

import { ImagePlusIcon, Lightbulb } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ChangeEvent, Dispatch, RefObject, SetStateAction, useRef, useState } from "react";
import { KnowledgeMenu } from "../knowledge/knowledge-selection-menu";
import { KnowledgeDropdown } from "../knowledge/knowledge-dropdown";
import { DocumentPack, QuestionPack } from "@/lib/types";
import { UploadDialog } from "./upload-dialog";

interface UploadMenuProps {
    setSelectedImages: Dispatch<SetStateAction<File[]>>
    setSelectedPreviews: Dispatch<SetStateAction<string[]>>
    userId: string
    selectedDocuments: string[]
    setSelectedDocuments: Dispatch<SetStateAction<string[]>>
    messagesLength: number
    isDropdownOpen: boolean
    setDropdownOpen: Dispatch<SetStateAction<boolean>>
    setSelectedQuestionPack: Dispatch<SetStateAction<QuestionPack | null>>
    setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>
}

export function UploadMenu({
    setSelectedPreviews,
    setSelectedImages,
    userId,
    selectedDocuments,
    setSelectedDocuments,
    messagesLength,
    isDropdownOpen,
    setDropdownOpen,
    setSelectedQuestionPack,
    setSelectedDocumentPack
}: UploadMenuProps) {
    const [kind, setKind] = useState("");
    const [open, setOpen] = useState(false);

    return (
        <TooltipProvider>
            {messagesLength > 0 &&
                <>
                    <KnowledgeDropdown
                        setKind={setKind}
                        setOpen={setOpen}
                        dropdownOpen={isDropdownOpen}
                        setDropdownOpen={setDropdownOpen}
                        tooltipContent="Attach knowledge"
                        triggerButton={
                            // <Tooltip>
                            //     <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className="inline-flex cursor-pointer justify-center rounded-lg p-2 text-slate-500 dark:text-slate-400 dark:hover:text-slate-50"
                                onClick={() => setDropdownOpen(true)}
                            >
                                <span className="sr-only">Attach knowledge</span>
                                <Lightbulb className='w-5 h-5' />
                            </Button>
                            //     </TooltipTrigger>
                            //     <TooltipContent>Add knowledge</TooltipContent>
                            // </Tooltip>
                        }
                    />
                    <KnowledgeMenu
                        userId={userId}
                        kind={kind}
                        open={open}
                        setOpen={setOpen}
                        selectedDocuments={selectedDocuments}
                        setSelectedDocuments={setSelectedDocuments}
                        setSelectedQuestionPack={setSelectedQuestionPack}
                        setSelectedDocumentPack={setSelectedDocumentPack}
                    />
                </>
            }
            <ImageUpload
                setSelectedImages={setSelectedImages}
                setSelectedPreviews={setSelectedPreviews}
            />
        </TooltipProvider>
    );
}

interface ImageUploadProps {
    setSelectedImages: Dispatch<SetStateAction<File[]>>
    setSelectedPreviews: Dispatch<SetStateAction<string[]>>
}

function ImageUpload({
    setSelectedImages,
    setSelectedPreviews
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);


    return (
        <Tooltip>
            <UploadDialog setSelectedImages={setSelectedImages} setSelectedPreviews={setSelectedPreviews} ref={fileInputRef}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className="inline-flex cursor-pointer justify-center rounded-lg p-2 text-slate-500 dark:text-slate-400 dark:hover:text-slate-50"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlusIcon className='w-5 h-5' />
                        <span className="sr-only">Attach images</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    Attach images
                </TooltipContent>
            </UploadDialog>
        </Tooltip>
    );
}
