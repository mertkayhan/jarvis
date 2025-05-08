'use server'

import { UserChat } from "@/lib/types";
import postgres from "postgres";
import { getToken } from "../chat/chat-actions";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

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
    return await listChatsHandler(userId);
}

async function listChatsHandler(userId: string) {
    const listChats = sql`
    SELECT 
        id,
        owner_email AS userId,
        title,
        created_at AS createdAt, 
        updated_at AS updatedAt 
    FROM common.chat_history 
    WHERE owner_email = ${userId} AND deleted = false
    ORDER BY updated_at DESC
    `;
    try {
        const res = await listChats;
        return {
            chats: res.map((r) => {
                return {
                    ...r,
                    userId: r.userid,
                    createdAt: new Date(r.createdat),
                    updatedAt: new Date(r.updatedat),
                }
            })
        } as ListChatsResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deleteChats(userId: string) {
    console.log("delete chats", userId);
    return await deleteChatsHandler(userId);
}

interface DeleteChatsResp {
    error: string | null
}

async function deleteChatsHandler(userId: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.chat_history 
            SET deleted = true 
            WHERE owner_email = ${userId}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return {} as DeleteChatsResp;
    } catch (error) {
        console.error(error);
        return { error: "failed to delete chats" } as DeleteChatsResp;
    }
}

interface UpdateChatTitleResp {
    id: string
    newTitle: string
}

export async function updateChatTitle(chatId: string, userId: string, newTitle: string) {
    console.log("update chat title", userId, chatId, newTitle)
    return await updateChatTitleHandler(chatId, userId, newTitle)
}

async function updateChatTitleHandler(chatId: string, userId: string, newTitle: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.chat_history
            SET title = ${newTitle}
            WHERE id = ${chatId}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0].id, newTitle } as UpdateChatTitleResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface DeleteChatResp {
    id: string
}

export async function deleteChat(chatId: string, userId: string) {
    console.log("delete chat", chatId, userId)
    return await deleteChatHandler(chatId, userId)
}

async function deleteChatHandler(chatId: string, userId: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.chat_history 
            SET deleted = true 
            WHERE id = ${chatId}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0].id } as DeleteChatResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}