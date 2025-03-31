'use client'

import { Dispatch, SetStateAction } from "react";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface DetectHallucinationProps {
    detectHallucination: boolean
    setDetectHallucination: Dispatch<SetStateAction<boolean>>
}

export function DetectHallucination({ detectHallucination, setDetectHallucination }: DetectHallucinationProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className='hidden md:flex gap-2'>
                        <Switch
                            className='data-[state=checked]:bg-indigo-900'
                            checked={detectHallucination}
                            onCheckedChange={() => { setDetectHallucination(!detectHallucination) }}
                        />
                        <span className='text-sm text-slate-500 dark:text-slate-400'>Detect hallucinations</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side='top' className='text-sm mb-4 w-40 bg-background p-2 rounded-lg'>
                    We use a special algorithm that can cross reference provided documents to the generated responses. Beware, this calculation takes a while!
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}