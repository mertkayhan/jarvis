"use server";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

interface OverviewProps {
    extensionName: string;
    extensionDescription: string;
    children: ReactNode;
    newObjectButton: ReactNode;
}

export async function Overview({ extensionName, extensionDescription, newObjectButton, children }: OverviewProps) {
    return (
        <div className="w-full flex-col p-8">
            <Card>
                <CardHeader>
                    <div className="flex space-x-2">
                        <div className="space-y-2">
                            <CardTitle>
                                {extensionName}
                            </CardTitle>
                            <CardDescription>
                                {extensionDescription}
                            </CardDescription>
                        </div>
                        {newObjectButton}
                    </div>
                </CardHeader>
                <CardContent>
                    {children}
                </CardContent>
            </Card>
        </div>
    );
}