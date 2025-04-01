from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()


@app.get("/api/v1/users/{user_id}/chats/{chat_id}/messages")
async def get_chat_messages(user_id: str, chat_id: str, deleted: bool = False):
    pass


@app.get("/api/v1/users/{user_id}/chats")
async def get_user_chats(user_id: str, deleted: bool = False):
    pass


@app.get("/api/v1/users/{user_id}/document-packs")
async def get_user_document_packs(user_id: str, deleted: bool = False):
    pass


class DocumentPack(BaseModel):
    document_pack_id: str
    name: str
    description: str


@app.post("/api/v1/users/{user_id}/document-packs")
async def create_document_pack(user_id: str, payload: DocumentPack):
    pass


@app.put("/api/v1/users/{user_id}/document-packs/{document_pack_id}")
async def update_document_pack(
    user_id: str, document_pack_id: str, payload: DocumentPack
):
    pass


@app.delete("/api/v1/users/{user_id}/document-packs/{document_pack_id}")
async def delete_document_pack(user_id: str, document_pack_id: str):
    pass


@app.get("/api/v1/users/{user_id}/chats/{chat_id}")
async def get_chat(user_id: str, chat_id: str):
    pass


@app.delete("/api/v1/users/{user_id}/chats/{chat_id}/messages/{message_id}")
async def delete_message(user_id: str, chat_id: str, message_id: str):
    pass


@app.delete("/api/v1/users/{user_id}/chats")
async def delete_all_user_chats(user_id: str):
    pass


class ChatTitleUpdate(BaseModel):
    new_title: str


@app.patch("/api/v1/users/{user_id}/chats/{chat_id}/title")
async def update_chat_title(user_id: str, chat_id: str, payload: ChatTitleUpdate):
    pass


@app.delete("/api/v1/users/{user_id}/chats/{chat_id}")
async def delete_chat(user_id: str, chat_id: str):
    pass


@app.get("/api/v1/users/{user_id}/docs")
async def get_user_docs(user_id: str, deleted: bool = False):
    pass


@app.delete("/api/v1/users/{user_id}/docs/{doc_id}")
async def delete_doc(user_id: str, doc_id: str):
    pass


@app.get("/api/v1/users/{user_id}/model-selection")
async def get_user_model_selection(user_id: str):
    pass


class UserModelSelection(BaseModel):
    model_name: str


@app.post("/api/v1/users/{user_id}/model-selection")
async def set_user_model_selection(user_id: str, payload: UserModelSelection):
    pass


@app.get("/api/v1/users/{user_id}/personalities")
async def get_user_personalities(user_id: str):
    pass


class UserPersonality(BaseModel):
    personality_id: str
    # TODO:


@app.post("/api/v1/users/{user_id}/personalities")
async def create_personality(user_id: str, payload: UserPersonality):
    pass


@app.delete("/api/v1/users/{user_id}/personalities/{personality_id}")
async def delete_personality(user_id: str, personality_id: str):
    pass


@app.put("/api/v1/users/{user_id}/personalities/{personality_id}")
async def update_personality(
    user_id: str, personality_id: str, payload: UserPersonality
):
    pass


@app.post("/api/v1/global/personalities/{personality_id}/global")
async def make_personality_global(personality_id: str):
    pass


@app.post("/api/v1/users/{user_id}/personalities/{personality_id}/default")
async def make_personality_default(user_id: str, personality_id: str):
    pass


@app.delete("/api/v1/users/{user_id}/personalities/{personality_id}/default")
async def unset_default_personality(user_id: str, personality_id: str):
    pass


@app.get("/api/v1/users/{user_id}/personalities/default")
async def get_default_personality(user_id: str):
    pass


class QuestionPack(BaseModel):
    question_pack_id: str
    name: str
    description: str


@app.post("/api/v1/users/{user_id}/question-packs")
async def create_question_pack(user_id: str, payload: QuestionPack):
    pass


@app.get("/api/v1/users/{user_id}/question-packs")
async def get_user_question_packs(user_id: str, deleted: bool = False):
    pass


@app.delete("/api/v1/users/{user_id}/question-packs/{question_pack_id}")
async def delete_question_pack(user_id: str, question_pack_id: str):
    pass


@app.put("/api/v1/users/{user_id}/question-packs/{question_pack_id}")
async def update_question_pack(
    user_id: str, question_pack_id: str, payload: QuestionPack
):
    pass


@app.get("/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions")
async def get_question_pack_questions(
    user_id: str, question_pack_id: str, deleted: bool = False
):
    pass


class Question(BaseModel):
    question: str


@app.post("/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions")
async def create_question(user_id: str, question_pack_id: str, payload: Question):
    pass


@app.delete(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}"
)
async def delete_question(user_id: str, question_pack_id: str, question_id: str):
    pass


class Answer(BaseModel):
    answer: str


@app.patch(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/answer"
)
async def update_answer(
    user_id: str, question_pack_id: str, question_id: str, payload: Answer
):
    pass


@app.patch(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/question"
)
async def update_question(
    user_id: str, question_pack_id: str, question_id: str, payload: Question
):
    pass


@app.get(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/tags"
)
async def get_question_tags(user_id: str, question_pack_id: str, question_id: str):
    pass


class Tag(BaseModel):
    tag: str
    tag_id: str


@app.post(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/tags"
)
async def create_question_tag(
    user_id: str, question_pack_id: str, question_id: str, payload: Tag
):
    pass


@app.delete(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/tags/{tag_id}"
)
async def delete_question_tag(
    user_id: str, question_pack_id: str, question_id: str, tag_id: str
):
    pass


@app.get(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/additional-info"
)
async def get_question_additional_info(
    user_id: str, question_pack_id: str, question_id: str
):
    pass


class AdditionalInfo(BaseModel):
    id: str
    key: str
    value: str


@app.post(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/additional-info"
)
async def create_question_additional_info(
    user_id: str, question_pack_id: str, question_id: str, payload: AdditionalInfo
):
    pass


@app.delete(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/additional-info/{additional_info_id}"
)
async def delete_question_additional_info(
    user_id: str, question_pack_id: str, question_id: str, additional_info_id: str
):
    pass


@app.get(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/additional-info/filterable-keys"
)
async def get_additional_info_keys(user_id: str, question_pack_id: str):
    pass


@app.get(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/additional-info/filterable-values"
)
async def get_additional_info_values(user_id: str, question_pack_id: str):
    pass


@app.get("/api/v1/users/{user_id}/question-packs/{question_pack_id}/filterable-tags")
async def get_all_tags(user_id: str, question_pack_id: str):
    pass


@app.get(
    "/api/v1/users/{user_id}/question-packs/{question_pack_id}/questions/{question_id}/history"
)
async def get_question_history(user_id: str, question_pack_id: str, question_id: str):
    pass
