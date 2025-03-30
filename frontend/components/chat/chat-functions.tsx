'use client'

import { Message } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { removeMessage } from "./chat-actions";
import { uuidv4 } from "@/lib/utils";

export const appendFn = (
    id: string,
    isLoading: Record<string, boolean>,
    setMessages: Dispatch<SetStateAction<Message[]>>,
    dispatch: Dispatch<any>,
    socket: Socket | null,
    setCurrentContext: Dispatch<SetStateAction<string | null | undefined>>
) => {
    return (msg: Message) => {
        if (isLoading[id] || !socket) {
            return
        }
        setMessages((currentMessages) => {
            return [...(currentMessages || []).concat(msg as Message)]
        });
        dispatch({ type: "UPDATE_CHAT_STATUS", status: true, id: id });
        setCurrentContext(null);
        socket.emit("chat_message", msg);
    }
}

export const cancelFn = (
    socket: Socket | null,
    dispatch: Dispatch<any>,
    id: string | null | undefined
) => {
    return () => {
        // const id = messagesRef.current[messagesRef.current.length - 1].id
        if (!socket) {
            return
        }
        socket.emit("abort", id)
        dispatch({ type: "UPDATE_CHAT_STATUS", status: false, id: id });
    }
}

export const reloadFn = (
    id: string,
    socket: Socket | null,
    dispatch: Dispatch<any>,
    messages: Message[] | null,
    setMessages: Dispatch<SetStateAction<Message[]>>
) => {
    return () => {
        if (!socket) {
            return
        }
        dispatch({ type: "UPDATE_CHAT_STATUS", status: true, id: id });
        // console.log("reload");
        let lastUserMsg = null;
        let lastUserMsgIndex = -1;
        if (!messages) {
            return;
        }
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].role === "user") {
                lastUserMsg = messages[i];
                lastUserMsgIndex = i;
            }
        }
        if (!lastUserMsg || lastUserMsgIndex === -1) {
            dispatch({ type: "UPDATE_CHAT_STATUS", status: false, id: id });
            return;
        }
        // console.log("last user msg", lastUserMsg);
        if (lastUserMsgIndex !== messages.length - 1) {
            // console.log("to delete", messages[lastUserMsgIndex + 1])
            const diff = messages.length - lastUserMsgIndex;
            for (let i = 1; i < diff; i++) {
                removeMessage(messages[lastUserMsgIndex + i].id).then(resp => {
                    if (resp.error) {
                        console.error(resp.error)
                    }
                })
            }
            setMessages(prevMessages => prevMessages.slice(0, -(diff - 1)));
        }
        socket.emit("chat_message", lastUserMsg);
    }
}

export const generateFollowUpFn = (
    socket: Socket | null,
    appendImpl: (msg: Message) => void,
    id: string | null | undefined,
    userId: string
) => {
    return () => {
        if (!socket) {
            return
        }
        appendImpl({
            id: uuidv4(),
            content: "Generate 3 follow-up questions using the conversation history",
            role: 'user',
            data: JSON.stringify({ "chat_id": id, "user_id": userId, "images": [] })
        } as Message)
    }
}