"use client";

import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipProvider } from "../ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";

interface HiddenChatListButtonProps {
  setShowChatList: Dispatch<SetStateAction<boolean>>;
}

export function HiddenChatListButton({
  setShowChatList,
}: HiddenChatListButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            type="button"
            onClick={() => {
              setShowChatList(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M15 3v18" />
              <path d="m10 15-3-3 3-3" />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Collapse sidebar</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
