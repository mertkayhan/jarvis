'use client'

import { Dispatch, SetStateAction } from "react";
import { Checkbox } from "../ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { getAvailableTools } from "./personality-actions";


interface ToolsProps {
    toolSelection: string[]
    setToolSelection: Dispatch<SetStateAction<string[]>>
    userId: string
}

export function Tools({ toolSelection, setToolSelection, userId }: ToolsProps) {
    const { data } = useQuery(
        {
            queryKey: ["availableTools", userId],
            queryFn: () => getAvailableTools(userId),
            enabled: !!userId,
        }
    )
    return (
        <div className="flex space-x-2">
            {data?.tools.map((tool: string) => {
                return (
                    <>
                        <Checkbox
                            id={tool}
                            className="data-[state=checked]:bg-indigo-500 data-[state=checked]:text-indigo-500"
                            onClick={() => {
                                if (!toolSelection.includes(tool)) {
                                    setToolSelection((old) => {
                                        return [tool, ...old];
                                    })
                                } else {
                                    setToolSelection((old) => old.filter((o) => o !== tool));
                                }
                            }}
                        />
                        <label
                            htmlFor="default-prompt"
                            className="text-sm font-medium leading-none hover:cursor-pointer"
                        >
                            {tool}
                        </label>
                    </>
                )
            })}
        </div>
    );
}