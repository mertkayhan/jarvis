"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { listChats } from "./chat-sidebar-actions";
import { RotateLoader } from "react-spinners";
import { HiddenChatListButton } from "@/components/chat-sidebar/hide-chat-list";
import { ListTitle } from "./chat-history-title";
import { SearchBox } from "@/components/chat-sidebar/chat-history-search-box";
import { ChatListItem } from "./chat-list-item";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

interface ChatListProps {
  setShowChatList: Dispatch<SetStateAction<boolean>>;
  userId: string;
  path: string;
  id?: string | null;
  dispatch: Dispatch<any>;
}

export function ChatHistoryList({
  setShowChatList,
  userId,
  path,
  id,
  dispatch,
}: ChatListProps) {
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["listChats", userId],
    queryFn: () => listChats(userId),
    enabled: !!userId,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({ title: "Failed to list chats", variant: "destructive" });
    }
  }, [error]);

  const filteredChats =
    data?.chats.filter(
      (c) => c.title?.toLowerCase().includes(query.toLowerCase()) || !c.title
    ) || [];

  if (isLoading) {
    return (
      <div className="h-full w-24 overflow-y-auto bg-background md:w-60 flex flex-col overflow-x-hidden items-center justify-center">
        <RotateLoader color="#94a3b8" />
      </div>
    );
  }

  return (
    <div className="h-full w-24 overflow-y-auto bg-background md:w-60 flex flex-col overflow-x-hidden">
      <div className="justify-end flex items-center">
        <HiddenChatListButton setShowChatList={setShowChatList} />
      </div>
      <div className="flex items-start">
        <ListTitle chats={data?.chats} userId={userId} dispatch={dispatch} />
      </div>
      <div className="py-2 px-4">
        <SearchBox setQuery={setQuery} />
      </div>
      <div className="mx-2 space-y-1 flex-1 overflow-hidden hover:overflow-y-auto w-24 md:w-[95%]">
        {filteredChats.length ? (
          filteredChats.map((chat, i) => {
            return (
              <motion.div
                key={chat.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ChatListItem
                  key={i}
                  chat={chat}
                  path={path}
                  i={i}
                  userId={userId}
                  id={id}
                  dispatch={dispatch}
                />
              </motion.div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No chat history
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
