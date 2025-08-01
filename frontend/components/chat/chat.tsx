"use client";

import { DocumentPack, Message, Personality, QuestionPack } from "@/lib/types";
import { ChatPanel } from "@/components/chat/chat-panel";
import React, { useState, Dispatch, SetStateAction } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import useScreenSize from "@/lib/hooks/use-screen-size";
import ContextExplorer from "@/components/chat/context-explorer";
import { ChatWindow } from "./chat-window";
import {
  appendFn,
  cancelFn,
  reloadFn,
} from "./chat-functions";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { useSocketHandlers } from "@/lib/hooks/use-socket-handlers";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { PersonalitySelectionMenu } from "../personalities/personality-selection-menu";
import { Socket } from "socket.io-client";
import { ModelSelection } from "../model-selection/model-selection";
import { IconArrowRight } from "../ui/icons";
import { KnowledgeMenu } from "../knowledge/knowledge-selection-menu";
import { KnowledgeDropdown } from "../knowledge/knowledge-dropdown";
import ConnectionBanner from "./connection-banner";
import KnowledgeBanner from "./knowledge-banner";

export interface ChatProps {
  initialMessages?: Message[];
  userId: string;
  path: string;
  greeting: string;
  defaultPersonality: Personality | undefined;
  selectedPersonality: Personality | undefined;
  setSelectedPersonality: Dispatch<SetStateAction<Personality | undefined>>;
  socket: Socket | null;
  id: string;
  dispatch: Dispatch<any>;
  isLoading: Record<string, boolean>;
  setLoading: Dispatch<any>;
}

export function Chat({
  userId,
  path,
  greeting,
  defaultPersonality,
  selectedPersonality,
  setSelectedPersonality,
  socket,
  id,
  isLoading,
  setLoading,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const screenSize = useScreenSize();
  const [currentContext, setCurrentContext] = useState<
    string | null | undefined
  >(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedQuestionPack, setSelectedQuestionPack] =
    useState<QuestionPack | null>(null);
  const [selectedDocumentPack, setSelectedDocumentPack] =
    useState<DocumentPack | null>(null);
  const [initialized, setInitialized] = useState(false);

  useNetworkStatus({ socket, path });
  useSocketHandlers(
    socket,
    setInitialized,
    id,
    userId,
    setMessages,
    setCurrentContext,
    setSelectedPersonality,
    setLoading,
    setSelectedDocuments,
    setSelectedQuestionPack,
    setSelectedDocumentPack
  );

  const append = appendFn(
    id,
    isLoading,
    setMessages,
    setLoading,
    socket,
    setCurrentContext
  );
  const cancel = cancelFn(socket, setLoading, id);
  const reload = reloadFn(
    userId,
    id,
    socket,
    setLoading,
    messages,
    setMessages
  );
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("");

  return (
    <ResizablePanelGroup direction="horizontal">
      {/* Chat Interface */}
      <ResizablePanel defaultSize={screenSize.width >= 768 ? 70 : 100}>
        <>
          <div className="h-10 border-b w-full flex items-center px-2 top-0 sticky z-10 bg-background gap-x-2">
            <ModelSelection userId={userId} />
            <KnowledgeBanner
              selectedDocumentPack={selectedDocumentPack}
              setSelectedDocumentPack={setSelectedDocumentPack}
              selectedQuestionPack={selectedQuestionPack}
              setSelectedQuestionPack={setSelectedQuestionPack}
              selectedDocuments={selectedDocuments}
              setSelectedDocuments={setSelectedDocuments}
            />
            <ConnectionBanner connected={socket?.connected} initialized={initialized} />
          </div>
          <>
            <div
              id={id}
              className={`flex flex-col flex-1 ${messages.length > 0 ? "" : "my-auto"}`}
              style={{ height: "calc(100vh - 40px)" }}
            >
              {/* Chat Messages Section */}
              <div
                className={`flex flex-col flex-grow transition-all overflow-auto ${messages.length > 0 ? "" : "justify-end items-center"}`}
                style={{ height: "calc(100vh - 40px)" }}
              >
                <ChatWindow
                  messages={messages}
                  isLoading={isLoading[id]}
                  setCurrentContext={setCurrentContext}
                  greeting={greeting}
                />
              </div>
              {messages.length === 0 && (
                <TooltipProvider>
                  <div className="hidden w-full md:flex flex-1 grid-cols-3 items-center gap-x-2 h-10 justify-center">
                    <div className="space-y-2">
                      <div className="flex">
                        <PersonalitySelectionMenu
                          title={
                            selectedPersonality?.name === "default"
                              ? "Select personality"
                              : selectedPersonality?.name
                          }
                          userId={userId}
                          setSelectedPersonality={setSelectedPersonality}
                        />
                        {selectedPersonality?.name !== "default" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  type="button"
                                  className="hover:bg-transparent hover:text-red-500 w-3 h-3"
                                  onClick={() =>
                                    setSelectedPersonality(defaultPersonality)
                                  }
                                >
                                  <svg
                                    className="w-3 h-3"
                                    viewBox="0 0 15 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                                      fill="currentColor"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    ></path>
                                  </svg>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Click to reset</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex">
                        <KnowledgeDropdown
                          setKind={setKind}
                          setOpen={setOpen}
                          triggerButton={
                            <Button
                              variant="ghost"
                              className="group flex items-center gap-3 px-0 py-3 text-base font-medium text-slate-700 transition-all hover:text-indigo-500 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-transparent"
                            >
                              <IconArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-indigo-400" />
                              <span className="pr-2">Attach knowledge</span>
                            </Button>
                          }
                        />
                        <KnowledgeMenu
                          open={open}
                          setOpen={setOpen}
                          selectedDocuments={selectedDocuments}
                          setSelectedDocuments={setSelectedDocuments}
                          userId={userId}
                          kind={kind}
                          setSelectedQuestionPack={setSelectedQuestionPack}
                          setSelectedDocumentPack={setSelectedDocumentPack}
                        />
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              )}
              {/* Chat Input Box Section - Initially Centered */}
              <div
                className={`md:pt-4 w-full flex flex-col transition-all items-center mx-auto ${messages.length > 0 ? "" : "justify-start h-full flex-grow"}`}
              >
                <ChatPanel
                  id={id as string}
                  isLoading={isLoading[id]}
                  stop={cancel}
                  append={append}
                  reload={reload}
                  messageCount={messages.length}
                  input={input}
                  setInput={setInput}
                  userId={userId}
                  path={path}
                  selectedDocuments={selectedDocuments}
                  selectedPersonality={selectedPersonality}
                  selectedQuestionPack={selectedQuestionPack}
                  setSelectedDocuments={setSelectedDocuments}
                  selectedDocumentPack={selectedDocumentPack}
                  dispatch={setLoading}
                  setSelectedQuestionPack={setSelectedQuestionPack}
                  setSelectedDocumentPack={setSelectedDocumentPack}
                />
              </div>
            </div>
          </>
        </>
      </ResizablePanel>
      <ResizableHandle withHandle />
      {/* Context Explorer */}
      <ResizablePanel
        defaultSize={screenSize.width >= 768 ? 30 : 0}
        minSize={screenSize.width >= 768 ? 5 : 0}
      >
        <div
          className={
            "hidden w-full h-full md:flex md:flex-col border-l p-4 overflow-y-auto bg-background transition-opacity duration-500"
          }
        >
          <ContextExplorer context={currentContext} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
