"use server";

import { Personality } from "@/lib/types";
import postgres from "postgres";
import { callBackend } from "@/lib/utils";

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
    `;
    try {
        const [personality, defaultPersonality] = await Promise.all([getPersonality, getDefaultPersonality]);
        return { ...personality[0], isDefault: (defaultPersonality.length) ? personality[0].id === defaultPersonality[0]["personality_id"] : false } as Personality;
    } catch (error) {
        console.error("failed to fetch personality", error);
        throw error;
    }
}

export async function getAvailableTools(userId: string) {
    const data = await callBackend({
        endpoint: `/api/v1/tools`,
        method: "GET",
        userId,
    });
    return { tools: data.tools };
}

export interface ListPersonalitiesResp {
    personalities: Personality[] | null;
}

export async function listPersonalities(userId: string) {
    console.log("list personalities", userId);
    const data = await callBackend({
        endpoint: `/api/v1/personalities`,
        method: "GET",
        userId,
    });
    return data as ListPersonalitiesResp;
}

interface CreatePersonalityResp {
    id: string;
}

export async function createPersonality(userId: string, name: string, description: string, instructions: string, owner: string, tools: string[], docIds: string[]) {
    console.log("create personality", userId, name, description, instructions, owner, tools, docIds);
    const data = await callBackend({
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
    return data as CreatePersonalityResp;
}

interface DeletePersonalityResp {
    id: string;
}

export async function deletePersonality(userId: string, id: string) {
    console.log("delete personality", id, userId);
    const data = await callBackend({
        endpoint: `/api/v1/personalities/${id}`,
        method: "DELETE",
        userId,
    });
    return data as DeletePersonalityResp;
}

interface UpdatePersonalityResp {
    id: string;
}

export async function updatePersonality(userId: string, id: string, name: string, description: string, instructions: string, tools: string[], docs: string[], owner: string) {
    console.log("update personality", id, name, description, instructions, tools, docs, owner);
    const data = await callBackend({
        endpoint: `/api/v1/personalities/${id}`,
        method: "PUT",
        body: {
            "name": name,
            "instructions": instructions,
            "description": description,
            "tools": tools,
            "doc_ids": docs,
        },
        userId,
    });
    return data as UpdatePersonalityResp;
}

interface MakePersonalityGlobalResp {
    id: string;
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
    id: string;
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
    id: string;
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
    personality: Personality;
}

export async function getDefaultPersonality(userId: string) {
    const data = await callBackend({
        endpoint: "/api/v1/personalities/default",
        userId
    });
    return { personality: data } as GetDefaultPersonalityResp;
}

