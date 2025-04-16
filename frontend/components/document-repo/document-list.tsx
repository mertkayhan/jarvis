'use client'

import { UserDocument } from "@/lib/types";
import { TooltipProvider } from "../ui/tooltip";
import { DeleteButton, DownloadButton } from "./buttons";

interface DocumentListProps {
    documents: UserDocument[] | undefined | null
    userId: string
}

export function DocumentList({ documents, userId }: DocumentListProps) {
    return (
        <TooltipProvider>
            <div className="border rounded-md h-[60vh] overflow-auto  pt-2">
                {documents && documents.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {documents.map((doc) => (
                            <div className="flex w-full flex-col dark:hover:bg-gray-800 hover:bg-gray-100 space-y-1" key={doc.id}>
                                <li
                                    className="flex justify-between items-center px-4"
                                >
                                    <div>
                                        <p
                                            className="text-xs font-medium pt-1"
                                        >
                                            {doc.name}
                                        </p>
                                        <span className="text-xs dark:text-slate-500 text-slate-400">
                                            {`Date: ${doc.createdAt.toDateString()} | Pages: ${doc.pageCount} | Tokens: ${doc.tokenCount}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-center pt-1">
                                        <DownloadButton href={doc.href} />
                                        <DeleteButton id={doc.id} userId={userId} />
                                    </div>
                                </li>
                            </div>
                        ))}
                    </ul>

                ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No documents available. Upload a new one!
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}