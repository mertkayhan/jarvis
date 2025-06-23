"use client";

import { Dispatch, MutableRefObject, SetStateAction, useState } from "react";
import { uuidv4 } from "@/lib/utils";
import {
  DocumentPack,
  Message,
  Personality,
  QuestionPack,
  UserChat,
} from "@/lib/types";
import { ChatInput } from "@/components/chat/chat-input";
import imageCompression from "browser-image-compression";
import { useQueryClient } from "@tanstack/react-query";
import { ListChatsResp } from "../chat-sidebar/chat-sidebar-actions";
import { MessageContent } from "../../lib/types";

export interface ChatPanelProps {
  id: string;
  title?: string;
  isLoading: boolean;
  stop: () => void;
  append: (m: Message) => void;
  reload: () => void;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  messageCount: number;
  userId: string;
  path: string;
  selectedPersonality: Personality | undefined;
  selectedDocuments: string[];
  selectedQuestionPack: QuestionPack | null;
  setSelectedDocuments: Dispatch<SetStateAction<string[]>>;
  dispatch: Dispatch<any>;
  selectedDocumentPack: DocumentPack | null;
  setSelectedQuestionPack: Dispatch<SetStateAction<QuestionPack | null>>;
  setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>;
}

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messageCount,
  userId,
  selectedPersonality,
  selectedDocuments,
  selectedQuestionPack,
  setSelectedDocuments,
  dispatch,
  selectedDocumentPack,
  setSelectedQuestionPack,
  setSelectedDocumentPack,
}: ChatPanelProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const readFileAsync = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };

      reader.readAsDataURL(file);
    });
  };
  const [detectHallucination, setDetectHallucination] = useState(false);
  const queryClient = useQueryClient();

  return (
    <div
      className={`mx-auto animate-in duration-300 ease-in-out flex items-center w-full`}
    >
      <div className="relative w-full flex items-center justify-center">
        <div className="w-full sm:max-w-2xl px-2 md:px-4 items-center">
          <ChatInput
            onSubmit={async (value, onComplete, additionalDocs) => {
              const msgId = uuidv4();
              const imgs = [];
              // console.log("start reading images");
              const options = {
                maxSizeMB: 0.5, // Reduce to 500 KB
                maxWidthOrHeight: 1024, // Resize if needed
                useWebWorker: true,
              };

              for (let i = 0; i < selectedImages.length; i++) {
                try {
                  const compressedImage = await imageCompression(
                    selectedImages[i],
                    options
                  );
                  const res = await readFileAsync(compressedImage);
                  imgs.push(res);
                } catch (error) {
                  console.error("failed to read image:", error);
                }
              }
              append({
                id: msgId,
                content: [
                  { logicalType: "text", data: value },
                  ...imgs.map((i) => {
                    return {
                      logicalType: "image_url",
                      data: i,
                    } as MessageContent;
                  }),
                ],
                chatId: id,
                userId: userId,
                role: "user",
                data: {
                  personality: selectedPersonality,
                  docs: Array.from(
                    new Set([...selectedDocuments, ...additionalDocs])
                  ),
                  first_message: messageCount === 0,
                  detect_hallucination: detectHallucination,
                  question_pack: selectedQuestionPack,
                  document_pack: selectedDocumentPack,
                },
              });
              dispatch({ type: "UPDATE_CHAT_STATUS", id: id, status: true });
              if (messageCount === 0) {
                await queryClient.setQueryData(
                  ["listChats", userId],
                  (old: ListChatsResp) => {
                    return {
                      chats: [
                        {
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          title: null,
                          id: id,
                          userId: userId,
                        } as UserChat,
                        ...old.chats,
                      ],
                    };
                  }
                );
              }
              setSelectedImages([]);
              setSelectedPreviews([]);
              setSelectedDocuments((old) => [...old, ...additionalDocs]);
              setTimeout(() => onComplete(), 50);
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            selectedPreviews={selectedPreviews}
            setSelectedPreviews={setSelectedPreviews}
            reload={reload}
            stop={stop}
            messageCount={messageCount}
            detectHallucination={detectHallucination}
            setDetectHallucination={setDetectHallucination}
            userId={userId}
            setSelectedQuestionPack={setSelectedQuestionPack}
            setSelectedDocumentPack={setSelectedDocumentPack}
          />
        </div>
      </div>
    </div>
  );
}
