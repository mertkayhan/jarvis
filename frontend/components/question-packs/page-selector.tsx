'use client'

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { ArrowLeftIcon, ArrowLeftToLine, ArrowRightIcon, ArrowRightToLine } from "lucide-react";

interface PageSelectorProps {
    page: number
    packId: string
    maxPageCount: number
}

export function PageSelector({ page, packId, maxPageCount }: PageSelectorProps) {
    const router = useRouter();

    return (
        <div className="flex w-full h-10 justify-end items-end border-t px-4">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            disabled={page <= 1}
                            onClick={() => {
                                router.replace(`?pack_id=${packId}&page=1`)
                            }}
                        >
                            <ArrowLeftToLine />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        First page
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            disabled={page <= 1}
                            onClick={() => {
                                router.replace(`?pack_id=${packId}&page=${page - 1}`)
                            }}
                        >
                            <ArrowLeftIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Previous page
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            disabled={page === maxPageCount}
                            onClick={() => {
                                router.replace(`?pack_id=${packId}&page=${page + 1}`)
                            }}
                        >
                            <ArrowRightIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Next page
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            disabled={page === maxPageCount}
                            onClick={() => {
                                router.replace(`?pack_id=${packId}&page=${maxPageCount}`)
                            }}
                        >
                            <ArrowRightToLine />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Last page
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}