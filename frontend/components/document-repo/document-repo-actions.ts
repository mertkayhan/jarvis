"use server"

import { UserDocument } from "@/lib/types";
import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";
import postgres from "postgres";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });
const documentBucket = process.env.DOCUMENT_BUCKET || "unknown";

export interface ListDocumentsResp {
    docs: UserDocument[] | null
}

export async function listDocuments(userId: string) {
    console.log("list documents", userId);
    return await listDocumentsHandler(userId);
}

async function listDocumentsHandler(userId: string) {
    const listDocuments = sql`
    SELECT 
        document_id,
        document_name,
        num_pages,
        num_tokens,
        created_at 
    FROM common.document_repo
    WHERE owner = ${userId} AND deleted = false
    ORDER BY updated_at DESC
    `;
    try {
        const res = await listDocuments;
        const docs = await Promise.all(res.map(async (r) => {
            let href = ""
            try {
                href = await generateV4ReadSignedUrl(`raw/${userId}/${r["document_id"]}/${r["document_name"]}`);
            } catch (err) {
                console.error(err);
            }
            return {
                id: r["document_id"],
                owner: userId,
                name: r["document_name"],
                href: href,
                pageCount: r["num_pages"],
                tokenCount: r["num_tokens"],
                createdAt: new Date(r["created_at"]),
            } as UserDocument;
        }));
        return {
            docs: docs
        } as ListDocumentsResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function generateV4ReadSignedUrl(fileName: string) {
    // These options will allow temporary read access to the file
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 15 minutes
    } as GetSignedUrlConfig;

    const storage = new Storage();
    // Get a v4 signed URL for reading the file
    const [url] = await storage
        .bucket(documentBucket)
        .file(fileName)
        .getSignedUrl(options);
    return url;
}


interface DeleteDocumentResp {
    id: string
}

export async function deleteDocument(docId: string) {
    console.log("delete document", docId);
    return await deleteDocumentHandler(docId);
}

async function deleteDocumentHandler(docId: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.document_repo
            SET deleted = true
            WHERE document_id = ${docId}
            RETURNING document_id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0]["document_id"] } as DeleteDocumentResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}