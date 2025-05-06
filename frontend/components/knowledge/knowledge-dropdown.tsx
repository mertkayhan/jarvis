'use client'

import { File, FolderSearch2, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface KnowledgeDropdownProps {
    setKind: Dispatch<SetStateAction<string>>
    setOpen: Dispatch<SetStateAction<boolean>>
    triggerButton: ReactNode
    dropdownOpen?: boolean
    setDropdownOpen?: Dispatch<SetStateAction<boolean>>
    tooltipContent?: string
}

export function KnowledgeDropdown({ setKind, setOpen, triggerButton, dropdownOpen, setDropdownOpen, tooltipContent }: KnowledgeDropdownProps) {
    const [internalDropdownOpen, internalSetDropdownOpen] = useState(false);

    return (
        <DropdownMenu
            modal={false}
            open={(dropdownOpen) ? dropdownOpen : internalDropdownOpen}
            onOpenChange={(open) => (setDropdownOpen) ? setDropdownOpen(open) : internalSetDropdownOpen(open)}
        >
            <Tooltip>
                <DropdownMenuTrigger asChild>
                    <TooltipTrigger asChild>
                        {triggerButton}
                    </TooltipTrigger>
                </DropdownMenuTrigger>
                {tooltipContent && <TooltipContent>{tooltipContent}</TooltipContent>}
            </Tooltip>
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