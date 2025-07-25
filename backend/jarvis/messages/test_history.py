from typing import cast
import pytest
import datetime
from collections import defaultdict
from jarvis.messages.history import ChatHistory, HistoryHandler
from jarvis.messages.type import Message


def test_chat_history_init():
    msg = cast(Message, {"content": {"logicalType": "text", "data": "Hello"}})
    ch = ChatHistory(system_message=msg)
    assert ch.system_message == msg
    assert isinstance(ch.messages, defaultdict)
    assert ch.deletion_timestamp is None


@pytest.mark.asyncio
async def test_add_and_get_message():
    ch = ChatHistory()
    msg = cast(
        Message, {"id": "msg1", "content": {"logicalType": "text", "data": "Hi"}}
    )
    await ch.add_message(
        msg,
        "session 1",
    )
    assert ch["msg1"] == [msg]
    assert "msg1" in ch
    assert "msg2" not in ch


def test_delete_message():
    ch = ChatHistory()
    ch.messages["msg1"].append({"id": "msg1", "content": "Hi"})
    del ch["msg1"]
    assert "msg1" not in ch


def test_add_system_message_chat_history():
    ch = ChatHistory()
    msg = cast(Message, {"content": {"logicalType": "text", "data": "System"}})
    ch.add_system_message(msg)
    assert ch.system_message == msg


@pytest.mark.asyncio
async def test_add_deletion_timestamp():
    ch = ChatHistory()
    assert ch.deletion_timestamp is None
    await ch.add_deletion_timestamp("session 1")
    assert ch.deletion_timestamp is not None
    # Should not update if already set
    old = ch.deletion_timestamp
    await ch.add_deletion_timestamp("session 1")
    assert ch.deletion_timestamp == old


@pytest.mark.asyncio
async def test_add_and_remove_chat():
    hh = HistoryHandler()
    msg = cast(Message, {"content": {"logicalType": "text", "data": "sys"}})
    await hh.add_chat("chat1", msg)
    assert "chat1" in hh.state
    assert hh.state["chat1"].system_message == msg

    await hh.remove_message("chat1", "msg1")  # Should not fail if msg1 doesn't exist


@pytest.mark.asyncio
async def test_add_message():
    hh = HistoryHandler()
    await hh.add_chat("chat2")
    msg = cast(
        Message, {"id": "msg2", "content": {"logicalType": "text", "data": "Hello"}}
    )
    await hh.add_message("chat2", msg, "session 1")
    assert hh.state["chat2"]["msg2"][0]["content"]["data"] == "Hello"


@pytest.mark.asyncio
async def test_remove_message():
    hh = HistoryHandler()
    await hh.add_chat("chat3")
    msg = cast(
        Message, {"id": "msg3", "content": {"logicalType": "text", "data": "Bye"}}
    )
    await hh.add_message("chat3", msg, "session 1")
    await hh.remove_message("chat3", "msg3")
    assert "msg3" not in hh.state["chat3"]


@pytest.mark.asyncio
async def test_add_system_message_history_handler():
    hh = HistoryHandler()
    await hh.add_chat("chat4")
    msg = cast(Message, {"content": {"logicalType": "text", "data": "new sys"}})
    await hh.add_system_message("chat4", msg)
    assert hh.state["chat4"].system_message == msg


@pytest.mark.asyncio
async def test_unload_chat_sets_deletion_timestamp():
    hh = HistoryHandler()
    await hh.add_chat("chat5")
    await hh.unload_chat("chat5", "session 1")
    assert hh.state["chat5"].deletion_timestamp is not None


@pytest.mark.asyncio
async def test_deletion_worker_removes_expired():
    hh = HistoryHandler()
    await hh.add_chat("chat6")
    await hh.unload_chat("chat6", "session 1")
    hh.state["chat6"].deletion_timestamp = datetime.datetime.now(
        datetime.timezone.utc
    ) - datetime.timedelta(minutes=20)
    await hh._deletion_worker()
    assert "chat6" not in hh.state


@pytest.mark.asyncio
async def test_subscriber_add_and_remove():
    ch = ChatHistory()
    await ch.add_subscribers("sid1")
    await ch.add_subscribers("sid2")
    assert "sid1" in ch.subscribers
    assert "sid2" in ch.subscribers

    await ch.remove_subscribers("sid1")
    assert "sid1" not in ch.subscribers
    assert "sid2" in ch.subscribers


@pytest.mark.asyncio
async def test_add_deletion_timestamp_only_when_no_subscribers():
    ch = ChatHistory()
    await ch.add_subscribers("sid1")
    await ch.add_subscribers("sid2")
    await ch.add_deletion_timestamp("sid1")
    # Should not set deletion_timestamp because sid2 is still a subscriber
    assert ch.deletion_timestamp is None

    await ch.remove_subscribers("sid2")
    # Now no subscribers left, should set deletion_timestamp
    await ch.add_deletion_timestamp("sid2")
    assert ch.deletion_timestamp is not None


@pytest.mark.asyncio
async def test_remove_nonexistent_subscriber_does_not_raise():
    ch = ChatHistory()
    # Should not raise
    await ch.remove_subscribers("not-there")
    assert True


@pytest.mark.asyncio
async def test_multiple_sessions_unload_chat():
    hh = HistoryHandler()
    await hh.add_chat("chat7")
    # Simulate two sessions
    await hh.add_message(
        "chat7",
        cast(Message, {"id": "msg1", "content": {"logicalType": "text", "data": "hi"}}),
        "sid1",
    )
    await hh.add_message(
        "chat7",
        cast(Message, {"id": "msg2", "content": {"logicalType": "text", "data": "yo"}}),
        "sid2",
    )
    ch = hh.state["chat7"]
    assert "sid1" in ch.subscribers
    assert "sid2" in ch.subscribers

    # Unload one session, should not set deletion timestamp
    await hh.unload_chat("chat7", "sid1")
    assert ch.deletion_timestamp is None

    # Unload the other, now should set deletion timestamp
    await hh.unload_chat("chat7", "sid2")
    assert ch.deletion_timestamp is not None


@pytest.mark.asyncio
async def test_deletion_worker_does_not_remove_active_chats():
    hh = HistoryHandler()
    await hh.add_chat("chat8")
    await hh.add_message(
        "chat8",
        cast(Message, {"id": "msg1", "content": {"logicalType": "text", "data": "hi"}}),
        "sid1",
    )
    # No deletion timestamp set
    await hh._deletion_worker()
    assert "chat8" in hh.state


@pytest.mark.asyncio
async def test_move_to_end_on_message_and_remove():
    hh = HistoryHandler()
    await hh.add_chat("chat9")
    await hh.add_chat("chat10")
    await hh.add_message(
        "chat9",
        cast(Message, {"id": "msg1", "content": {"logicalType": "text", "data": "hi"}}),
        "sid1",
    )
    await hh.add_message(
        "chat10",
        cast(Message, {"id": "msg2", "content": {"logicalType": "text", "data": "yo"}}),
        "sid2",
    )
    # chat10 should be at the end after last message
    assert list(hh.state.keys())[-1] == "chat10"
    await hh.remove_message("chat9", "msg1")
    # chat9 should now be at the end
    assert list(hh.state.keys())[-1] == "chat9"


@pytest.mark.asyncio
async def test_add_chat_does_not_overwrite_existing():
    hh = HistoryHandler()
    msg1 = cast(Message, {"content": {"logicalType": "text", "data": "sys1"}})
    msg2 = cast(Message, {"content": {"logicalType": "text", "data": "sys2"}})
    await hh.add_chat("chat11", msg1)
    await hh.add_chat("chat11", msg2)
    # Should not overwrite
    assert hh.state["chat11"].system_message == msg1


@pytest.mark.asyncio
async def test_add_system_message_only_if_exists():
    hh = HistoryHandler()
    msg = cast(Message, {"content": {"logicalType": "text", "data": "sys"}})
    await hh.add_system_message("not-there", msg)
    # Should not raise and not add
    assert "not-there" not in hh.state


@pytest.mark.asyncio
async def test_unload_chat_moves_to_front():
    hh = HistoryHandler()
    await hh.add_chat("chat12")
    await hh.add_chat("chat13")
    await hh.unload_chat("chat13", "sid1")
    # chat13 should now be at the front
    assert list(hh.state.keys())[0] == "chat13"
