"use server"

import { Personality } from "@/lib/types";
import postgres from "postgres";
import { getToken } from "../chat/chat-actions";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

export async function getPersonality(id: string, userId: string) {
    const getPersonality = sql`
    SELECT 
        id,
        description,
        instructions,
        name,
        owner,
        tools,
        doc_ids
    FROM common.personalities
    WHERE deleted = false AND owner IN ('system', ${userId}) AND id = ${id}
    `;
    const getDefaultPersonality = sql`
    SELECT 
        user_id,
        personality_id
    FROM common.default_personalities 
    WHERE user_id = ${userId}
    `
    try {
        const [personality, defaultPersonality] = await Promise.all([getPersonality, getDefaultPersonality]);
        return { ...personality[0], isDefault: (defaultPersonality.length) ? personality[0].id === defaultPersonality[0]["personality_id"] : false } as Personality
    } catch (error) {
        console.error("failed to fetch personality", error);
        throw error;
    }
}

export async function getAvailableTools(userId: string) {
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/tools`,
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    return { tools: data.tools };
}

export interface ListPersonalitiesResp {
    personalities: Personality[] | null
}

export async function listPersonalities(userId: string) {
    console.log("list personalities", userId);
    return await listPersonalitiesHandler(userId);
}

async function listPersonalitiesHandler(userId: string) {
    const listPersonalities = sql`
    SELECT 
        id,
        description,
        name,
        owner
    FROM common.personalities
    WHERE deleted = false AND owner IN ('system', ${userId})
    ORDER BY updated_at DESC
    `;
    const getDefaultPersonality = sql`
    SELECT 
        user_id,
        personality_id
    FROM common.default_personalities 
    WHERE user_id = ${userId}
    `
    try {
        const [personalities, defaultPersonality] = await Promise.all([listPersonalities, getDefaultPersonality]);
        return {
            personalities: personalities.map((p) => {
                return {
                    ...p,
                    isDefault: (defaultPersonality.length) ? p.id === defaultPersonality[0]["personality_id"] : false
                } as Personality
            })
        } as ListPersonalitiesResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface CreatePersonalityResp {
    id: string
}

export async function createPersonality(id: string, name: string, description: string, instructions: string, owner: string, tools: string[], docIds: string[]) {
    console.log("create personality", id, name, description, instructions, owner, tools, docIds);
    return await createPersonalityHandler(id, name, description, instructions, owner, tools, docIds);
}

async function createPersonalityHandler(id: string, name: string, description: string, instructions: string, owner: string, tools: string[], docIds: string[]) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            INSERT INTO common.personalities (
                id, instructions, name, owner, description, tools, doc_ids
            ) VALUES (
                ${id}::uuid, ${instructions}, ${name}, ${owner}, ${description}, ${tools}, ${docIds}
            )
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0].id } as CreatePersonalityResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface DeletePersonalityResp {
    id: string
}

export async function deletePersonality(id: string) {
    console.log("delete personality", id);
    return await deletePersonalityHandler(id);
}

async function deletePersonalityHandler(id: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.personalities
            SET deleted = true 
            WHERE id = ${id}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0].id } as DeletePersonalityResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface UpdatePersonalityResp { }

export async function updatePersonality(id: string, name: string, description: string, instructions: string, tools: string[], docs: string[], owner: string) {
    console.log("update personality", id, name, description, instructions, tools, docs, owner);
    return await updatePersonalityHandler(id, name, description, instructions, tools, docs, owner);
}

async function updatePersonalityHandler(id: string, name: string, description: string, instructions: string, tools: string[], docs: string[], owner: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.personalities
            SET name = ${name}, instructions = ${instructions}, description = ${description}, tools = ${tools}, doc_ids = ${docs}, owner = ${owner}
            WHERE id = ${id}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return {} as UpdatePersonalityResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface MakePersonalityGlobalResp {
    id: string
}

export async function makePersonalityGlobal(id: string) {
    console.log("make personality global", id);
    return await makePersonalityGlobalHandler(id);
}

async function makePersonalityGlobalHandler(id: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            UPDATE common.personalities
            SET owner = 'system'
            WHERE id = ${id}
            RETURNING id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0].id } as MakePersonalityGlobalResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface SetDefaultPersonalityResp {
    id: string
}

export async function setDefaultPersonality(userId: string, personalityId: string) {
    console.log("default personality");
    return await setDefaultPersonalityHandler(userId, personalityId);
}

async function setDefaultPersonalityHandler(userId: string, personalityId: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            INSERT INTO common.default_personalities (
                user_id, personality_id
            ) VALUES (
                ${userId}, ${personalityId}::uuid
            )
            ON CONFLICT(user_id)
            DO UPDATE 
            SET personality_id = EXCLUDED.personality_id 
            RETURNING personality_id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0]["personality_id"] } as SetDefaultPersonalityResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface DeleteDefaultPersonalityResp {
    id: string
}

export async function deleteDefaultPersonality(owner: string) {
    console.log("delete default personality", owner);
    return await deleteDefaultPersonalityHandler(owner);
}

async function deleteDefaultPersonalityHandler(owner: string) {
    try {
        const res = await sql.begin((sql) => [
            sql`
            DELETE FROM common.default_personalities 
            WHERE user_id = ${owner}
            RETURNING personality_id
            `
        ]);
        console.log("res:", res);
        return { id: res[0][0]["personality_id"] } as DeleteDefaultPersonalityResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface GetDefaultPersonalityResp {
    personality: Personality
}

export async function getDefaultPersonality(userId: string) {
    console.log("get default personality", userId);
    return await getDefaultPersonalityHandler(userId);
}

async function getDefaultPersonalityHandler(userId: string) {
    const getDefault = sql`
    SELECT
        name,
        tools,
        instructions,
        description
    FROM common.default_personalities x
    INNER JOIN common.personalities y
    ON x.personality_id = y.id
    WHERE x.user_id = ${userId}
    `;
    try {
        const res = await getDefault;
        return {
            personality: (res.length) ? res[0] : null
        } as GetDefaultPersonalityResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}