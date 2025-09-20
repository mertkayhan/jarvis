"use client";

import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { IconSpinner } from "../ui/icons";
import { FormState, Personality } from "@/lib/types";


interface PersonalitySheetProps {
    children: ReactNode;
    title: string;
    action: (prevState: any, formData: FormData) => Promise<FormState>;
    tools: { tools: string[]; };
    current?: Personality;
}

export function PersonalitySheet({ children, title, action, tools, current }: PersonalitySheetProps) {
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
                    <Label htmlFor="personality-name">Name</Label>
                    <Input required name="personality-name" id="personality-name" defaultValue={current?.name} />
                    <Label htmlFor="personality-description">Description</Label>
                    <Input required name="personality-description" id="personality-description" defaultValue={current?.description} />
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="personality-tools">Tools</Label>
                        <div className="flex space-x-2">
                            {tools.tools?.map((tool: string) => {
                                return (
                                    <div key={tool} className="flex space-x-2">
                                        <Checkbox
                                            id={tool}
                                            name={tool}
                                            defaultChecked={current?.tools?.includes(tool)}
                                        />
                                        <Label htmlFor={tool}>{tool}</Label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Label htmlFor="personality-instructions">Instructions</Label>
                    <textarea
                        defaultValue={current?.instructions}
                        name="personality-instructions"
                        id="personality-instructions"
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