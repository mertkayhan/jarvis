"use client";

import { Button } from "../ui/button";
import { FolderPlus } from "lucide-react";
import { DocumentPackSheet } from "./document-pack-sheet";
import { createDocumentPack } from "@/lib/actions/document-pack";

interface NewDocumentPackProps {
    userId: string;
}

export function NewDocumentPack({ userId }: NewDocumentPackProps) {
    const createDocumentPackHandler = createDocumentPack.bind(null, userId);

    return (
        <DocumentPackSheet title="New Document Pack" action={createDocumentPackHandler} >
            <Button>
                <span className="hidden lg:block">Create Document Pack</span>
                <FolderPlus className="lg:hidden block" />
            </Button>
        </DocumentPackSheet>
    );
}

