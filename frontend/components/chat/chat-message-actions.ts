'use server'

import postgres from "postgres";

const uri = process.env.DB_URI || "unknown";
const sql = postgres(uri, { connection: { application_name: "Jarvis" } });


export async function updateMessageLike(msgID: string, liked: boolean | null) {
  console.log("updating like", liked, msgID);
  await updateMessageLikeHandler(msgID, liked);

}

async function updateMessageLikeHandler(id: string, liked: boolean | null) {
  try {
    const res = await sql.begin((sql) => [
      sql`
      UPDATE common.message_history
      SET liked = ${liked}
      WHERE id = ${id}
      RETURNING id
      `
    ]);
    console.log("res:", res);
  } catch (error) {
    console.error(error);
    return { error: "failed to update message like" };
  }
}