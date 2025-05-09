"use server"

import { getToken } from "../chat/chat-actions";

interface GetAvailableModelsResp {
    models: { name: string, description: string }[]
}

export async function getAvailableModels(userId: string) {
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/models`,
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    return { models: data.models } as GetAvailableModelsResp;
}

interface GetUserModelResp {
    modelName: string | null
}

export async function getUserModel(userId: string) {
    console.log("get user model:", userId);
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/model-selection`,
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to get user model", data);
        throw new Error("failed to get user model");
    }
    return { modelName: data.model } as GetUserModelResp;

}

interface SetUserModelResp {
    modelName: string
}

export async function setUserModel(userId: string, modelName: string) {
    console.log("set user model", userId, modelName);
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken();
    const resp = await fetch(
        `${backendUrl}/api/v1/users/${userId}/model-selection`,
        {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "model_name": modelName }),
        }
    );
    const data = await resp.json();
    if (!resp.ok) {
        console.error("failed to set user model", data);
        throw new Error("failed to set user model");
    }
    return { modelName: data.model } as SetUserModelResp;
}