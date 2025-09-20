"use server";

import { Message } from "../types";
import { callBackend } from "../common";


export async function listMessages(chatId: string, userId: string) {
    const data = await callBackend({
        endpoint: `/api/v1/chats/${chatId}/messages`,
        userId
    });

    return data as Message[];
}
