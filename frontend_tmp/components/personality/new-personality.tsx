"use client";

import { Button } from "../ui/button";
import { createPersonality } from "@/lib/actions/personality";
import { PersonalitySheet } from "./personality-sheet";
import { UserPlus2 } from "lucide-react";

interface NewPersonalityProps {
    userId: string;
    tools: { tools: string[]; };
}

export function NewPersonality({ userId, tools }: NewPersonalityProps) {
    const createPersonalityHandler = createPersonality.bind(null, userId, tools.tools);

    return (
        <PersonalitySheet title="New Personality" action={createPersonalityHandler} tools={tools} >
            <Button>
                <span className="hidden lg:block">Create Personality</span>
                <UserPlus2 className="lg:hidden block" />
            </Button>
        </PersonalitySheet>
    );
}

