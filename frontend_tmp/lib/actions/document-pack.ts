"use server";

import { DocumentPack, FormState } from "../types";
import { callBackend } from "../common";

export async function createDocumentPack(userId: string, prevState: any, formData: FormData): Promise<FormState> {
    const name = formData.get("pack-name");
    const description = formData.get("pack-description");

    try {
        await callBackend({
            endpoint: `/api/v1/document-packs`,
            method: "POST",
            body: {
                "name": name,
                "description": description,
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

interface ListDocumentPacksResp {
    packs: DocumentPack[];
}

export async function listDocumentPacks(userId: string) {
    const data = await callBackend({
        endpoint: `/api/v1/document-packs`,
        method: "GET",
        userId,
    });
    return data as ListDocumentPacksResp;
}

export async function updateDocumentPack(userId: string, id: string, prevState: any, formData: FormData): Promise<FormState> {
    const name = formData.get("pack-name");
    const description = formData.get("pack-description");

    try {
        await callBackend({
            endpoint: `/api/v1/document-packs/${id}`,
            method: "PUT",
            body: {
                "name": name,
                "description": description,
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

export async function deleteDocumentPack(userId: string, id: string) {
    await callBackend({
        endpoint: `/api/v1/document-packs/${id}`,
        method: "DELETE",
        userId,
    });
}