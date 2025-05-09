'use server'

import { UserChat } from "@/lib/types";
import { getToken } from "../chat/chat-actions";

export async function autogenChatTitle(userId: string, chatId: string) {
    console.log("autogen title", userId, chatId);
    const backendUrl = process.env.BACKEND_URL;
        const token = await getToken();
        const resp = await fetch(
            `${backendUrl}/api/v1/users/${userId}/chats/${chatId}/title/autogen`,
            {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            }
        );
        const data = await resp.json();
        if (!resp.ok) {
            console.error("failed to generate chat title", data);
            throw new Error("failed to generate chat title");
        }
        return data as {title: string};
}

export interface ListChatsResp {
    chats: UserChat[]
}

export async function listChats(userId: string) {
    console.log("listing chats", userId);
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/chats`,
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to list chats", data);
        throw new Error("failed to list chats");
    }

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
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/chats`,
        {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to delete chats", data);
        throw new Error("failed to delete chats");
    }
}


interface UpdateChatTitleResp {
    id: string
    newTitle: string
}

export async function updateChatTitle(chatId: string, userId: string, newTitle: string) {
    console.log("update chat title", userId, chatId, newTitle)
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/chats/${chatId}/title`,
        {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "new_title": newTitle })
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to update chat title", data);
        throw new Error("failed to update chat title");
    }
    return { id: data["chat_id"], newTitle: data.title } as UpdateChatTitleResp;
}

interface DeleteChatResp {
    id: string
}

export async function deleteChat(chatId: string, userId: string) {
    console.log("delete chat", chatId, userId)
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/chats/${chatId}`,
        {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to delete chat", data);
        throw new Error("failed to delete chat");
    }
    return data as DeleteChatResp;
}