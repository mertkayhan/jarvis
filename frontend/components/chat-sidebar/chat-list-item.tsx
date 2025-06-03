"use client";

import { UserChat } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { SidebarActions } from "./sidebar-actions";
import { motion } from "framer-motion";
import { Dispatch, useState } from "react";

interface ChatListItemProps {
  chat: UserChat;
  path: string;
  i: number;
  userId: string;
  id?: string | null;
  dispatch: Dispatch<any>;
}

export function ChatListItem({
  chat,
  path,
  i,
  userId,
  id,
  dispatch,
}: ChatListItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <TooltipProvider>
      <Tooltip>
        <div className="flex w-20 md:w-full">
          <TooltipTrigger asChild>
            <div
              className={`${chat.id === id ? "bg-slate-200 dark:bg-slate-800" : "bg-background"} flex group hover:cursor-pointer w-full flex-col gap-y-2 rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-slate-200 focus:outline-none dark:hover:bg-slate-800`}
              onClick={() => {
                dispatch({ type: "UPDATE_ID", payload: chat.id });
              }}
              key={i}
            >
              <div className="relative w-full flex flex-1" key={i}>
                <motion.div
                  key={chat.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1
                    className={`max-w-20 ${open ? "md:max-w-40" : "md:max-w-48 group-hover:md:max-w-40"} text-xs font-medium capitalize text-slate-700 dark:text-slate-200 relative max-h-5 select-none truncate break-all`}
                  >
                    {chat.title ?? "Untitled"}
                  </h1>
                </motion.div>
                <div
                  className={`
                    absolute right-1 flex items-center
                    transition-opacity duration-200 ease-in-out
                    ${
                      open
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    }
                  `}
                >
                  <SidebarActions
                    path={path}
                    chat={chat}
                    userId={userId}
                    dispatch={dispatch}
                    open={open}
                    setOpen={setOpen}
                  />
                </div>
              </div>
              <p className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400">
                {formatDistanceToNow(chat.updatedAt, {
                  addSuffix: true,
                  includeSeconds: true,
                })}
              </p>
            </div>
          </TooltipTrigger>
        </div>
        <TooltipContent>{chat.title ?? "Untitled"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
