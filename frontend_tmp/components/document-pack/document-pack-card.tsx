"use client";

import { DocumentPack } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode, useTransition } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { IconSpinner } from "../ui/icons";
import { deleteDocumentPack, updateDocumentPack } from "@/lib/actions/document-pack";
import { DocumentPackSheet } from "./document-pack-sheet";

interface DocumentPackCardProps {
    pack: DocumentPack;
    userId: string;
}

export function DocumentPackCard({ pack, userId }: DocumentPackCardProps) {

    const buttonStyle = "hover:bg-transparent dark:hover:bg-transparent";
    const editStyle = cn(buttonStyle, "hover:text-blue-500");
    const deleteStyle = cn(buttonStyle, "hover:text-red-500");

    return (
        <Card>
            <CardHeader>
                <div className="flex w-full justify-between">
                    <CardTitle>{pack.name}</CardTitle>
                    <div>
                        <EditDocumentPack pack={pack} userId={userId}>
                            <Button size="icon" variant="ghost" className={editStyle}>
                                <Pencil />
                            </Button>
                        </EditDocumentPack>
                        <DeleteDocumentPack pack={pack} userId={userId} >
                            <Button size="icon" variant="ghost" className={deleteStyle}>
                                <Trash2 />
                            </Button>
                        </DeleteDocumentPack>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <span className="text-accent-foreground text-sm">{pack.description}</span>
            </CardContent>
        </Card>
    );
}

interface EditDocumentPackProps {
    children: ReactNode;
    pack: DocumentPack;
    userId: string;
}

function EditDocumentPack({ children, userId, pack }: EditDocumentPackProps) {
    const updateDocumentPackHandler = updateDocumentPack.bind(null, userId, pack.id);

    return (
        <DocumentPackSheet
            title={`Edit ${pack.name}`}
            action={updateDocumentPackHandler}
            current={pack}
        >
            {children}
        </DocumentPackSheet>
    );
}

interface DeleteDocumentPackProps {
    children: ReactNode;
    pack: DocumentPack;
    userId: string;
}

function DeleteDocumentPack({ children, pack, userId }: DeleteDocumentPackProps) {
    const [pending, transitionStart] = useTransition();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle>{`Delete ${pack.name}`}</AlertDialogTitle>
                <AlertDialogDescription>Are your sure?</AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => {
                        transitionStart(() => {
                            deleteDocumentPack(userId, pack.id)
                                .catch((err) => console.error("document pack deletion failed:", err));
                        });
                    }}>
                        {pending && <IconSpinner />}
                        Delete
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}