'use client'

import { File, FolderSearch2, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";

interface KnowledgeDropdownProps {
    setKind: Dispatch<SetStateAction<string>>
    setOpen: Dispatch<SetStateAction<boolean>>
    triggerButton: ReactNode
    dropdownOpen?: boolean
    setDropdownOpen?: Dispatch<SetStateAction<boolean>>
}

export function KnowledgeDropdown({ setKind, setOpen, triggerButton, dropdownOpen, setDropdownOpen }: KnowledgeDropdownProps) {
    const [internalDropdownOpen, internalSetDropdownOpen] = useState(false);

    return (
        <DropdownMenu
            modal={false}
            open={(dropdownOpen) ? dropdownOpen : internalDropdownOpen}
            onOpenChange={(open) => (setDropdownOpen) ? setDropdownOpen(open) : internalSetDropdownOpen(open)}
        >
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
                <DropdownMenuItem onSelect={() => {
                    setKind("Question Pack");
                    setOpen(true);
                }}>
                    <HelpCircle /> Attach Question Pack
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {
                    setKind("Document Pack");
                    setOpen(true);
                }}>
                    <FolderSearch2 /> Attach Document Pack
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu >
    );
}