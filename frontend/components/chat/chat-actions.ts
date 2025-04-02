'use server'

import { Message } from "@/lib/types";
import postgres from "postgres";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

let cachedToken: string | null = "Kz5OpChV5in1MIwa3hfQNzFoDzIxq0n";
let tokenExpiryTime = Infinity;

export async function getToken() {
    return cachedToken;
    // if (cachedToken && Date.now() < tokenExpiryTime) {
    //     return cachedToken;
    // }
    // try {
    //     const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             client_id: process.env.AUTH0_API_CLIENT_ID,
    //             client_secret: process.env.AUTH0_API_CLIENT_SECRET,
    //             audience: process.env.AUTH0_API_AUDIENCE,
    //             grant_type: 'client_credentials'
    //         })
    //     });
    //     if (!response.ok) {
    //         throw new Error(`Auth0 token request failed: ${response.statusText}`);
    //     }
    //     const data = await response.json();
    //     tokenExpiryTime = Date.now() + (data.expires_in * 1000) - 60000;
    //     cachedToken = data["access_token"];
    //     return data["access_token"] as string;
    // } catch (error) {
    //     console.error('Error in getToken:', error);
    //     throw error;
    // }
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
    FROM talk_to_your_pid.chat_history
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
    FROM talk_to_your_pid.message_history
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
            DELETE FROM talk_to_your_pid.message_history 
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