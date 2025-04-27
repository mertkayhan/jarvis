'use client'

import { File, FolderSearch2, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dispatch, ReactNode, SetStateAction } from "react";

interface KnowledgeDropdownProps {
    setKind: Dispatch<SetStateAction<string>>
    setOpen: Dispatch<SetStateAction<boolean>>
    triggerButton: ReactNode
}

export function KnowledgeDropdown({ setKind, setOpen, triggerButton }: KnowledgeDropdownProps) {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                {triggerButton}
            </DropdownMenuTrigger>
            <DropdownMenuContent side='top'>
                <DropdownMenuItem onSelect={() => {
                    setKind("Documents");
                    setOpen(true);
                }}>
                    <File /> Attach Documents
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <HelpCircle /> Attach Question Pack
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <FolderSearch2 /> Attach Document Pack
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}