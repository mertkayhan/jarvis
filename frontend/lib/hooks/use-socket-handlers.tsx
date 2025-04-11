import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { DocumentPack, Message, Personality, QuestionPack } from "../types";
import { useToast } from "./use-toast";
import { useChatTitle } from "./use-chat-title";
import { useDefaultPersonality } from "./use-default-personality";
import { useMessageHistory } from "./use-message-history";
import { useQueryClient } from "@tanstack/react-query";
import { defaultSystemPrompt } from "../prompt-template";
import { ListChatsResp } from "@/components/chat-sidebar/chat-sidebar-actions";

export function useSocketHandlers(
    socket: Socket | null,
    setInitialized: Dispatch<SetStateAction<boolean>>,
    id: string | null | undefined,
    userId: string,
    setMessages: Dispatch<SetStateAction<Message[]>>,
    setCurrentContext: Dispatch<SetStateAction<string | undefined | null>>,
    setSelectedPersonality: Dispatch<SetStateAction<Personality>>,
    dispatch: Dispatch<any>,
    setSelectedDocuments: Dispatch<SetStateAction<string[]>>,
    setSelectedQuestionPack: Dispatch<SetStateAction<QuestionPack | null>>,
    setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>
) {
    const movedUp = useRef(false);
    const { toast } = useToast();
    const chatTitle = useChatTitle(id);
    const chatTitleRef = useRef<string | null>(null);
    const defaultPersonality = useDefaultPersonality(userId);
    const messageHistory = useMessageHistory(userId, id);
    const queryClient = useQueryClient();
    const moveChatUp = async (respId: string) => {
        // console.log("moving chat up");
        await queryClient.setQueryData(["listChats", userId], (old: ListChatsResp) => {
            if (!old || !old?.chats) {
                return;
            }
            const index = old.chats.findIndex(chat => chat.id === respId);
            if (index === -1) {
                return old;
            }
            let newChats = [...old.chats];
            const [chat] = newChats.splice(index, 1);
            newChats.unshift(chat);
            return { chats: newChats };
        });
        movedUp.current = true;
    };

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
                if (messages && !resp.error) {
                    setMessages(messages);
                    if (messages.length) {
                        const lastMessage = messages[messages.length - 1];
                        setCurrentContext(lastMessage.context);
                        const lastUserMessage = (lastMessage.role === "user") ? lastMessage : messages[messages.length - 2];
                        if (lastUserMessage.data) {
                            const data = JSON.parse(lastUserMessage.data);
                            setSelectedPersonality(data.personality || defaultSystemPrompt);
                        }
                    } else {
                        setCurrentContext(null);
                        if (!defaultPersonality.isFetching && defaultPersonality.data?.personality) {
                            setSelectedPersonality(defaultPersonality.data.personality);
                        }
                    }
                }
                socket?.emit("join_chat_room", { "room_id": id });
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
            setMessages([]);
            setSelectedDocuments([]);
            setSelectedPersonality(defaultSystemPrompt);
            setInitialized(false);
            chatTitleRef.current = null;
            movedUp.current = false;
            setCurrentContext(null);
            setSelectedQuestionPack(null);
            setSelectedDocumentPack(null);
        }
    }, [id, socket]);

    useEffect(() => {
        if (!socket) {
            // console.log("no socket found");
            return;
        }
        // console.log("connected", socket.connected);
        const handleConnect = () => {
            console.log("Connected to server");
            toast({ title: "Connected to chat server" });
            // setWait(false);
        };

        const handleDisconnect = (reason: any, details: any) => {
            console.log("Disconnected from server", reason, details);
            // setWait(true);
            dispatch({ type: "DISCONNECT" });

            if (reason === "io server disconnect") {
                toast({
                    title: "Server disconnected",
                    description: "Disconnected by the server. Attempting manual reconnect...",
                    variant: "destructive"
                });
                socket.connect(); // Optional: Explicit reconnect if server disconnected
            } else if (reason === "transport close") {
                toast({
                    title: "Lost connection",
                    description: "Network issue detected. Awaiting automatic reconnect...",
                    variant: "destructive"
                });
            }
        };
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        socket.on("reconnect_attempt", () => {
            toast({ title: "Reconnecting", description: "Attempting to reconnect..." });
        });

        socket.on("reconnect", (attemptNumber) => {
            toast({
                title: "Connection success",
                description: `Reconnected to server after ${attemptNumber} attempts`
            });
        });

        return () => {
            // Clean up listeners
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnect_attempt");
            socket.off("reconnect");
        };
    }, [socket, userId]);

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.on("autogen_chat_title", async (resp: Record<string, string>) => {
            if (resp["chat_id"] === id) {
                chatTitleRef.current = resp.title;
            }
            await queryClient.setQueryData(["listChats", userId], (old: ListChatsResp) => {
                return {
                    chats: old.chats.map((c) => {
                        if (c.id === resp["chat_id"]) {
                            return { ...c, title: resp["new_title"], updatedAt: new Date() };
                        }
                        return c;
                    })
                }
            });
        });

        // Reattach message-related listeners
        socket.on("server_message", (resp: Message | undefined) => {
            // console.log("server msg", resp.context)
            // console.log("id ref:", idRef.current);
            // console.log("content", resp?.content);
            if (!resp) {
                return;
            }
            if (resp.content === "<done>" && resp.data) {
                const additionalData = JSON.parse(resp.data);
                dispatch({ type: "UPDATE_CHAT_STATUS", id: additionalData["chat_id"], status: false });
                if (!movedUp.current && chatTitleRef.current && resp.data) {
                    moveChatUp(additionalData["chat_id"]);
                }
                return;
            }
            if (resp.data) {
                const additionalData = JSON.parse(resp.data);
                if (additionalData["chat_id"] !== id) {
                    return;
                }
            }
            setCurrentContext((resp as Message)?.context)
            setMessages((currentMessages) => {
                // we must have at least one message to receive a response on it
                // console.log("resp id", (resp as Message).id);
                if (!currentMessages) {
                    return [];
                }
                if (currentMessages[currentMessages.length - 1]?.id === (resp as Message).id) {
                    return currentMessages.slice(0, -1).concat(resp as Message);
                }
                return currentMessages.concat(resp as Message)
            })
        });

        socket.on("chat_broadcast", (msg: Message) => {
            setMessages((currentMessages) => [...(currentMessages || []), msg]);
            setCurrentContext(msg.context)
        });

        return () => {
            socket.off("server_message");
            socket.off("chat_broadcast");
            socket.off("autogen_chat_title");
        }
    }, [socket, id, userId]);
}