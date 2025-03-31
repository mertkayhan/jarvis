"use server"

import postgres from "postgres";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

interface GetUserModelResp {
    modelName: string | null
}

export async function getUserModel(userId: string) {
    console.log("get user model:", userId);
    return await getUserModelHandler(userId)

}

async function getUserModelHandler(userId: string) {
    const userModel = sql`
    SELECT 
        model_name,
        user_id
    FROM common.model_selection 
    WHERE user_id = ${userId}
    `;
    try {
        const res = await userModel;
        return {
            modelName: (res.length) ? res[0]["model_name"] : "automatic"
        } as GetUserModelResp;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface SetUserModelResp {
    error: string
}

export async function setUserModel(userId: string, modelName: string) {
    console.log("set user model", userId, modelName);
    return await setUserModelHandler(userId, modelName);
}

async function setUserModelHandler(userId: string, modelName: string) {
    const userModel = `
        mutation SetUserModel($user_id: String!, $model_name: String!) {
            insert_common_model_selection_one(object: {user_id: $user_id, model_name: $model_name}, on_conflict: {constraint: model_selection_pkey, update_columns: model_name}) {
                user_id
                updated_at
                model_name
            }
        }

    `;
    try {
        const res = await sql.begin((sql) => [
            sql`
            INSERT INTO common.model_selection (
                user_id, model_name
            ) VALUES (
                ${userId}, ${modelName}
            )
            ON CONFLICT(user_id)
            DO UPDATE 
            SET model_name = EXCLUDED.model_name
            RETURNING user_id, model_name
            `
        ]);
        console.log("res:", res);
        return {} as SetUserModelResp;
    } catch (error) {
        console.error(error);
        return { error: "failed to set user model" } as SetUserModelResp;
    }
}