'use client'

import { Message } from '@/lib/types'
import { ChatMessage } from '@/components/chat/chat-message'
import { Dispatch, SetStateAction } from 'react'

export interface ChatList {
  messages: Message[]
  streaming: boolean
  setCurrentContext: Dispatch<SetStateAction<string | null | undefined>>
}

export function ChatList({ messages, streaming, setCurrentContext }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col mx-auto max-w-2xl">
      {messages.map((message, index) => (
        <div key={index} className='flex flex-col w-full'>
          <ChatMessage
            message={message}
            streaming={index === messages.length - 1 && streaming}
            setCurrentContext={setCurrentContext}
          />
        </div>
      ))}
    </div>
  )
}
