'use client'

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { IconClose } from "../ui/icons";
import { Button } from "../ui/button";

interface SearchbarProps {
    dispatch: Dispatch<SetStateAction<string | null>>
}

export function Searchbar({ dispatch }: SearchbarProps) {
    const [currentValue, setCurrentValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!currentValue.trim()) {
                    dispatch(null);
                    return;
                }
                dispatch(currentValue);
            }}
        >
            <div className="relative flex flex-1 bg-background rounded-lg p-4 shadow-md">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    value={currentValue}
                    placeholder="Search questions..."
                    className="pl-10 text-sm bg-muted/10 text-foreground border border-muted/20 focus:ring-2 focus:ring-accent focus-visible:ring-accent transition-all rounded-md h-10"
                />
                {currentValue.trim().length > 0 &&
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="hover:bg-transparent hover:text-red-500"
                        onClick={() => {
                            setCurrentValue("");
                            dispatch(null);
                            if (inputRef.current) {
                                inputRef.current.focus();
                            }
                        }}
                    >
                        <IconClose className="justify-end flex w-full" />
                    </Button>
                }
            </div>
        </form>
    );
}