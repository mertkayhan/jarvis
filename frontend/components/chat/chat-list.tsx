import { Message } from '@/lib/types'
import { ChatMessage } from '@/components/chat/chat-message'
import { Dispatch, MutableRefObject, SetStateAction } from 'react'

export interface ChatListProps {
  messages: Message[]
  streaming: boolean
  setCurrentContext: Dispatch<SetStateAction<string | null | undefined>>
  messageEndRef: MutableRefObject<HTMLDivElement | null>
}

export function ChatList({ messages, streaming, setCurrentContext, messageEndRef }: ChatListProps) {
  if (!messages.length) return null

  const lastMessage = messages[messages.length - 1]
  const awaitingAssistantReply = lastMessage?.role === "user"

  return (
    <div className="flex flex-1 flex-col mx-auto md:max-w-3xl lg:max-w-4xl">
      {messages.map((message, index) => (
        <div
          key={index}
          className="flex flex-col w-full"
          id={`message-${index}`}
        >
          <ChatMessage
            message={message}
            streaming={index === messages.length - 1 && streaming}
            setCurrentContext={setCurrentContext}
          />
        </div>
      ))
      }
      <div
        ref={messageEndRef}
        id="message-end"
      >
      </div>
      <div
        key="placeholder"
        id="placeholder"
        className={`flex h-[60vh] overflow-hidden bg-transparent pointer-events-none px-4 py-2 text-sm text-muted-foreground rounded-md w-fit max-w-[80%] mb-4 transition-all duration-300 ease-in-out
  ${awaitingAssistantReply && streaming ? "opacity-100" : "opacity-0"}`}
      >
        <p className="relative inline-block font-medium shimmer-text">
          Assistant is thinking…
        </p>
      </div>

    </div >
  )
}