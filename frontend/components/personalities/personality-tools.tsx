'use client'

import { Dispatch, SetStateAction } from "react";
import { tools } from "@/lib/tools";
import { Checkbox } from "../ui/checkbox";


interface ToolsProps {
    toolSelection: string[]
    setToolSelection: Dispatch<SetStateAction<string[]>>
}

export function Tools({ toolSelection, setToolSelection }: ToolsProps) {
    return (
        <div className="flex space-x-2">
            {tools.map((tool) => {
                return (
                    <>
                        <Checkbox
                            id={tool.label}
                            className="data-[state=checked]:bg-indigo-500 data-[state=checked]:text-indigo-500"
                            onClick={() => {
                                if (!toolSelection.includes(tool.name)) {
                                    setToolSelection((old) => {
                                        return [tool.name, ...old];
                                    })
                                } else {
                                    setToolSelection((old) => old.filter((o) => o !== tool.name));
                                }
                            }}
                        />
                        <label
                            htmlFor="default-prompt"
                            className="text-sm font-medium leading-none hover:cursor-pointer"
                        >
                            {tool.name}
                        </label>
                    </>
                )
            })}
        </div>
    );
}