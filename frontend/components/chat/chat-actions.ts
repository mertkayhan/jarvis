'use server';

import { Message, Personality } from "@/lib/types";
import jwt from "jsonwebtoken";
import { callBackend } from "@/lib/utils";


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

export async function getBackendUrl() {
    const url = process.env.PRIVATE_BACKEND_URL || process.env.PUBLIC_BACKEND_URL;
    if (!url) {
        throw new Error('PRIVATE_BACKEND_URL is not set!');
    }
    return url;
}

export async function getWSUrl() {
    const url = process.env.PUBLIC_BACKEND_URL;
    if (!url) {
        throw new Error('PUBLIC_BACKEND_URL is not set!');
    }
    return url;
}

interface GetChatTitleResp {
    title: string | null;
}

export async function getChatTitle(userId: string, id: string) {
    const data = await callBackend({
        endpoint: `/api/v1/chats/${id}/title`,
        userId
    });
    return data as GetChatTitleResp;
}

interface LoadMessageHistoryResp {
    messages: Message[];
}

export async function loadMessageHistory(userId: string, chatId: string) {
    const data = await callBackend({
        endpoint: `/api/v1/chats/${chatId}/messages`,
        userId
    });

    // console.log("hist:", data);

    return data as LoadMessageHistoryResp;
}

interface RemoveMessageResp {
    id: string;
}

export async function removeMessage(userId: string, chatId: string, messageId: string) {
    const data = await callBackend({
        endpoint: `/api/v1/chats/${chatId}/messages/${messageId}`,
        method: "DELETE",
        userId,
    });
    return data as RemoveMessageResp;
}