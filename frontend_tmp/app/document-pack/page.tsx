"use server";

import { AppShell } from "@/components/app-shell";
import { Overview } from "@/components/common/extension-overview";
import { DocumentPackCard } from "@/components/document-pack/document-pack-card";
import { NewDocumentPack } from "@/components/document-pack/new-document-pack";
import { listDocumentPacks } from "@/lib/actions/document-pack";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Page() {
    const session = await auth0.getSession();

    if (!session || !session.user.email) {
        redirect("/auth/login");
    }

    const packs = await listDocumentPacks(session.user.email);

    return (<AppShell>
        <Overview
            extensionName="Document Packs"
            extensionDescription="Document Packs let you create intelligent knowledge bases from your files, enabling AI to understand, retrieve, and generate answers using your specific documents. Effortlessly manage, search, and interact with your document collections here."
            newObjectButton={<NewDocumentPack userId={session.user.email} />}
        >
            <div className="flex flex-1 flex-col gap-4 overflow-auto">
                {packs.packs?.map((pack) => {
                    return (
                        <DocumentPackCard
                            key={pack.id}
                            pack={pack}
                            userId={session.user.email!}
                        />
                    );
                })}
            </div>
        </Overview>
    </AppShell >);
}