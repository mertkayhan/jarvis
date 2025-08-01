"use client";

import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "../document-repo/document-repo-actions";
import { Checkbox } from "../ui/checkbox";
import { DialogClose } from "../ui/dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import React, { Dispatch, SetStateAction } from "react";
import { ClipLoader } from "react-spinners";
import { Button } from "../ui/button";
import { listPacks as listQuestionPacks } from "../question-packs/question-packs-actions";
import { DocumentPack, QuestionPack } from "@/lib/types";
import { listPacks as listDocumentPacks } from "../document-packs/document-packs-actions";

function useDocuments(userId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["listDocuments", userId],
    queryFn: () => listDocuments(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  return { docs: data, docsLoading: isLoading, docError: error };
}

function useQuestionPacks(userId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["listQuestionPacks", userId],
    queryFn: () => listQuestionPacks(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
  return { questionPacks: data?.packs, questionPacksLoading: isLoading };
}

function useDocumentPacks(userId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["listDocumentPacks", userId],
    queryFn: () => listDocumentPacks(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
  return { documentPacks: data?.packs, documentPacksLoading: isLoading };
}

interface KnowledgeMenuProps {
  userId: string;
  kind: string;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  selectedDocuments: string[];
  setSelectedDocuments: Dispatch<SetStateAction<string[]>>;
  setSelectedQuestionPack: Dispatch<SetStateAction<QuestionPack | null>>;
  setSelectedDocumentPack: Dispatch<SetStateAction<DocumentPack | null>>;
}

export function KnowledgeMenu({
  userId,
  kind,
  open,
  setOpen,
  selectedDocuments,
  setSelectedDocuments,
  setSelectedQuestionPack,
  setSelectedDocumentPack,
}: KnowledgeMenuProps) {
  const { docs, docsLoading } = useDocuments(userId);
  const { questionPacks, questionPacksLoading } = useQuestionPacks(userId);
  const { documentPacks, documentPacksLoading } = useDocumentPacks(userId);
  const shouldHighlight = (docId: string) => selectedDocuments.includes(docId);

  return (
    <CommandDialog open={open} onOpenChange={(open) => setOpen(open)}>
      {kind === "Documents" && (
        <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-xl shadow-md dark:from-slate-800 dark:via-slate-900 dark:to-black">
          <CommandInput
            className="mb-4 w-full rounded-md border border-slate-200 bg-white p-4 mt-6 text-slate-700 focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:ring-purple-400"
            placeholder="Type a command or search..."
          />
          <CommandList className="max-h-48 overflow-y-auto">
            {!docsLoading && (
              <CommandEmpty className="px-4 py-2 text-slate-600 dark:text-slate-400">
                No results found.
              </CommandEmpty>
            )}
            <CommandGroup heading="Suggestions">
              {(!docsLoading &&
                docs?.docs &&
                docs?.docs.map((doc, i) => {
                  return (
                    <CommandItem
                      key={i}
                      className="cursor-pointer px-4 py-2 rounded-md hover:bg-purple-50 hover:text-purple-500 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
                      onSelect={() => {
                        // console.log("select item");
                        if (!selectedDocuments.includes(doc.id)) {
                          setSelectedDocuments((old) => old.concat(doc.id));
                        } else {
                          setSelectedDocuments((old) => [
                            ...old.filter((o) => o !== doc.id),
                          ]);
                        }
                      }}
                    >
                      <span className="flex items-center justify-center">
                        <Checkbox
                          className={`mx-2 ${shouldHighlight(doc.id) ? "bg-indigo-400" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!selectedDocuments.includes(doc.id)) {
                              setSelectedDocuments((old) => old.concat(doc.id));
                            } else {
                              setSelectedDocuments((old) => [
                                ...old.filter((o) => o !== doc.id),
                              ]);
                            }
                          }}
                        />
                        {doc.name}
                      </span>
                    </CommandItem>
                  );
                })) || (
                <div className="flex flex-col w-full mx-auto items-center justify-center h-10">
                  <ClipLoader color="#94a3b8" />
                </div>
              )}
            </CommandGroup>
          </CommandList>
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button
                variant="secondary"
                disabled={
                  selectedDocuments.length === 0 || docs?.docs?.length === 0
                }
                onClick={() => setSelectedDocuments([])}
              >
                Clear selection
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="secondary">Done</Button>
            </DialogClose>
          </div>
        </div>
      )}
      {kind === "Question Pack" && (
        <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-xl shadow-md dark:from-slate-800 dark:via-slate-900 dark:to-black">
          <CommandInput
            className="mb-4 w-full rounded-md border border-slate-200 bg-white p-4 mt-6 text-slate-700 focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:ring-purple-400"
            placeholder="Type a command or search..."
          />
          <CommandList className="max-h-48 overflow-y-auto">
            {!questionPacksLoading && (
              <CommandEmpty className="px-4 py-2 text-slate-600 dark:text-slate-400">
                No results found.
              </CommandEmpty>
            )}
            <CommandGroup heading="Suggestions">
              {questionPacksLoading && (
                <div className="flex flex-col w-full mx-auto items-center justify-center h-10">
                  <ClipLoader color="#94a3b8" />
                </div>
              )}
              {!questionPacksLoading &&
                questionPacks &&
                questionPacks.map((pack, i) => {
                  return (
                    <CommandItem
                      className="cursor-pointer px-4 py-2 rounded-md hover:bg-purple-50 hover:text-purple-500 dark:hover:bg-slate-700 dark:hover:text-purple-400"
                      onSelect={() => {
                        //console.log("selected", personality.name);
                        setSelectedQuestionPack(pack);
                        setTimeout(() => {
                          setOpen(false);
                        }, 100);
                      }}
                      key={i}
                    >
                      {pack.name}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </div>
      )}
      {kind === "Document Pack" && (
        <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-xl shadow-md dark:from-slate-800 dark:via-slate-900 dark:to-black">
          <CommandInput
            className="mb-4 w-full rounded-md border border-slate-200 bg-white p-4 mt-6 text-slate-700 focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:ring-purple-400"
            placeholder="Type a command or search..."
          />
          <CommandList className="max-h-48 overflow-y-auto">
            {!documentPacksLoading && (
              <CommandEmpty className="px-4 py-2 text-slate-600 dark:text-slate-400">
                No results found.
              </CommandEmpty>
            )}
            <CommandGroup heading="Suggestions">
              {documentPacksLoading && (
                <div className="flex flex-col w-full mx-auto items-center justify-center h-10">
                  <ClipLoader color="#94a3b8" />
                </div>
              )}
              {!documentPacksLoading &&
                documentPacks &&
                documentPacks.map((pack, i) => {
                  return (
                    <CommandItem
                      className="cursor-pointer px-4 py-2 rounded-md hover:bg-purple-50 hover:text-purple-500 dark:hover:bg-slate-700 dark:hover:text-purple-400"
                      onSelect={() => {
                        setSelectedDocumentPack(pack);
                        setTimeout(() => {
                          setOpen(false);
                        }, 100);
                      }}
                      key={i}
                    >
                      {pack.name}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </div>
      )}
    </CommandDialog>
  );
}
