'use client'

import { Dispatch, SetStateAction } from "react";
import { Checkbox } from "../ui/checkbox";

interface PersonalitySettingProps {
    setGloballyAvailable: Dispatch<SetStateAction<boolean>>
    setIsDefault: Dispatch<SetStateAction<boolean>>
}

export function PersonalitySettings({ setGloballyAvailable, setIsDefault }: PersonalitySettingProps) {
    return (
        <div className="flex items-center space-x-2 pb-2">
            <Checkbox
                id="system-prompt"
                className="data-[state=checked]:bg-indigo-500 data-[state=checked]:text-indigo-500"
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
                className="data-[state=checked]:bg-indigo-500 data-[state=checked]:text-indigo-500"
                onClick={() => {
                    setIsDefault((old) => !old);
                }}
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