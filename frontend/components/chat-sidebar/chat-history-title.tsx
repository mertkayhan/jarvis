'use client'

import { UserChat } from "@/lib/types"

interface ListTitleProps {
    chats: UserChat[] | undefined
}

export function ListTitle({ chats }: ListTitleProps) {
    return (
        <>
            <h2
                className="inline px-5 text-sm md:text-lg font-medium text-slate-800 dark:text-slate-200"
            >
                Chats
            </h2>
            <span className="hidden md:block rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 px-2 py-1 text-xs dark:text-slate-200 text-slate-800">
                {chats?.length || 0}
            </span>
        </>
    )
}