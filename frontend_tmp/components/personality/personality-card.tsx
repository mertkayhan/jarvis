"use client";

import { Personality } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode, useTransition } from "react";
import { PersonalitySheet } from "./personality-sheet";
import { deletePersonality, updatePersonality } from "@/lib/actions/personality";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { IconSpinner } from "../ui/icons";

interface PersonalityCardProps {
    personality: Personality;
    userId: string;
    tools: { tools: string[]; };
}

export function PersonalityCard({ personality, userId, tools }: PersonalityCardProps) {

    const buttonStyle = "hover:bg-transparent dark:hover:bg-transparent";
    const editStyle = cn(buttonStyle, "hover:text-blue-500");
    const deleteStyle = cn(buttonStyle, "hover:text-red-500");

    return (
        <Card>
            <CardHeader>
                <div className="flex w-full justify-between">
                    <CardTitle>{personality.name}</CardTitle>
                    <div>
                        <EditPersonality personality={personality} userId={userId} tools={tools}>
                            <Button size="icon" variant="ghost" className={editStyle}>
                                <Pencil />
                            </Button>
                        </EditPersonality>
                        <DeletePersonality personality={personality} userId={userId} >
                            <Button size="icon" variant="ghost" className={deleteStyle}>
                                <Trash2 />
                            </Button>
                        </DeletePersonality>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <span className="text-accent-foreground text-sm">{personality.description}</span>
            </CardContent>
            <CardFooter>
                <div className="flex space-x-2">
                    {personality.owner === "system" && <Badge>global</Badge>}
                    {personality.isDefault && <Badge>default</Badge>}
                </div>
            </CardFooter>
        </Card>
    );
}

interface EditPersonalityProps {
    children: ReactNode;
    personality: Personality;
    userId: string;
    tools: { tools: string[]; };
}

function EditPersonality({ children, userId, personality, tools }: EditPersonalityProps) {
    const updatePersonalityHandler = updatePersonality.bind(null, userId, tools.tools, personality.id);

    return (
        <PersonalitySheet
            title={`Edit ${personality.name}`}
            action={updatePersonalityHandler}
            tools={tools}
            current={personality}
        >
            {children}
        </PersonalitySheet>
    );
}

interface DeletePersonalityProps {
    children: ReactNode;
    personality: Personality;
    userId: string;
}

function DeletePersonality({ children, personality, userId }: DeletePersonalityProps) {
    const [pending, transitionStart] = useTransition();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogTitle>{`Delete ${personality.name}`}</AlertDialogTitle>
                <AlertDialogDescription>Are your sure?</AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => {
                        transitionStart(() => {
                            deletePersonality(userId, personality.id)
                                .catch((err) => console.error("personality deletion failed:", err));
                        });
                    }}>
                        {pending && <IconSpinner />}
                        Delete
                    </AlertDialogAction>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}