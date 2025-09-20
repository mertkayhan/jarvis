"use client";

import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { IconSpinner } from "../ui/icons";
import { DocumentPack, FormState } from "@/lib/types";


interface DocumentPackSheetProps {
    children: ReactNode;
    title: string;
    action: (prevState: any, formData: FormData) => Promise<FormState>;
    current?: DocumentPack;
}

export function DocumentPackSheet({ children, title, action, current }: DocumentPackSheetProps) {
    const [state, formAction, pending] = useActionState(action, {} as FormState);
    const formRef = useRef<HTMLFormElement>(null);
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!pending && state.success) {
            setTimeout(() => setOpen(false), 10);
        }
    }, [state, pending]);

    return (
        <Sheet open={open} onOpenChange={open => setOpen(open)}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side={isMobile ? "bottom" : "right"} className="sm:w-2/3 sm:max-w-none">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>
                <form
                    className="p-8 space-y-2 overflow-auto h-full"
                    action={formAction}
                    ref={formRef}
                >
                    <Label htmlFor="pack-name">Name</Label>
                    <Input required name="pack-name" id="pack-name" defaultValue={current?.name} />
                    <Label htmlFor="pack-description">Description</Label>
                    <textarea
                        defaultValue={current?.description}
                        name="pack-description"
                        id="pack-description"
                        className={
                            cn("file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                                "dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs",
                                "transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm",
                                "file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                                "h-[200px] lg:h-[500px]"
                            )}
                        required
                    />
                    <SheetFooter>
                        <Button
                            type="submit"
                            disabled={pending}
                        >
                            {pending && <IconSpinner />}
                            Save
                        </Button>
                        <SheetClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </SheetClose>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet >
    );
}