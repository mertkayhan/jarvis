'use client'

import { DragEvent, useState, ChangeEvent, Dispatch, SetStateAction, useRef } from 'react';

interface UploadDialogProps {
    selectedBlobs: File[];
    setSelectedBlobs: Dispatch<SetStateAction<File[]>>;
    imagePreviews: string[]
    setImagePreviews: Dispatch<SetStateAction<string[]>>;
}

export function UploadDialog({ selectedBlobs, setSelectedBlobs, imagePreviews, setImagePreviews }: UploadDialogProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragActive(false);

        if (!event.dataTransfer) {
            return
        }

        const files = Array.from(event.dataTransfer.files);
        const validFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/png');

        if (validFiles.length) {
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
            setSelectedBlobs(prevImages => [...prevImages, ...validFiles])
        } else {
            console.error('Only JPG or PNG files are allowed.');
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) {
            return
        }
        const files = Array.from(event.target.files);
        const validFiles = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/png');

        if (validFiles.length) {
            const newPreviews = validFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
            setSelectedBlobs(prevImages => [...prevImages, ...validFiles])
        } else {
            console.error('Only JPG or PNG files are allowed.');
        }
    };

    const handleDeleteImage = (index: number) => {
        setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
        setSelectedBlobs(prevImages => prevImages.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <section className="w-[80%] h-[80%] max-w-full max-h-full rounded-3xl shadow-xl dark:shadow-none flex flex-col items-center justify-center">
            <div className='w-full items-start justify-start'>
                {/* Title */}
                <h2 className="text-xl font-bold text-left text-slate-800 dark:text-slate-200 mb-2">
                    Upload Dialog
                </h2>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Upload your images below and click save once done.
                </p>
            </div>
            <label
                htmlFor="file-input"
                className={`flex w-full h-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed ${isDragActive ? 'bg-slate-200 dark:bg-slate-700' : 'bg-background'
                    } border-slate-300 text-slate-500 hover:bg-slate-200 dark:border-slate-300/20 dark:text-slate-400 dark:hover:bg-slate-800`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 p-4">
                        {imagePreviews.map((src, index) => (
                            <div
                                key={index}
                                className="relative group w-24 h-24 cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteImage(index)
                                }}
                            >
                                {/* Image */}
                                <img src={src} alt="Preview" className="w-full h-full object-cover rounded-lg transition duration-300 ease-in-out group-hover:brightness-50" />

                                {/* Overlay with delete icon */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mb-3 h-10 w-10"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path
                                d="M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1"
                            ></path>
                            <path d="M9 15l3 -3l3 3"></path>
                            <path d="M12 12l0 9"></path>
                        </svg>
                        <p className="mb-2 text-sm">
                            <span className="font-semibold text-blue-600">Click to browse</span> or drag
                            & drop
                        </p>
                        <p className="text-xs">JPG or PNG only. Max size: 1 MB</p>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/jpeg, image/png"
                    multiple
                />
            </label>
        </section>
    );
}
