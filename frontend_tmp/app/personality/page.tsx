"use server";

import { AppShell } from "@/components/app-shell";
import { Overview } from "@/components/common/extension-overview";
import { NewPersonality } from "@/components/personality/new-personality";
import { PersonalityCard } from "@/components/personality/personality-card";
import { auth0 } from "@/lib/auth0";
import { callBackend } from "@/lib/common";
import { Personality } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function Page() {
    const session = await auth0.getSession();

    if (!session || !session.user.email) {
        redirect("/auth/login");
    }

    const userData = await callBackend(
        {
            endpoint: `/api/v1/user/data`,
            method: "GET",
            userId: session.user.email,
        }
    );

    return (
        <AppShell>
            <Overview
                extensionName="Personalities"
                extensionDescription="Personalities allow you to create customized AI assistants that can
                                    understand instructions, access specific knowledge, and perform
                                    tailored tasks to enhance productivity and decision-making. You can
                                    get an overview of existing personalities and manage them here."
                newObjectButton={<NewPersonality userId={session.user.email} tools={userData.available_tools} />}>
                <div className="flex flex-1 flex-col gap-4 overflow-auto">
                    {userData.available_personalities?.map((personality: Personality) => {
                        return (
                            <PersonalityCard
                                key={personality.id}
                                personality={personality}
                                userId={session.user.email!}
                                tools={userData.available_tools}
                            />
                        );
                    })}
                </div>
            </Overview>
        </AppShell >
    );
}






