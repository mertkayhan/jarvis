export interface Message extends Record<string, any> {
    id: string
    chatId: string
    createdAt?: Date
    content: string
    role: 'user' | 'assistant' | 'system'
    data?: string
    liked?: boolean
    score?: number
    context?: string
}

export interface UserChat extends Record<string, any> {
    id: string
    title: string | null
    createdAt: Date
    userId: string
    path: string
    messages: Message[]
    updatedAt: Date
    sharePath?: string
}

export interface Question extends Record<string, any> {
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