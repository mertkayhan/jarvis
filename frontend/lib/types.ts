export interface MessageContent {
    logicalType: "text" | "image_url"
    data: string
}

export interface Message {
    id: string
    chatId: string
    userId: string
    createdAt?: Date
    content: MessageContent[]
    role: 'user' | 'assistant' | 'system'
    data?: Record<string, any>
    liked?: boolean
    score?: number
    context?: string
}

export interface UserChat {
    id: string
    title: string | null
    createdAt: Date
    userId: string
    path: string
    messages: Message[]
    updatedAt: Date
    sharePath?: string
}

export interface Question {
    id: string
    metadata?: string
    question: string
    answer: string
    updatedAt: Date
    updatedBy: string
}

export interface Personality {
    name: string
    description: string
    instructions: string
    id: string
    owner: string
    isDefault?: boolean
    tools?: string[]
    doc_ids?: string[]
}

export interface UserDocument {
    name: string
    id: string
    owner: string
    href: string
    pageCount: number | null
    tokenCount: number | null
    createdAt: Date
}

export interface QuestionPack {
    id: string
    name: string
    description: string
}

export interface DocumentPack {
    id: string
    name: string
    description: string
}

export interface AdditionalInfo {
    key: string
    value: string
    id: string
}

export interface QuestionFilter {
    additionalInfo: { key: string, value: Set<string> }[]
    tags: Set<string>
}