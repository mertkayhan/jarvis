'use server'

import { UserChat } from "@/lib/types";
import { callBackend } from "@/lib/utils";

export async function autogenChatTitle(userId: string, chatId: string) {
    console.log("autogen title", userId, chatId);
    const data = await callBackend(
        {
            endpoint: `/api/v1/users/${userId}/chats/${chatId}/title/autogen`,
            method: "PATCH",
        }
    );
    return data as {title: string};
}

export interface ListChatsResp {
    chats: UserChat[]
}

export async function listChats(userId: string) {
    console.log("listing chats", userId);
    const data = await callBackend(
        {
            endpoint: `/api/v1/users/${userId}/chats`,
            method: "GET",
        }
    );
    return {
        chats: data?.chats.map((c: Record<string, any>) => {
            return {
                id: c.id, 
                userId: c["owner_email"],
                title: c.title, 
                createdAt: c["created_at"],
                updatedAt: c["updated_at"],
            } as UserChat;
        })
    } as ListChatsResp;
}

export async function deleteChats(userId: string) {
    console.log("delete chats", userId);
    await callBackend(
        {
            endpoint: `/api/v1/users/${userId}/chats`,
            method: "DELETE",
        }
    );
}


interface UpdateChatTitleResp {
    id: string
    newTitle: string
}

export async function updateChatTitle(chatId: string, userId: string, newTitle: string) {
    console.log("update chat title", userId, chatId, newTitle)
    const data = await callBackend(
        {
            endpoint: `/api/v1/users/${userId}/chats/${chatId}/title`,
            method: "PATCH",
            body: { "new_title": newTitle },
        }
    );
    return { id: data["chat_id"], newTitle: data.title } as UpdateChatTitleResp;
}

interface DeleteChatResp {
    id: string
}

export async function deleteChat(chatId: string, userId: string) {
    console.log("delete chat", chatId, userId);
    const data = await callBackend(
        {
            endpoint: `/api/v1/users/${userId}/chats/${chatId}`,
            method: "DELETE",
        }
    );
    return data as DeleteChatResp;
}