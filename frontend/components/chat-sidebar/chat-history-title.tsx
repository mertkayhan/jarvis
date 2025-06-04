"use client";

import { UserChat } from "@/lib/types";
import { Button } from "../ui/button";
import { ClearHistory } from "./clear-history";
import { Dispatch } from "react";

interface ListTitleProps {
  chats: UserChat[] | undefined;
  userId: string;
  dispatch: Dispatch<any>;
}

export function ListTitle({ chats, userId, dispatch }: ListTitleProps) {
  return (
    <div className="flex w-full">
      <div className="flex flex-col w-full px-2">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="w-full justify-start text-slate-500 dark:text-slate-400 dark:hover:text-slate-50"
          onClick={async () => {
            dispatch({ type: "RESET_ID" });
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="hidden md:block h-4 w-4"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M8 9h8"></path>
            <path d="M8 13h6"></path>
            <path d="M12.01 18.594l-4.01 2.406v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v5.5"></path>
            <path d="M16 19h6"></path>
            <path d="M19 16v6"></path>
          </svg>
          <p className="px-2">New Chat</p>
        </Button>
        <ClearHistory
          isEnabled={(chats?.length || 0) > 0}
          userId={userId}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
}
