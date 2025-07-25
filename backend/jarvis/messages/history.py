from collections import OrderedDict, defaultdict
import datetime
from typing import Any, Optional, cast
import asyncio

from jarvis.messages.type import Message


class ChatHistory:
    def __init__(self, system_message: Optional[Message] = None):
        self.system_message: Optional[Message] = system_message
        self.messages: defaultdict[str, list] = defaultdict(list)
        self.deletion_timestamp: Optional[datetime.datetime] = None
        # chats can be shared - set of session ids to store subscribers to a chat
        self.subscribers: set[str] = set()
        self.lock = asyncio.Lock()

    def __str__(self) -> str:
        return f"system_message={self.system_message} messages={self.messages} deletion_timestamp={self.deletion_timestamp}"

    async def add_message(self, message: Message, sid: str):
        await self.add_subscribers(sid)
        self.messages[message["id"]].append(message)

    def __getitem__(self, message_id: str) -> list:
        return self.messages.get(message_id, [])

    def __contains__(self, message_id: str) -> bool:
        return message_id in self.messages

    def __delitem__(self, message_id: str):
        if message_id in self.messages:
            del self.messages[message_id]

    def add_system_message(self, system_message: Message):
        self.system_message = system_message

    async def add_deletion_timestamp(self, sid: str):
        async with self.lock:
            await self.remove_subscribers(sid)
            if len(self.subscribers) == 0 and not self.deletion_timestamp:
                self.deletion_timestamp = datetime.datetime.now(
                    datetime.timezone.utc
                ) + datetime.timedelta(minutes=15)

    async def add_subscribers(self, sid: str):
        self.subscribers.add(sid)

    async def remove_subscribers(self, sid: str):
        self.subscribers.discard(sid)


class HistoryHandler:
    _state: OrderedDict[str, ChatHistory] = OrderedDict()
    _lock = asyncio.Lock()

    @property
    def state(self) -> OrderedDict[str, ChatHistory]:
        return self._state

    async def start_deletion_worker(self):
        asyncio.create_task(self.deletion_worker(), name="deletion_worker")

    @property
    def deletion_worker_running(self):
        return any(task.get_name() == "deletion_worker" for task in asyncio.all_tasks())

    def get_chat_history(self, chat_id: str):
        return self._state.get(chat_id)

    async def add_message(self, chat_id: str, message: Message, sid: str):
        async with self._lock:
            if not self.deletion_worker_running:
                await self.start_deletion_worker()
            if chat_id in self._state:
                await self._state[chat_id].add_message(message, sid)
                self._state.move_to_end(chat_id)

    async def remove_message(self, chat_id: str, message_id: str):
        async with self._lock:
            if not self.deletion_worker_running:
                await self.start_deletion_worker()
            if chat_id in self._state and message_id in self._state[chat_id]:
                del self._state[chat_id][message_id]
                self._state.move_to_end(chat_id)

    async def add_chat(self, chat_id: str, system_message: Optional[Message] = None):
        async with self._lock:
            if not self.deletion_worker_running:
                await self.start_deletion_worker()
            if chat_id not in self._state:
                self._state[chat_id] = ChatHistory(system_message=system_message)

    async def add_system_message(self, chat_id: str, system_message: Message):
        async with self._lock:
            if not self.deletion_worker_running:
                await self.start_deletion_worker()
            if chat_id in self._state:
                self._state[chat_id].add_system_message(system_message)

    def load_chat(self, chat_id: str):
        pass

    async def unload_chat(self, chat_id: str, sid: str):
        async with self._lock:
            if not self.deletion_worker_running:
                await self.start_deletion_worker()
            if chat_id in self._state:
                await self._state[chat_id].add_deletion_timestamp(sid)
                self._state.move_to_end(chat_id, last=False)

    async def _deletion_worker(self):
        async with self._lock:
            keys = list(self._state.keys())
            now = datetime.datetime.now(datetime.timezone.utc)

            for key in keys:
                # keys are ordered
                if self._state[key].deletion_timestamp is None:
                    break
                if cast(datetime.datetime, self._state[key].deletion_timestamp) <= now:
                    del self._state[key]

    async def deletion_worker(self):
        while True:
            await self._deletion_worker()
            await asyncio.sleep(60)
