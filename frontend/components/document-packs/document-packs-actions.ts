'use server';

import { DocumentPack, UserDocument } from "@/lib/types";
import postgres from "postgres";


const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

export async function getPack(id: string, userId: string) {
    const getPack = sql`
        SELECT 
            id, 
            name, 
            description
        FROM common.document_packs
        WHERE deleted = false AND id = ${id}
    `;

    try {
        const res = await getPack;
        return res[0] as DocumentPack;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export interface ListDocumentPacksResp {
    packs: DocumentPack[];
}

export async function listPacks() {
    console.log("listing document packs");
    return await listPacksHandler();
}

async function listPacksHandler() {
    const getPacks = sql`
        SELECT 
            id, 
            name, 
            description
        FROM common.document_packs
        WHERE deleted = false
        ORDER BY updated_at DESC
    `;

    try {
        const res = await getPacks;
        console.log("res:", res);
        return { packs: res as unknown as DocumentPack[] } as ListDocumentPacksResp;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

interface CreatePackResp {
    id: string;
    name: string;
    description: string;
}

export async function createPack(id: string, name: string, description: string, owner: string) {
    console.log("creating pack", id, name, description, owner);
    return await createPackHandler(id, name, description, owner);
}

async function createPackHandler(id: string, name: string, description: string, owner: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            INSERT INTO common.document_packs (
                id, name, description, owner
            ) VALUES (
                ${id}, ${name}, ${description}, ${owner}
            )
            RETURNING id, name, description
            `
        ]);
        return { ...res[0][0] } as CreatePackResp;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

interface UpdatePackResp {
    id: string;
    name: string;
    description: string;
}

export async function updatePack(id: string, name: string, description: string) {
    console.log("update pack", id, name, description);
    return await updatePackHandler(id, name, description);
}

async function updatePackHandler(id: string, name: string, description: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
                UPDATE common.document_packs
                SET name = ${name}, description = ${description}
                WHERE id = ${id}
                RETURNING id, name, description
            `
        ]);
        return { ...res[0][0] } as UpdatePackResp;
    } catch (err) {
        console.error(err);
        throw err;
    }

}

interface DeletePackResp {
    id: string;
}

export async function deletePack(id: string) {
    console.log("delete pack", id);
    return await deletePackHandler(id);
}

async function deletePackHandler(id: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
                UPDATE common.document_packs
                SET deleted = true
                WHERE id = ${id}
                RETURNING id
            `
        ]);
        return { id: res[0][0].id } as DeletePackResp;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

interface ListPackDocsResp {
    docs: UserDocument[];
}

export async function listDocuments(packId: string) {
    console.log("list documents", packId);
    return await listDocumentsHandler(packId);
}

async function listDocumentsHandler(packId: string) {
    const listDocs = sql`
        SELECT 
            id,
            name
        FROM common.document_pack_docs
        WHERE pack_id = ${packId}
    `;

    try {
        const res = await listDocs;
        return {
            docs: res.map((r: postgres.Row) => {
                return { id: r.id, name: r.name, href: "", owner: "" } as UserDocument;
            })
        } as ListPackDocsResp;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function getWorkflowStatus(packId: string) {
    const getStatus = sql`
        SELECT 
            stage
        FROM common.document_packs
        WHERE id = ${packId}
    `;

    try {
        const res = await getStatus;
        return res[0].stage as string;
    } catch (error) {
        console.error("failed to get workflow status");
        throw error;
    }
}