"use server"

import { UserDocument } from "@/lib/types";
import { getToken } from "../chat/chat-actions";

export interface ListDocumentsResp {
    docs: UserDocument[] | null
}

export async function listDocuments(userId: string) {
    console.log("list documents", userId);
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/docs`,
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to fetch user docs", data);
        throw new Error("failed to fetch user docs");
    }
    return {docs: data?.docs.map((d: Record<string, any>) => {
        return {...d, createdAt: new Date(d.createdAt)}
    })} as ListDocumentsResp;
}

interface DeleteDocumentResp {
    id: string
}

export async function deleteDocument(userId:string, docId: string) {
    console.log("delete document", docId);
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/docs/${docId}`,
        {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to delete user doc", data);
        throw new Error("failed to delete user doc");
    }
    return data as DeleteDocumentResp;
}