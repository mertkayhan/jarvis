'use client'

import Loading from "@/app/loading";
import ChatPage from "@/components/chat/chat-page";
import { chatIdReducer } from "@/components/chat/chat-reducers";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSocket } from "@/lib/hooks/use-socket";
import { uuidv4 } from "@/lib/utils";
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from "next/navigation";
import { Reducer, useReducer } from "react";

export default function Page() {
    const { user, error, isLoading } = useUser();
    const token = useAuthToken(user?.email);
    const socket = useSocket({ socketNamespace: "jarvis", userId: user?.email, token });
    const [id, dispatch] = useReducer<Reducer<string, any>>(chatIdReducer, uuidv4());
    const router = useRouter();

    if (isLoading) {
        return <Loading />;
    }

    if (error) {
        router.push("/forbidden");
    }

    return (
        <ChatPage
            path="chat"
            greeting="Hi I'm Jarvis, how can I help you?"
            moduleName="jarvis"
            title="J.A.R.V.I.S."
            socket={socket}
            id={id}
            dispatch={dispatch}
        />
    )
}