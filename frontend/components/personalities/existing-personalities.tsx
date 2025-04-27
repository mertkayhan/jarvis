'use client'

import {
    Accordion,
} from "@/components/ui/accordion"
import { PersonalityView } from "@/components/personalities/personality-view"
import { Personality } from "@/lib/types"

interface ExistingPersonalitiesProps {
    personalities: Personality[] | null | undefined
    userId: string
}

export function ExistingPersonalities({ personalities, userId }: ExistingPersonalitiesProps) {
    if (!personalities || !personalities.length) {
        return (
            <div className="w-full h-full flex flex-1 flex-col items-center justify-center ">
                <span className="text-sm dark:text-slate-400 text-slate-500 p-4">
                    No personalities found, please create one in the next tab.
                </span>
            </div>

        )
    }
    return (
        <div className="flex flex-col w-full h-full overflow-y-auto max-h-[600px]">
            <span className="dark:text-slate-500 text-slate-400 justify-start items-start w-full mb-10 mt-10 px-2 text-sm">
                Personalities allow you to create customized AI assistants that can understand instructions, access specific knowledge, and perform tailored tasks to enhance productivity and decision-making. You can get an overview of existing personalities and manage them here.
            </span>
            <div className="flex flex-col w-full">
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {personalities.map((personality, i) => {
                        return (
                            <PersonalityView personality={personality} key={i} userId={userId} />
                        )
                    })}
                </Accordion>
            </div>
        </div>
    )
}
