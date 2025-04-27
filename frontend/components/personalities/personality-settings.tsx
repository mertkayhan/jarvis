'use client'

import { Dispatch, SetStateAction } from "react";
import { Checkbox } from "../ui/checkbox";

interface PersonalitySettingProps {
    setGloballyAvailable: Dispatch<SetStateAction<boolean>>
    setIsDefault: Dispatch<SetStateAction<boolean>>
    isGlobal?: boolean
    isDefault?: boolean
}

export function PersonalitySettings({ setGloballyAvailable, setIsDefault, isGlobal = false, isDefault = false }: PersonalitySettingProps) {
    return (
        <div className="flex items-center space-x-2 pb-2">
            <Checkbox
                id="system-prompt"
                className="data-[state=checked]:bg-slate-500 data-[state=checked]:text-slate-500 dark:data-[state=checked]:bg-slate-400 dark:data-[state=checked]:text-slate-400"
                checked={isGlobal}
                onClick={() => {
                    setGloballyAvailable((old) => !old);
                }}
            />
            <label
                htmlFor="system-prompt"
                className="text-sm font-medium leading-none hover:cursor-pointer"
            >
                Globally available
            </label>
            <Checkbox
                id="system-prompt"
                className="data-[state=checked]:bg-slate-500 data-[state=checked]:text-slate-500 dark:data-[state=checked]:bg-slate-400 dark:data-[state=checked]:text-slate-400"
                onClick={() => {
                    setIsDefault((old) => !old);
                }}
                checked={isDefault}
            />
            <label
                htmlFor="default-prompt"
                className="text-sm font-medium leading-none hover:cursor-pointer"
            >
                Set as default
            </label>
        </div>
    );
}