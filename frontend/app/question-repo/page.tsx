"use client"

import { Sidebar } from "@/components/sidebar/chat-sidebar"
import { useEffect } from "react"
import { Questions } from "@/components/question-packs/questions"
import { redirect, useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/lib/hooks/use-toast"
import { useUser } from '@auth0/nextjs-auth0';
import Loading from "@/app/loading"

export default function Page() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const router = useRouter();
    const { user, error, isLoading } = useUser();

    useEffect(() => {
        const pageNo = searchParams?.get("page");
        const packId = searchParams?.get("pack_id");
        console.log("page no", pageNo)
        if (pageNo && Number(pageNo) > 0) {
            router.replace(`?pack_id=${packId}&page=${pageNo}`)
        } else if (pageNo && Number(pageNo) <= 0) {
            toast({
                title: "Page error",
                description: "Page number should be larger than zero!",
                variant: "destructive"
            });
        } else if (!pageNo) {
            router.replace(`?pack_id=${packId}&page=1`)
        }
    }, [searchParams]);

    if (isLoading || !searchParams?.get("pack_id") || !searchParams?.get("page")) {
        return (
            <Loading />
        )
    }

    return (
        <div className="flex h-full w-full">
            <div className="relative left-0 z-0 flex h-full">
                <div
                    className='flex h-full flex-col border-slate-300 bg-background dark:border-slate-700 transition-all duration-300'
                >
                    <Sidebar
                        highlight={false}
                        showChatList={false}
                        moduleName="jarvis"
                        userId={user?.email as string}
                        showDocumentRepo={false}
                        showModelSelection={false}
                        showPersonalities={false}
                    />
                </div>
            </div>
            <div className="flex h-full w-full">
                <Questions
                    page={Number(searchParams?.get("page"))}
                    packId={searchParams?.get("pack_id") as string}
                    userId={user?.email as string}
                />
            </div>
        </div>
    )
}