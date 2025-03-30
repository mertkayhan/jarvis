'use client'

import { Button } from "../ui/button"

interface SubmitButtonProps {
    isLoading: boolean
    input: string
    stop: () => void
}


export function SubmitButton({ isLoading, input, stop }: SubmitButtonProps) {
    return isLoading && (
        <Button
            onClick={() => { stop() }}
            type="button"
            variant="outline"
            className="mr-1 inline-flex items-center gap-x-2 rounded-full px-4 py-2.5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 dark:hover:text-slate-50 focus:ring-1 focus:ring-slate-400 sm:text-base"
        >
            <span className="sr-only">Stop generation</span>
            <div className="relative flex items-center justify-center">
                {/* Spinner */}
                <svg
                    className="animate-spin h-6 w-6 text-slate-500 dark:text-slate-400 absolute"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                </svg>
                {/* Stop Icon */}
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
            </div>
        </Button>
    ) || (
            <Button
                disabled={input.trim().length === 0}
                variant="outline"
                type="submit"
                className="mr-1 inline-flex items-center gap-x-2 rounded-full px-4 py-2.5 text-center text-sm font-medium text-slate-500 dark:text-slate-400 dark:hover:text-slate-50 focus:ring-4 focus:ring-slate-400 sm:text-base"
            >
                <span className="sr-only">Submit</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M10 14l11 -11"></path>
                    <path
                        d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"
                    ></path>
                </svg>
            </Button>
        )
}
