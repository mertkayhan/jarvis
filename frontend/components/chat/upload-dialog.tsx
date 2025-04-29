'use client'

import { ChangeEvent, Dispatch, ReactNode, RefObject, SetStateAction } from "react";

interface UploadDialogProps {
    setSelectedImages: Dispatch<SetStateAction<File[]>>
    setSelectedPreviews: Dispatch<SetStateAction<string[]>>
    ref: RefObject<HTMLInputElement>
    children: ReactNode
}

export function UploadDialog({ setSelectedImages, setSelectedPreviews, ref, children }: UploadDialogProps) {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) {
            return
        }
        const files = Array.from(event.target.files);
        const validFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/png');

        if (validFiles.length) {
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setSelectedPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
            setSelectedImages(prevImages => [...prevImages, ...validFiles])
        } else {
            console.error('Only JPG or PNG files are allowed.');
        }
        if (ref.current) {
            ref.current.value = "";
        }
    };

    return (
        <>
            <input
                ref={ref}
                id="file-input"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/jpeg, image/png"
                multiple
            />
            {children}
        </>
    );
}