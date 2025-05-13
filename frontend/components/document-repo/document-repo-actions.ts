"use server"

import { UserDocument } from "@/lib/types";
import { callBackend } from "@/lib/utils";

export interface ListDocumentsResp {
    docs: UserDocument[] | null
}

export async function listDocuments(userId: string) {
    console.log("list documents", userId);
    const data = await callBackend(
        {
            endpoint: `/api/v1/docs`,
            method: "GET",
            userId,
        }
    );
    return {
        docs: data?.docs.map((d: Record<string, any>) => {
            return { ...d, createdAt: new Date(d.createdAt) }
        })
    } as ListDocumentsResp;
}

interface DeleteDocumentResp {
    id: string
}

export async function deleteDocument(userId: string, docId: string) {
    console.log("delete document", docId);
    const data = await callBackend(
        {
            endpoint: `/api/v1/docs/${docId}`,
            method: "DELETE",
            userId,
        }
    );
    return data as DeleteDocumentResp;
}