"use client";

import { uuidv4 } from "@/lib/utils";

export function chatGeneratingReducer(
  state: Record<string, boolean>,
  action: any
) {
  let newState = null;
  switch (action.type) {
    case "ADD_CHAT":
      const chatId = action["id"] as string;
      newState = { ...state };
      newState[chatId] = false;
      return newState;
    case "UPDATE_CHAT_STATUS":
      newState = { ...state };
      newState[action.id] = action.status;
      return newState;
    case "DISCONNECT":
      newState = {} as Record<string, boolean>;
      for (const [key, _] of Object.entries(state)) {
        newState[key] = false;
      }
      return newState;
    default:
      return state;
  }
}

export function chatIdReducer(state: string | null, action: any) {
  switch (action.type) {
    case "UPDATE_ID":
      return action.payload;
    case "RESET_ID":
      return uuidv4();
    default:
      return state;
  }
}
