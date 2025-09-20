export interface Personality {
    name: string;
    description: string;
    instructions: string;
    id: string;
    owner: string;
    isDefault?: boolean;
    tools?: string[];
    doc_ids?: string[];
}

export interface FormState {
    success: boolean;
    message?: any;
}

export interface DocumentPack {
    id: string;
    name: string;
    description: string;
}

export interface TextContent extends Record<string, string> {
    type: "text";
    text: string;
}

export interface ImageUrl {
    url: string;
}

export interface ImageContent extends Record<string, any> {
    type: "image_url";
    image_url: ImageUrl;
}

type MessageContent = TextContent | ImageContent;

export interface Message {
    id: string;
    chatId: string;
    userId: string;
    createdAt?: Date;
    content: MessageContent[];
    role: 'user' | 'assistant' | 'system';
    data?: Record<string, any>;
    liked?: boolean;
    score?: number;
    context?: string;
}

export interface UserChat {
    id: string;
    title: string | null;
    createdAt: Date;
    userId: string;
    path: string;
    messages: Message[];
    updatedAt: Date;
    sharePath?: string;
}

export interface UserDocument {
    name: string;
    id: string;
    owner: string;
    href: string;
    pageCount: number | null;
    tokenCount: number | null;
    createdAt: Date;
}

export interface AIModel {
    name: string;
    description: string;
}