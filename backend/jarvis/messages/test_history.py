import pytest
import datetime
from collections import defaultdict
from jarvis.messages.history import ChatHistory, HistoryHandler


def test_chat_history_init():
    ch = ChatHistory(system_message="Hello")
    assert ch.system_message == "Hello"
    assert isinstance(ch.messages, defaultdict)
    assert ch.deletion_timestamp is None


def test_add_and_get_message():
    ch = ChatHistory()
    ch.add_message({"id": "msg1", "content": "Hi"})
    assert ch["msg1"] == [{"id": "msg1", "content": "Hi"}]
    assert "msg1" in ch
    assert "msg2" not in ch


def test_delete_message():
    ch = ChatHistory()
    ch.messages["msg1"].append({"id": "msg1", "content": "Hi"})
    del ch["msg1"]
    assert "msg1" not in ch


def test_add_system_message_chat_history():
    ch = ChatHistory()
    ch.add_system_message("System")
    assert ch.system_message == "System"


def test_add_deletion_timestamp():
    ch = ChatHistory()
    assert ch.deletion_timestamp is None
    ch.add_deletion_timestamp()
    assert ch.deletion_timestamp is not None
    # Should not update if already set
    old = ch.deletion_timestamp
    ch.add_deletion_timestamp()
    assert ch.deletion_timestamp == old


@pytest.mark.asyncio
async def test_add_and_remove_chat():
    hh = HistoryHandler()
    await hh.add_chat("chat1", "sys")
    assert "chat1" in hh.state
    assert hh.state["chat1"].system_message == "sys"

    await hh.remove_message("chat1", "msg1")  # Should not fail if msg1 doesn't exist


@pytest.mark.asyncio
async def test_add_message():
    hh = HistoryHandler()
    await hh.add_chat("chat2")
    msg = {"id": "msg2", "content": "Hello"}
    await hh.add_message("chat2", msg)
    assert hh.state["chat2"]["msg2"][0]["content"] == "Hello"


@pytest.mark.asyncio
async def test_remove_message():
    hh = HistoryHandler()
    await hh.add_chat("chat3")
    msg = {"id": "msg3", "content": "Bye"}
    await hh.add_message("chat3", msg)
    await hh.remove_message("chat3", "msg3")
    assert "msg3" not in hh.state["chat3"]


@pytest.mark.asyncio
async def test_add_system_message_history_handler():
    hh = HistoryHandler()
    await hh.add_chat("chat4")
    await hh.add_system_message("chat4", "new sys")
    assert hh.state["chat4"].system_message == "new sys"


@pytest.mark.asyncio
async def test_unload_chat_sets_deletion_timestamp():
    hh = HistoryHandler()
    await hh.add_chat("chat5")
    await hh.unload_chat("chat5")
    assert hh.state["chat5"].deletion_timestamp is not None


@pytest.mark.asyncio
async def test_deletion_worker_removes_expired():
    hh = HistoryHandler()
    await hh.add_chat("chat6")
    await hh.unload_chat("chat6")
    hh.state["chat6"].deletion_timestamp = datetime.datetime.now(
        datetime.timezone.utc
    ) - datetime.timedelta(minutes=20)
    await hh._deletion_worker()
    assert "chat6" not in hh.state
