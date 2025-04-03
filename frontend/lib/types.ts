export interface Message extends Record<string, any> {
    id: string;
    createdAt?: Date;
    content: string;
    ui?: string | JSX.Element | JSX.Element[] | null | undefined;
    role: 'user' | 'assistant';
    data?: string;
    liked?: boolean;
    score?: number;
    context?: string;
}

export interface UserChat extends Record<string, any> {
    id: string
    title: string | null
    createdAt: Date
    userId: string
    path: string
    messages: Message[]
    sharePath?: string
    updatedAt: Date
}

export type ServerActionResult<Result> = Promise<
    | Result
    | {
        error: string
    }
>

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