'use client'

import { Dispatch, SetStateAction } from "react";
import { Switch } from "../ui/switch";

interface AutoScrollProps {
    autoScroll: boolean
    setAutoScroll: Dispatch<SetStateAction<boolean>>
}

export function AutoScroll({ autoScroll, setAutoScroll }: AutoScrollProps) {
    return (
        <div className='hidden md:flex gap-2'>
            <Switch
                className='data-[state=checked]:bg-indigo-900'
                checked={autoScroll}
                onCheckedChange={() => { setAutoScroll(!autoScroll) }}
            />
            <span className='text-sm text-slate-500 dark:text-slate-400'>Auto-scroll</span>
        </div>
    );
}