'use server'

import { Message, Personality } from "@/lib/types";
import postgres from "postgres";
import jwt from "jsonwebtoken";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

let cachedToken: string | null = null;
let tokenExpiryTime = 0;

export async function getToken(userId: string) {
    const secret = process.env.AUTH0_SECRET;
    if (!secret) {
        throw new Error("AUTH0_SECRET is not set!");
    }
    if (cachedToken && Math.floor(Date.now()) < tokenExpiryTime) {
        return cachedToken;
    } else {
        const expiration = Math.floor(Date.now() / 1000) + 3600;
        tokenExpiryTime = expiration - 60;
        const claims = {
            sub: userId,
            role: "user",  // TODO:
            iat: Math.floor(Date.now() / 1000),
            aud: process.env.AUTH0_API_AUDIENCE,
            exp: expiration,
            iss: process.env.AUTH0_BASE_URL,
            jti: crypto.randomUUID(),
            nbf: Math.floor(Date.now() / 1000) - 1,
        };
        const token = jwt.sign(claims, secret, { algorithm: "HS256" });
        cachedToken = token;
        return token;
    }
}

export async function getDefaultSystemPrompt(userId: string) {
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken(userId);
    const resp = await fetch(
        `${backendUrl}/api/v1/default-prompt`,
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    return data as Personality;
}

export async function getWSUrl() {
    const url = process.env.BACKEND_URL;
    if (!url) {
        throw new Error('BACKEND_URL is not set!');
    }
    return url;
}

interface GetChatTitleResp {
    title: string | null
}

export async function getChatTitle(id: string) {
    console.log("get chat title", id);
    return await getChatTitleHandler(id);
}

async function getChatTitleHandler(id: string) {
    const getTitle = sql`
    SELECT
        title
    FROM common.chat_history
    WHERE id = ${id}
    `;
    try {
        const res = await getTitle;
        return { title: res[0]?.title } as GetChatTitleResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface LoadMessageHistoryResp {
    messages: Message[]
}

export async function loadMessageHistory(userId: string, chatId: string) {
    console.log("load message history", userId, chatId);
    return await loadMessageHistoryHandler(chatId);
}

async function loadMessageHistoryHandler(chatId: string) {
    const loadMessages = sql`
    SELECT 
        chat_id,
        content, 
        created_at,
        data,
        id,
        liked, 
        role,
        score,
        updated_at,
        context 
    FROM common.message_history
    WHERE chat_id = ${chatId} AND role IN ('user', 'assistant')
    ORDER BY created_at ASC
    `;
    try {
        const res = await loadMessages;
        return {
            messages: res.map((r) => {
                return {
                    ...r as unknown as Message,
                    chatId: r["chat_id"],
                    createdAt: r["created_at"],
                    updatedAt: r["updated_at"],
                } as Message
            })
        } as LoadMessageHistoryResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface RemoveMessageResp {
    error: string | null
}

export async function removeMessage(messageId: string) {
    console.log("remove message", messageId);
    return await removeMessageHandler(messageId);
}

async function removeMessageHandler(messageId: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            DELETE FROM common.message_history 
            WHERE id = ${messageId}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return {} as RemoveMessageResp;
    } catch (error) {
        console.error(error);
        return { error: "failed to remove message" } as RemoveMessageResp;
    }
}