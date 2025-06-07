'use client';

import { DocumentPack, QuestionPack } from "@/lib/types";
import { Button } from "../ui/button";
import { IconClose } from "../ui/icons";
import { Dispatch, SetStateAction } from "react";

interface KnowledgeBannerProps {
    selectedDocumentPack: DocumentPack | null;
    setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>;
    selectedQuestionPack: QuestionPack | null;
    setSelectedQuestionPack: Dispatch<SetStateAction<QuestionPack | null>>;
    selectedDocuments: string[];
    setSelectedDocuments: Dispatch<SetStateAction<string[]>>;
}

export default function KnowledgeBanner({
    selectedDocumentPack,
    selectedQuestionPack,
    selectedDocuments,
    setSelectedDocumentPack,
    setSelectedDocuments,
    setSelectedQuestionPack,
}: KnowledgeBannerProps) {
    return (
        <>
            {selectedDocumentPack && (
                <span className="ml-2 text-xs px-3 py-1 rounded-md bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-lg transition-all duration-300 ease-in-out">
                    <div className="flex w-44 items-center h-4 justify-center">
                        Document pack attached
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setSelectedDocumentPack(null)}
                            className="hover:bg-transparent hover:text-red-500 w-3 items-center justify-center ml-2"
                        >
                            <IconClose className="h-3 w-3" />
                        </Button>
                    </div>
                </span>
            )}
            {selectedQuestionPack && (
                <span className="ml-2 text-xs px-3 py-1 rounded-md bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-lg transition-all duration-300 ease-in-out">
                    <div className="flex w-40 items-center h-4 justify-center">
                        Question pack attached
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setSelectedQuestionPack(null)}
                            className="hover:bg-transparent hover:text-red-500 w-3 items-center justify-center ml-2"
                        >
                            <IconClose className="h-3 w-3" />
                        </Button>
                    </div>
                </span>
            )}
            {selectedDocuments.length > 0 && (
                <span className="ml-2 text-xs px-3 py-1 rounded-md bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-lg transition-all duration-300 ease-in-out">
                    <div className="flex w-40 items-center h-4 justify-center">
                        {selectedDocuments.length} document(s) attached
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setSelectedDocuments([])}
                            className="hover:bg-transparent hover:text-red-500 w-3 items-center justify-center ml-2"
                        >
                            <IconClose className="h-3 w-3" />
                        </Button>
                    </div>
                </span>
            )}
        </>
    );
}