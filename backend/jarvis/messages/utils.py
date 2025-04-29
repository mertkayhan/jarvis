from typing import Any, Dict, List, Mapping
from uuid import uuid4
from datetime import datetime
import json

from jarvis.messages.type import Message


def new_server_message(chat_id: str, user_id: str) -> Message:
    return Message(
        id=str(uuid4()),
        createdAt=datetime.now().isoformat(),
        content="",
        data=json.dumps({"chat_id": chat_id, "user_id": user_id}),
    )


def build_system_message(instruction: str) -> dict[str, Any]:
    return {"role": "system", "content": [{"type": "text", "text": instruction}]}


def build_user_message(data: Mapping) -> List[Dict[str, Any]]:
    d = json.loads(data["data"])
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": data["content"],
                },
            ],
        },
    ]
    for img_str in d["images"]:
        messages[0]["content"].append(
            {
                "type": "image_url",
                "image_url": {"url": img_str},
            },
        )
    return messages


# def skip_message(msg: str) -> bool:
#     return "@self" in msg
