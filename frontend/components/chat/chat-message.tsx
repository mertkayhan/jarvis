// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

"use client";

import { Message } from "@/lib/types";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/codeblock";
import { MemoizedReactMarkdown } from "@/components/chat/markdown";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MouseEventHandler, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { updateMessageLike } from "./chat-message-actions";
import { Dispatch, SetStateAction } from "react";

import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface ChatMessageProps {
  message: Message;
  streaming: boolean;
  setCurrentContext: Dispatch<SetStateAction<string | null | undefined>>;
}

export const preprocessLaTeX = (content: string) => {
  // Replace block-level LaTeX delimiters \[ \] with $$ $$

  const blockProcessedContent = content.replace(
    /\\\[(.*?)\\\]/gs,
    (_, equation) => `$$${equation}$$`
  );
  // Replace inline LaTeX delimiters \( \) with $ $
  const inlineProcessedContent = blockProcessedContent.replace(
    /\\\((.*?)\\\)/gs,
    (_, equation) => `$${equation}$`
  );
  return inlineProcessedContent;
};

export function ChatMessage({
  message,
  streaming,
  setCurrentContext,
}: ChatMessageProps) {
  const imgs: string[] =
    (message.data && JSON.parse(message.data)["images"]) || [];
  message.content = preprocessLaTeX(message.content);

  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(message.content);
  };
  const [liked, setLike] = useState<boolean | null>(message.liked || null);

  return (
    <div>
      <div className="flex flex-col flex-1">
        <div className={cn("group relative flex items-start md:-ml-12")}>
          {message.role === "user" ? (
            <UserMessage
              message={message}
              streaming={streaming}
              onCopy={onCopy}
              isCopied={isCopied as boolean}
            />
          ) : (
            <AIMessage
              message={message}
              streaming={streaming}
              onCopy={onCopy}
              isCopied={isCopied as boolean}
              liked={liked}
              setLike={setLike}
              setCurrentContext={setCurrentContext}
            />
          )}
        </div>
      </div>
      <Dialog>
        <div className="grid grid-cols-6 gap-2">
          {imgs.map((img, index) => (
            <DialogTrigger key={index} asChild>
              <button key={index}>
                <Image src={img} alt="img" height={150} width={150} />
              </button>
            </DialogTrigger>
          ))}
        </div>
        <DialogContent className="max-w-none w-full h-full flex flex-col items-center justify-center bg-background/50">
          <ImgCarousel imgs={imgs} startIndex={0} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ImgCarouselProps {
  imgs: string[];
  startIndex: number;
}

export function ImgCarousel({ imgs, startIndex }: ImgCarouselProps) {
  return (
    <Carousel
      className="w-[5/6] h-[5/6] items-center justify-center"
      opts={{
        align: "start",
        loop: true,
        startIndex: startIndex,
      }}
    >
      <CarouselContent>
        {imgs.map((img, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <Image
                    src={img}
                    alt={"img"}
                    width={500}
                    height={500}
                    style={{ objectFit: "contain" }}
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

interface UserMessageProps {
  message: Message;
  streaming: boolean;
  onCopy: MouseEventHandler;
  isCopied: boolean;
}

export function UserMessage({
  message,
  streaming,
  onCopy,
  isCopied,
}: UserMessageProps) {
  const [editable, setEditable] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(message.content);

  return (
    <div className="flex-1 overflow-y-auto rounded-xl p-4 text-xs md:text-sm leading-6 text-slate-900 bg-background dark:text-slate-300">
      <div className="mb-4 flex rounded-xl bg-slate-200 px-2 py-6 dark:bg-slate-900 sm:px-4">
        <div className="flex md:max-w-3xl lg:max-w-4xl items-center">
          {/* <MessageContainer message={message} /> */}
          <textarea
            className="px-2 bg-transparent w-full resize-none focus:ring-0 focus:outline-none"
            // @ts-ignore
            style={{ fieldSizing: "content", minHeight: "1rem" }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            contentEditable={editable}
            ref={textareaRef}
          />
        </div>
      </div>
      {!streaming && (
        <div className="mb-2 flex w-full flex-row gap-x-2 text-slate-500 justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="hover:text-blue-600"
                  disabled
                  onClick={() => {
                    setEditable((old) => {
                      if (!old) {
                        const textarea = textareaRef.current;
                        if (textarea) {
                          textarea.focus();
                          const length = textarea.value.length;
                          textarea.setSelectionRange(length, length);
                        }
                      } else {
                        // TODO: regenerate with updated message
                      }
                      return !old;
                    });
                  }}
                >
                  <span className="sr-only">Edit messsage</span>
                  {(!editable && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                    </svg>
                  )) || (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit message</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="hover:text-blue-600"
                  type="button"
                  onClick={onCopy}
                >
                  <span className="sr-only">Copy</span>
                  {isCopied ? (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"></path>
                      <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
                    </svg>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy message content</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}

interface AIMessageProps {
  message: Message;
  streaming: boolean;
  onCopy: MouseEventHandler;
  isCopied: boolean;
  liked: boolean | null;
  setLike: Dispatch<SetStateAction<boolean | null>>;
  setCurrentContext: Dispatch<SetStateAction<string | null | undefined>>;
}

export function AIMessage({
  message,
  streaming,
  onCopy,
  isCopied,
  liked,
  setLike,
  setCurrentContext,
}: AIMessageProps) {
  return (
    <>
      <div className="flex-1 overflow-wrap rounded-xl p-4 text-xs md:text-sm leading-6 text-slate-900 bg-background dark:text-slate-300">
        <div
          className={`flex md:max-w-3xl lg:max-w-4xl items-start rounded-xl pb-4`}
        >
          <MessageContainer message={message} />
        </div>
        {!streaming && (
          <div className="mb-2 flex w-full flex-row justify-end gap-x-2 text-slate-500">
            {message.score && <Badge score={message.score} />}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="hover:text-blue-600"
                    onClick={() => {
                      if (!liked) {
                        setLike(true);
                        updateMessageLike(message.id, true);
                      } else {
                        setLike(null);
                        updateMessageLike(message.id, null);
                      }
                    }}
                  >
                    <span className="sr-only">Thumbs up</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${liked === true ? "dark:fill-slate-600 fill-slate-200" : "fill-none"}`}
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M7 11v8a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1h3a4 4 0 0 0 4 -4v-1a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1 -2 2h-7a3 3 0 0 1 -3 -3"></path>
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Like message</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="hover:text-blue-600"
                    type="button"
                    onClick={() => {
                      if (liked === null || liked === true) {
                        setLike(false);
                        updateMessageLike(message.id, false);
                      } else {
                        setLike(null);
                        updateMessageLike(message.id, null);
                      }
                    }}
                  >
                    <span className="sr-only">Thumbs down</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${liked === false ? "dark:fill-slate-600 fill-slate-200" : "fill-none"}`}
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                      <path d="M7 13v-8a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v7a1 1 0 0 0 1 1h3a4 4 0 0 1 4 4v1a2 2 0 0 0 4 0v-5h3a2 2 0 0 0 2 -2l-1 -5a2 3 0 0 0 -2 -2h-7a3 3 0 0 0 -3 3"></path>
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Dislike message</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="hover:text-blue-600"
                    type="button"
                    onClick={onCopy}
                  >
                    <span className="sr-only">Copy</span>
                    {isCopied ? (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          stroke="none"
                          d="M0 0h24v24H0z"
                          fill="none"
                        ></path>
                        <path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z"></path>
                        <path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"></path>
                      </svg>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>Copy message content</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="hover:text-blue-600"
                    type="button"
                    onClick={() => {
                      // console.log("ctx:", message.context)
                      setCurrentContext(message.context);
                    }}
                  >
                    <span className="sr-only">View context</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </TooltipTrigger>
                <TooltipContent>View message context</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </>
  );
}

interface MessageContainerProps {
  message: Message;
}

export function MessageContainer({ message }: MessageContainerProps) {
  return (
    <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
      <MemoizedReactMarkdown
        className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 md:text-sm text-xs max-w-none w-full"
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          code({ node, inline, className, children, ...props }) {
            try {
              if (children.length) {
                if (children[0] == "▍") {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  );
                }

                children[0] = (children[0] as string).replace("`▍`", "▍");
              }

              const match = /language-(\w+)/.exec(className || "");

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ""}
                  value={String(children).replace(/\n$/, "")}
                  {...props}
                />
              );
            } catch (err) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          },
        }}
      >
        {message.content}
      </MemoizedReactMarkdown>
    </div>
  );
}

interface BadgeProps {
  score: number;
}

interface Badge {
  text: string;
  bgColor: string;
  textColor: string;
}

export function Badge({ score }: BadgeProps) {
  let badge: Badge = {
    text: score >= 70 ? "Trustworthy" : "Possible hallucination",
    bgColor: score >= 70 ? "bg-green-600" : "bg-amber-600",
    textColor: score >= 70 ? "text-green-600" : "text-amber-600",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <span
              className={`inline-flex items-center gap-x-2 rounded-full ${badge.bgColor}/20 px-2.5 py-1 text-xs md:text-sm font-semibold leading-5 ${badge.textColor}`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${badge.bgColor}`}
              ></span>
              {badge.text}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            This response received a faithfullness score of {Math.round(score)}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
