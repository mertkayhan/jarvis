'use server'

import { AdditionalInfo, Question, QuestionFilter } from "@/lib/types";
import { Tag } from "emblor";
import postgres from 'postgres';
import { uuidv4 } from "@/lib/utils";
import { getToken } from "../chat/chat-actions";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });

export interface ListQuestionsResp {
    questions: Question[]
    maxPageNo: number
}

function registerTransaction(operation: string, prevValue: string, currentValue: string, userId: string, questionId: string) {
    const newId = uuidv4();
    const query = sql`
        INSERT INTO common.question_history (
            id, operation, prev_value, current_value, user_id, question_id
        ) VALUES (
            ${newId}, ${operation}, ${prevValue}, ${currentValue}, ${userId}, ${questionId}
        )
    `;
    return query;
}

export async function listQuestions(userId: string, packId: string, offset: number, filters: QuestionFilter | null, searchQuery: string | null) {
    console.log("listing questions", packId, offset, filters, searchQuery);
    return await listQuestionsHandler(userId, packId, offset, filters, searchQuery);
}

async function listQuestionsHandler(userId: string, packId: string, offset: number, filters: QuestionFilter | null, searchQuery: string | null) {
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken(userId);
    const batchSize = 10;
    let baseUrl = `${backendUrl}/api/v1/question-packs/${packId}/questions?offset=${offset}&limit=${batchSize}`;
    if (searchQuery) {
        baseUrl += `&search_query=${encodeURIComponent(searchQuery)}`;
    }
    if (filters?.tags) {
        const tagList = [...filters.tags];
        for (const t of tagList) {
            baseUrl += `&tags=${t}`;
        }
    }
    if (filters?.additionalInfo) {
        const info = filters.additionalInfo.map((a) => {
            return JSON.stringify({ key: a.key, value: [...a.value].join(",") });
        });

        for (const i of info) {
            baseUrl += `&additional_info=${encodeURIComponent(i)}`;
        }
    }
    const resp = await fetch(
        baseUrl,
        {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        }
    );

    if (!resp.ok) {
        throw new Error("failed to list questions");
    }
    const data = await resp.json();
    // console.log("data", data);
    return data as ListQuestionsResp;
}



interface CreateQuestionResp {
    id: string
    question: string
}

export async function createQuestion(packId: string, question: string, userId: string) {
    console.log("create question", packId, question, userId);
    return await createQuestionHandler(packId, question, userId);
}

async function createQuestionHandler(packId: string, question: string, userId: string) {
    const backendUrl = process.env.BACKEND_URL;
    const token = await getToken(userId);
    const resp = await fetch(
        `${backendUrl}/api/v1/question-packs/${packId}/questions`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question }),
        }
    );
    if (!resp.ok) {
        throw new Error("failed to create question");
    }
    const data = await resp.json();
    return data as CreateQuestionResp;
}

interface DeleteQuestionResp {
    id: string
}

export async function deleteQuestion(questionId: string, userId: string, question: string) {
    console.log("delete question", questionId, userId);
    return await deleteQuestionHandler(questionId, userId, question);
}

async function deleteQuestionHandler(questionId: string, userId: string, question: string) {
    try {
        const transactionQuery = registerTransaction("DELETE QUESTION", question, "NULL", userId, questionId);
        const res = await sql.begin((sql) => [
            sql`${transactionQuery}`,
            sql`
            UPDATE common.question_pairs
            SET deleted = true
            WHERE id = ${questionId}
            RETURNING id
            `
        ]
        );
        console.log("res:", res);
        return { id: res[1][0].id } as DeleteQuestionResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface UpdateAnswerResp {
    id: string
    answer: string
}

export async function updateAnswer(questionId: string, answer: string, userId: string) {
    console.log("update answer", questionId, userId, answer);
    return await updateAnswerHandler(questionId, answer, userId);
}

async function updateAnswerHandler(questionId: string, answer: string, userId: string) {
    const getPrevValue = sql`
        SELECT 
            answer
        FROM common.question_pairs
        WHERE id = ${questionId}
    `;
    try {
        const prevAnswer = await getPrevValue;
        const transactionQuery = registerTransaction(
            "UPDATE ANSWER",
            (prevAnswer[0].answer.trim().length > 0) ? prevAnswer[0].answer.trim() : "NULL",
            (answer.trim().length > 0) ? answer : "NULL",
            userId,
            questionId
        );
        const res = await sql.begin((sql) => [
            sql`${transactionQuery}`,
            sql`
            UPDATE common.question_pairs
            SET answer = ${answer}, updated_by = ${userId}
            WHERE id = ${questionId}
            RETURNING id, answer
`
        ]);
        // console.log("res", res);
        return { ...res[1][0] } as UpdateAnswerResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface UpdateQuestionResp {
    id: string
    question: string
}

export async function updateQuestion(questionId: string, question: string, userId: string) {
    console.log("update question", questionId, question, userId);
    return await updateQuestionHandler(questionId, question, userId);
}

async function updateQuestionHandler(questionId: string, question: string, userId: string) {
    const getPrevValue = sql`
        SELECT 
            question
        FROM common.question_pairs
        WHERE id = ${questionId}
    `;
    try {
        const prevQuestion = await getPrevValue;
        const transactionQuery = registerTransaction(
            "UPDATE QUESTION",
            prevQuestion[0].question,
            question,
            userId,
            questionId
        );
        const res = await sql.begin((sql) => [
            sql`${transactionQuery}`,
            sql`
            UPDATE common.question_pairs
            SET question = ${question}, updated_by = ${userId}
            WHERE id = ${questionId}
            RETURNING id, question
`
        ]);
        console.log("res", res);
        return { ...res[1][0] } as UpdateQuestionResp;
    } catch (error) {
        console.error(error);
        throw error;
    }

}
export interface ListTagsResp {
    tags: Tag[]
}

export async function listTags(questionId: string) {
    console.log("list tags", questionId);
    return await listTagsHandler(questionId);
}

async function listTagsHandler(questionId: string) {
    const listTags = sql`
SELECT
    *
    FROM common.question_tags
        WHERE question_id = ${questionId}
`;
    try {
        const res = await listTags;
        return {
            tags: res.map((d: Record<string, string>) => {
                return {
                    id: d.id,
                    text: d.tag,
                } as Tag
            })
        } as ListTagsResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface CreateTagResp {
    id: string
    tag: string
}

export async function createTag(questionId: string, tagId: string, tag: string, packId: string, userId: string) {
    console.log("create tag", questionId, tagId, tag, packId, userId);
    return await createTagHandler(questionId, tagId, tag, packId, userId);
}

async function createTagHandler(questionId: string, tagId: string, tag: string, packId: string, userId: string) {
    try {
        const transactionQuery = registerTransaction("CREATE TAG", "NULL", tag, userId, questionId);
        const res = await sql.begin((sql) => [
            sql`${transactionQuery}`,
            sql`
            INSERT INTO common.question_tags(
                id, question_id, tag, pack_id
            ) VALUES(
                ${tagId}, ${questionId}, ${tag}, ${packId}
            )
            RETURNING id, tag
            `
        ]);
        console.log("res:", res);
        return { id: res[1][0].id, tag: res[1][0].tag } as CreateTagResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface RemoveTagResp {
    id: string
}

export async function removeTag(questionId: string, tag: string, userId: string) {
    console.log("remove tag", questionId, tag, userId);
    return await removeTagHandler(questionId, tag, userId);
}

async function removeTagHandler(questionId: string, tag: string, userId: string) {
    try {
        const transactionQuery = registerTransaction("REMOVE TAG", tag, "NULL", userId, questionId);
        const res = await sql.begin((sql) => [
            sql`${transactionQuery}`,
            sql`
            DELETE FROM common.question_tags
            WHERE question_id = ${questionId} AND tag = ${tag}
            RETURNING id
    `
        ]);
        console.log("res", res);
        return { id: res[1][0].id } as RemoveTagResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface ListAdditionalInfoResp {
    info: AdditionalInfo[]
}

export async function listAdditionalInfo(questionId: string) {
    console.log("list additional info", questionId);
    return await listAdditionalInfoHandler(questionId);
}

async function listAdditionalInfoHandler(questionId: string) {
    const listAdditionalInfo = sql`
        SELECT
            key,
            value,
            id 
        FROM common.question_additional_info
        WHERE question_id = ${questionId}
    `;
    try {
        const res = await listAdditionalInfo;
        return {
            info: res.map((r) => {
                // console.log(r);
                return {
                    key: r.key,
                    value: r.value,
                    id: r.id,
                } as AdditionalInfo
            }) as AdditionalInfo[]
        } as ListAdditionalInfoResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface SaveAdditionalInfoResp {
    info: AdditionalInfo[]
}

export async function saveAdditionalInfo(questionId: string, info: AdditionalInfo[], userId: string, packId: string) {
    console.log("save additional info", questionId, info, userId);
    const validInfo = info.filter((i) => Boolean(i.key.length)).map((i) => { return { "question_id": questionId, ...i, "pack_id": packId } });
    if (!validInfo.length) {
        return {} as SaveAdditionalInfoResp;
    }
    return await saveAdditionalInfoHandler(validInfo, userId, questionId);
}

async function saveAdditionalInfoHandler(info: Record<string, string>[], userId: string, questionId: string) {
    const getPrevValue = sql`
        SELECT 
            key, 
            value 
        FROM common.question_additional_info
        WHERE question_id = ${questionId}
    `;
    // console.log("info:", info);
    try {
        const additionalInfo = await getPrevValue;
        const transactionQuery = registerTransaction(
            "UPDATE ADDITIONAL INFO",
            JSON.stringify(additionalInfo),
            JSON.stringify(info.map((a) => {
                return { key: a.key, value: a.value };
            })),
            userId,
            questionId
        );
        const res = await sql.begin((sql) => [
            sql`${transactionQuery}`,
            sql`
            INSERT INTO common.question_additional_info ${sql(info, "id", "key", "value", "question_id", "pack_id")}
            ON CONFLICT(id) DO UPDATE 
            SET id = EXCLUDED.id, key = EXCLUDED.key, value = EXCLUDED.value, question_id = EXCLUDED.question_id
            RETURNING id
    `
        ]);
        // console.log("res:", res);
        return { info: info as unknown as AdditionalInfo[] } as SaveAdditionalInfoResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface RemoveAdditionalInfoResp {
    id: string
}

export async function removeAdditionalInfo(id: string, userId: string, questionId: string) {
    console.log("remove additional info", id, userId);
    return await removeAdditionalInfoHandler(id, userId, questionId);
}

async function removeAdditionalInfoHandler(id: string, userId: string, questionId: string) {
    const getPrevValue = sql`
        SELECT 
            key, 
            value 
        FROM common.question_additional_info
        WHERE id = ${id}
    `;
    try {
        const additionalInfo = await getPrevValue;
        const transactionQuery = registerTransaction(
            "REMOVE ADDITIONAL INFO",
            JSON.stringify(additionalInfo[0]),
            "NULL",
            userId,
            questionId
        );
        const res = await sql.begin((sql) => [
            sql`${transactionQuery}`,
            sql`
            DELETE FROM common.question_additional_info
            WHERE id = ${id}
            RETURNING id
    `
        ]);
        console.log("res:", res);
        return { id: res[1][0].id } as RemoveAdditionalInfoResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface ListAdditionalInfoKeysResp {
    keys: string[]
}

export async function listAdditionalInfoKeys(packId: string) {
    console.log("listing keys", packId);
    return await listAdditionalInfoKeysHandler(packId);
}

async function listAdditionalInfoKeysHandler(packId: string) {
    const listAdditionalInfoKeys = sql`
SELECT
        DISTINCT key 
    FROM common.question_additional_info
    WHERE pack_id = ${packId}
`;
    try {
        const res = await listAdditionalInfoKeys;
        return { keys: res.map((r) => r.key) } as ListAdditionalInfoKeysResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface ListAdditionalInfoValuesResp {
    values: string[]
}

export async function listAdditinalInfoValues(key: string, packId: string) {
    console.log("listing values", key, packId);
    return await listAdditinalInfoValuesHandler(key, packId);
}

async function listAdditinalInfoValuesHandler(key: string, packId: string) {
    const listAdditinalInfoValues = sql`
SELECT
        DISTINCT value 
    FROM common.question_additional_info
    WHERE key = ${key} AND pack_id = ${packId}
`;
    try {
        const res = await listAdditinalInfoValues;
        return { values: res.map((r) => r.value) } as ListAdditionalInfoValuesResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface ListAllTagsResp {
    tags: string[]
}

export async function listAllTags(packId: string) {
    console.log("list all tags");
    return await listAllTagsHandler(packId);
}

async function listAllTagsHandler(packId: string) {
    const listAll = sql`
SELECT 
        DISTINCT tag
    FROM common.question_tags
    WHERE pack_id = ${packId}
`;
    try {
        const res = await listAll;
        console.log("res:", res);
        return { tags: res.map((r) => r.tag) } as ListAllTagsResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

interface GetQuestionHistoryResp {
    history: Record<string, string>[]
}

export async function getQuestionHistory(questionId: string) {
    console.log("get history", questionId);
    return await getQuestionHistoryHandler(questionId);
}

async function getQuestionHistoryHandler(questionId: string) {
    const getHistory = sql`
        SELECT 
            created_at,
            operation,
            prev_value,
            current_value,
            user_id
        FROM common.question_history
        WHERE question_id = ${questionId}
        ORDER BY created_at DESC
    `
    try {
        const resp = await getHistory;
        return { history: resp } as GetQuestionHistoryResp;
    } catch (error) {
        console.error(error);
        throw error;
    }
}