"use client";

import Loading from "@/app/loading";
import ChatPage from "@/components/chat/chat-page";
import { chatIdReducer } from "@/components/chat/chat-reducers";
import { useAuthToken } from "@/lib/hooks/use-auth-token";
import { useSocket } from "@/lib/hooks/use-socket";
import { useUser } from "@auth0/nextjs-auth0/client";
import { redirect, useRouter } from "next/navigation";
import { Reducer, useEffect, useReducer } from "react";

export default function Page() {
  const { user, error, isLoading } = useUser();
  const token = useAuthToken(user?.email);
  const socket = useSocket({
    socketNamespace: "jarvis",
    userId: user?.email,
    token,
  });
  const [id, dispatch] = useReducer<Reducer<string | null, any>>(
    chatIdReducer,
    null
  );
  const router = useRouter();

  useEffect(() => {
    dispatch({ type: "RESET_ID" });
  }, []);

  if (isLoading || !id) {
    return <Loading />;
  }

  if (error) {
    router.push("/forbidden");
  }

  if (!user) {
    redirect("/api/auth/login");
  }

  return (
    <ChatPage
      path="chat"
      greeting="Hi I'm Jarvis, how can I help you?"
      moduleName="jarvis"
      title="J.A.R.V.I.S."
      socket={socket}
      id={id}
      dispatch={dispatch}
    />
  );
}
