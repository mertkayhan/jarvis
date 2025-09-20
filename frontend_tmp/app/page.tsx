"use server";

import { Chat } from "@/components/chat/chat";
import { auth0 } from "@/lib/auth0";
import { callBackend } from "@/lib/common";
import { UserChat, UserDocument } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session || !session.user.email) {
    redirect("/auth/login");
  }

  const userData = await callBackend(
    {
      endpoint: `/api/v1/user/data`,
      method: "GET",
      userId: session.user.email,
    }
  );


  return (
    <Chat
      history={userData.chat_history.map((c: UserChat) => { return { name: c.title, url: `/${c.id}`, id: c.id }; })}
      docs={userData.available_documents.map((d: UserDocument) => {
        return {
          name: d.name,
          url: d.href,
          id: d.id,
        };
      })}
      userId={session.user.email}
      defaultPersonality={userData.default_personality}
      modelSelection={userData.model_selection}
      models={userData.available_models}
      personalities={userData.available_personalities}
    />
  );
}

