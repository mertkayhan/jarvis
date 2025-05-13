"use server"

import { callBackend } from "@/lib/utils";

interface GetAvailableModelsResp {
    models: { name: string, description: string }[]
}

export async function getAvailableModels(userId: string) {
    const data = await callBackend(
        {
            endpoint: `/api/v1/models`,
            method: "GET",
            userId,
        }
    );
    return { models: data.models } as GetAvailableModelsResp;
}

interface GetUserModelResp {
    modelName: string | null
}

export async function getUserModel(userId: string) {
    console.log("get user model:", userId);
    const data = await callBackend({
        endpoint: `/api/v1/model-selection`,
        method: "GET",
        userId,
    });
    return { modelName: data.model } as GetUserModelResp;

}

interface SetUserModelResp {
    modelName: string
}

export async function setUserModel(userId: string, modelName: string) {
    console.log("set user model", userId, modelName);
    const data = await callBackend({
        endpoint: `/api/v1/model-selection`,
        method: "POST",
        body: { "model_name": modelName },
        userId,
    });
    return { modelName: data.model } as SetUserModelResp;
}