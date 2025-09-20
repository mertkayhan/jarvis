"use server";

import { FormState, Personality } from "../types";
import { callBackend } from "../common";
import { uuidv4 } from "../utils";


export async function createPersonality(userId: string, availableTools: string[], prevState: any, formData: FormData): Promise<FormState> {
    const name = formData.get("personality-name");
    const description = formData.get("personality-description");
    const instructions = formData.get("personality-instructions");
    const tools = availableTools.filter((t) => formData.get(t) === "on");
    const docIds = formData.get("personality-doc-ids") || [];

    try {
        await callBackend({
            endpoint: `/api/v1/personalities`,
            method: "POST",
            body: {
                "instructions": instructions,
                "name": name,
                "description": description,
                "tools": tools,
                "doc_ids": docIds,
            },
            userId,
        });
        return { success: true };
    }
    catch (err) {
        return {
            success: false,
            message: err,
        };
    }
}

export async function updatePersonality(userId: string, availableTools: string[], id: string, prevState: any, formData: FormData): Promise<FormState> {

    const name = formData.get("personality-name");
    const description = formData.get("personality-description");
    const instructions = formData.get("personality-instructions");
    const tools = availableTools.filter((t) => formData.get(t) === "on");
    const docIds = formData.get("personality-doc-ids") || [];

    try {
        await callBackend({
            endpoint: `/api/v1/personalities/${id}`,
            method: "PUT",
            body: {
                "name": name,
                "instructions": instructions,
                "description": description,
                "tools": tools,
                "doc_ids": docIds,
            },
            userId,
        });
        return { success: true };
    }
    catch (err) {
        return {
            success: false,
            message: err,
        };
    }

}

export async function deletePersonality(userId: string, id: string) {
    await callBackend({
        endpoint: `/api/v1/personalities/${id}`,
        method: "DELETE",
        userId,
    });
}

