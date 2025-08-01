import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { DocumentPack, Message, Personality, QuestionPack } from "../types";
import { useChatTitle } from "./use-chat-title";
import { useDefaultPersonality } from "./use-default-personality";
import { useMessageHistory } from "./use-message-history";
import { useQueryClient } from "@tanstack/react-query";
import { ListChatsResp } from "@/components/chat-sidebar/chat-sidebar-actions";
import { useToast } from "./use-toast";

export function useSocketHandlers(
  socket: Socket | null,
  setInitialized: Dispatch<SetStateAction<boolean>>,
  id: string | null | undefined,
  userId: string,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setCurrentContext: Dispatch<SetStateAction<string | undefined | null>>,
  setSelectedPersonality: Dispatch<SetStateAction<Personality | undefined>>,
  dispatch: Dispatch<any>,
  setSelectedDocuments: Dispatch<SetStateAction<string[]>>,
  setSelectedQuestionPack: Dispatch<SetStateAction<QuestionPack | null>>,
  setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>
) {
  const toastIdMapping = useRef<Record<string, string>>({});
  const movedUp = useRef(false);
  const chatTitle = useChatTitle(userId, id);
  const chatTitleRef = useRef<string | null>(null);
  const defaultPersonality = useDefaultPersonality(userId);
  const messageHistory = useMessageHistory(userId, id);
  const queryClient = useQueryClient();
  const moveChatUp = async (respId: string) => {
    // console.log("moving chat up");
    await queryClient.setQueryData(
      ["listChats", userId],
      (old: ListChatsResp) => {
        if (!old || !old?.chats) {
          return;
        }
        const index = old.chats.findIndex((chat) => chat.id === respId);
        if (index === -1) {
          return old;
        }
        let newChats = [...old.chats];
        const [chat] = newChats.splice(index, 1);
        newChats.unshift(chat);
        return { chats: newChats };
      }
    );
    movedUp.current = true;
  };
  const { toast, dismiss } = useToast();

  useEffect(() => {
    const initializeChat = async () => {
      // console.log("init chat");
      try {
        // console.log("id got updated");
        dispatch({ type: "ADD_CHAT", id: id });
        const titleResp = await chatTitle.refetch();
        if (titleResp.data?.title) {
          chatTitleRef.current = titleResp.data.title;
        }
        const resp = await messageHistory.refetch();
        const messages = resp.data?.messages;
        if (messages && !resp.error && messages.length) {
          setMessages(messages);
          const lastMessage = messages[messages.length - 1];
          setCurrentContext(lastMessage.context);
          const lastUserMessage =
            lastMessage.role === "user"
              ? lastMessage
              : messages[messages.length - 2];
          if (lastUserMessage.data) {
            const data = lastUserMessage.data;
            setSelectedPersonality((old) =>
              data.personality ? data.personality : old
            );
          }
        } else {
          setMessages([]);
          setCurrentContext(null);
          if (
            !defaultPersonality.isFetching &&
            defaultPersonality.data?.personality
          ) {
            setSelectedPersonality(defaultPersonality.data.personality);
          }
        }
        socket?.emit("join_chat_room", { room_id: id });
        setInitialized(true);
        // console.log("Initialized with chat id");
      } catch (error) {
        console.error("Error during chat initialization:", error);
      }
    };
    setInitialized(false);
    initializeChat().then(() => {
      setTimeout(() => setInitialized(true), 100);
    });
    return () => {
      // setMessages([]);
      setSelectedDocuments([]);
      setSelectedPersonality(defaultPersonality.data?.personality);
      setInitialized(false);
      chatTitleRef.current = null;
      movedUp.current = false;
      setCurrentContext(null);
      setSelectedQuestionPack(null);
      setSelectedDocumentPack(null);
    };
  }, [id, socket]);

  useEffect(() => {
    if (!socket) {
      // console.log("no socket found");
      return;
    }
    // console.log("connected", socket.connected);
    const handleConnect = () => {
      // console.log("Connected to server");
      // toast({ title: "Connected to chat server" });
      socket?.emit("join_chat_room", { room_id: id });
      // setWait(false);
    };

    const handleDisconnect = (reason: any, details: any) => {
      console.log("Disconnected from server", reason, details);
      // setWait(true);
      dispatch({ type: "DISCONNECT" });
    };
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.io.on("reconnect_attempt", () => {
      console.warn("Attempting to reconnect...");
    });

    socket.io.on("reconnect", (attemptNumber) => {
      socket?.emit("join_chat_room", { room_id: id });
      console.log(`Reconnected to server after ${attemptNumber} attempts`);
    });

    return () => {
      // Clean up listeners
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect_attempt");
      socket.off("reconnect");
    };
  }, [socket, userId, id]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.on("autogen_chat_title", async (resp: Record<string, string>) => {
      if (resp["chat_id"] === id) {
        chatTitleRef.current = resp.title;
      }
      await queryClient.setQueryData(
        ["listChats", userId],
        (old: ListChatsResp) => {
          return {
            chats: old.chats.map((c) => {
              if (c.id === resp["chat_id"]) {
                return {
                  ...c,
                  title: resp["new_title"],
                  updatedAt: new Date(),
                };
              }
              return c;
            }),
          };
        }
      );
    });

    // Reattach message-related listeners
    socket.on("server_message", (resp: Message | undefined) => {
      // console.log("server message", resp);
      if (!resp) {
        return;
      }
      if (resp.content && "text" in resp.content[0]) {
        if (resp.content[0].text === "<done>") {
          dispatch({
            type: "UPDATE_CHAT_STATUS",
            id: resp.chatId,
            status: false,
          });
          if (!movedUp.current && chatTitleRef.current) {
            moveChatUp(resp.chatId);
          }
          return;
        } else if (resp.content[0].text === "<queued>") {
          console.log("message is queued");
          const { id } = toast({
            title: "Message queued",
            description: "There is another generation in progress, once completed your message will be processed",
            duration: Infinity,
          });
          toastIdMapping.current[resp.chatId] = id;
          return;
        } else if (resp.content[0].text === "<start>") {
          console.log("message is now being processed");
          dismiss(toastIdMapping.current[resp.chatId]);
          delete toastIdMapping.current[resp.chatId];
          return;
        }

      }
      if (resp.chatId !== id) {
        return;
      }

      setCurrentContext((resp as Message)?.context);
      setMessages((currentMessages) => {
        // we must have at least one message to receive a response on it
        // console.log("resp id", (resp as Message).id);
        if (!currentMessages) {
          return [];
        }
        if (
          currentMessages[currentMessages.length - 1]?.id ===
          (resp as Message).id
        ) {
          return currentMessages.slice(0, -1).concat(resp as Message);
        }
        return currentMessages.concat(resp as Message);
      });
    });

    socket.on("chat_broadcast", (msg: Message) => {
      dispatch({
        type: "UPDATE_CHAT_STATUS",
        id: msg.chatId,
        status: true,
      });
      setMessages((currentMessages) => [...(currentMessages || []), msg]);
      setCurrentContext(msg.context);
    });
    return () => {
      socket.off("server_message");
      socket.off("chat_broadcast");
      socket.off("autogen_chat_title");
    };
  }, [socket, id, userId]);
}
