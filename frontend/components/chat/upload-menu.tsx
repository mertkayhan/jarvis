'use client'

import { FilePlusIcon, ImagePlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "../ui/dialog";
import { UploadDialog } from "./upload-dialog";
import { Dispatch, RefObject, SetStateAction } from "react";

interface UploadMenuProps {
    setSelectedImages: Dispatch<SetStateAction<File[]>>
    setSelectedImagesTmp: Dispatch<SetStateAction<File[]>>
    selectedImagesTmp: File[]
    setSelectedPreviewsTmp: Dispatch<SetStateAction<string[]>>
    setSelectedPreviews: Dispatch<SetStateAction<string[]>>
    selectedPreviewsTmp: string[]
    setOverlayOpen: Dispatch<SetStateAction<boolean>>
    userId: string
    selectedDocuments: string[]
    setSelectedDocuments: Dispatch<SetStateAction<string[]>>
    inputRef: RefObject<HTMLTextAreaElement>
    messagesLength: number
}

export function UploadMenu({
    setSelectedImagesTmp,
    setSelectedPreviews,
    setSelectedPreviewsTmp,
    selectedImagesTmp,
    selectedPreviewsTmp,
    setSelectedImages,
    setOverlayOpen,
    userId,
    selectedDocuments,
    setSelectedDocuments,
    inputRef,
    messagesLength
}: UploadMenuProps) {
    return (
        <>
            {/* {messagesLength > 0 && <DocumentSelectionMenu
                userId={userId}
                setSelectedDocuments={setSelectedDocuments}
                selectedDocuments={selectedDocuments}
                buttonStyle="inline-flex cursor-pointer justify-center rounded-lg p-2 text-slate-500 dark:text-slate-400 dark:hover:text-slate-50"
                buttonVariant="ghost"
                tooltipContent="Attach documents"
                onOpenChange={(open) => {
                    // console.log("on open change", open);
                    setOverlayOpen(open)
                    if (!open) {
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }
                }}>
                <span className="sr-only">Attach documents</span>
                <FilePlusIcon className='w-5 h-5' />
            </DocumentSelectionMenu >} */}
            <ImageUpload
                selectedImagesTmp={selectedImagesTmp}
                selectedPreviewsTmp={selectedPreviewsTmp}
                setOverlayOpen={setOverlayOpen}
                setSelectedImages={setSelectedImages}
                setSelectedImagesTmp={setSelectedImagesTmp}
                setSelectedPreviews={setSelectedPreviews}
                setSelectedPreviewsTmp={setSelectedPreviewsTmp}
            />
        </>
    );
}

interface ImageUploadProps {
    setSelectedImagesTmp: Dispatch<SetStateAction<File[]>>
    setSelectedPreviewsTmp: Dispatch<SetStateAction<string[]>>
    setOverlayOpen: Dispatch<SetStateAction<boolean>>
    selectedImagesTmp: File[]
    selectedPreviewsTmp: string[]
    setSelectedImages: Dispatch<SetStateAction<File[]>>
    setSelectedPreviews: Dispatch<SetStateAction<string[]>>
}

function ImageUpload({
    setSelectedImagesTmp,
    setSelectedPreviewsTmp,
    setOverlayOpen,
    selectedImagesTmp,
    selectedPreviewsTmp,
    setSelectedImages,
    setSelectedPreviews
}: ImageUploadProps) {
    return (
        <TooltipProvider>
            <Dialog onOpenChange={open => {
                setSelectedImagesTmp([]);
                setSelectedPreviewsTmp([]);
                setOverlayOpen(open)
            }}
            >
                <Tooltip>
                    <DialogTrigger asChild>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                className="inline-flex cursor-pointer justify-center rounded-lg p-2 text-slate-500 dark:text-slate-400 dark:hover:text-slate-50"
                            >
                                <ImagePlusIcon className='w-5 h-5' />
                                <span className="sr-only">Attach images</span>
                            </Button>
                        </TooltipTrigger>
                    </DialogTrigger>
                    <TooltipContent>
                        <p className='text-sm'>Attach images</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent className="sm:max-w-[60vw] w-full h-[60vh] max-h-[60vh] justify-center items-center flex flex-col p-0">
                    <UploadDialog
                        selectedBlobs={selectedImagesTmp}
                        setSelectedBlobs={setSelectedImagesTmp}
                        imagePreviews={selectedPreviewsTmp}
                        setImagePreviews={setSelectedPreviewsTmp}
                    />
                    <DialogFooter className="flex w-full justify-end pr-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className='inline-flex cursor-pointer justify-center rounded-lg p-2 text-slate-500 dark:text-slate-400 dark:hover:text-slate-50'
                                onClick={() => {
                                    setSelectedImages([...selectedImagesTmp])
                                    setSelectedPreviews([...selectedPreviewsTmp])
                                }}>
                                Save Changes
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </TooltipProvider>
    );
}
