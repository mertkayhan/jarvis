'use server'

import { UserChat } from "@/lib/types";
import { callBackend } from "@/lib/utils";

export async function autogenChatTitle(userId: string, chatId: string) {
    const data = await callBackend(
        {
            endpoint: `/api/v1/chats/${chatId}/title/autogen`,
            method: "PATCH",
            userId,
        }
    );
    return data as { title: string };
}

export interface ListChatsResp {
    chats: UserChat[]
}

export async function listChats(userId: string) {
    const data = await callBackend(
        {
            endpoint: `/api/v1/chats/`,
            method: "GET",
            userId,
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
    await callBackend(
        {
            endpoint: `/api/v1/chats/`,
            method: "DELETE",
            userId,
        }
    );
}


interface UpdateChatTitleResp {
    id: string
    newTitle: string
}

export async function updateChatTitle(chatId: string, userId: string, newTitle: string) {
    const data = await callBackend(
        {
            endpoint: `/api/v1/chats/${chatId}/title`,
            method: "PATCH",
            body: { "new_title": newTitle },
            userId,
        }
    );
    return { id: data["chat_id"], newTitle: data.title } as UpdateChatTitleResp;
}

interface DeleteChatResp {
    id: string
}

export async function deleteChat(chatId: string, userId: string) {
    const data = await callBackend(
        {
            endpoint: `/api/v1//chats/${chatId}`,
            method: "DELETE",
            userId,
        }
    );
    return data as DeleteChatResp;
}