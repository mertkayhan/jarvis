'use server'

import { QuestionPack } from "@/lib/types";
import postgres from "postgres";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

export async function createPack(id: string, description: string, name: string, owner: string) {
    console.log("creating question pack", id, description, name, owner);
    return await createPackHandler(id, description, name, owner);
}

interface CreatePackResp {
    id: string
    description: string
    name: string
}

async function createPackHandler(id: string, description: string, name: string, owner: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            INSERT INTO common.question_packs (
                id, description, name, owner
            ) VALUES (
                ${id}::uuid, ${description}, ${name}, ${owner}
            )
            RETURNING id, description, name
            `
        ]);
        console.log("res:", res);
        return { ...res[0][0] } as CreatePackResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function listPacks(userId: string) {
    console.log("list packs", userId);
    return await listPacksHandler();
}

export interface ListPacksResp {
    packs: QuestionPack[]
}

async function listPacksHandler() {
    const listPacks = sql`
    SELECT 
        id,
        name, 
        description
    FROM common.question_packs
    WHERE deleted = false 
    ORDER BY updated_at DESC
    `;
    try {
        const res = await listPacks;
        return { packs: res as unknown as QuestionPack[] } as ListPacksResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface DeletePackResp {
    id: string
}

export async function deletePack(id: string) {
    console.log("delete question pack", id);
    return await deletePackHandler(id);
}

async function deletePackHandler(id: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.question_packs
            SET deleted = true
            WHERE id = ${id}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0].id } as DeletePackResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface UpdatePackResp {
    id: string
    name: string
    description: string
}

export async function updatePack(pack: QuestionPack) {
    console.log("update question pack", pack.id);
    return await updatePackHandler(pack);
}

async function updatePackHandler(pack: QuestionPack) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.question_packs
            SET name = ${pack.name}, description = ${pack.description}
            WHERE id = ${pack.id}
            RETURNING id, name, description
            `
        ]);
        console.log("res", res);
        return { ...res[0][0] } as UpdatePackResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}