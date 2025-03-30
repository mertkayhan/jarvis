'use client'

import { Question } from "@/lib/types";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { createTag, listTags, ListTagsResp, removeTag } from "./question-actions";
import { Tag, TagInput } from "emblor";
import { uuidv4 } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

interface TagsInputProps {
    question: Question
    packId: string
    userId: string
    setMutationCount: Dispatch<SetStateAction<number>>
}

export function TagsInput({ question, packId, userId, setMutationCount }: TagsInputProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
    const { data, isFetching, error } = useQuery({
        queryKey: ["listTags", question.id],
        queryFn: () => listTags(question.id),
    });
    const { toast } = useToast();
    useEffect(() => {
        if (error) {
            toast({ title: "Failed to load tags", variant: "destructive" });
        }
    }, [error]);
    useEffect(() => {
        if (data?.tags) {
            setTags(data.tags);
        }
    }, [data, isFetching]);
    const queryClient = useQueryClient();
    const createMutation = useMutation({
        mutationFn: (opts: Record<string, string>) => createTag(question.id, opts.tagId, opts.tag, packId, userId),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listTags", question.id], (old: ListTagsResp) => {
                return { tags: [...old.tags, { text: resp.tag, id: resp.id }] };
            });
            setMutationCount((old) => old + 1);
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to create tag", variant: "destructive" });
        }
    }, queryClient);
    const deleteMutation = useMutation({
        mutationFn: (tag: string) => removeTag(question.id, tag, userId),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listTags", question.id], (old: ListTagsResp) => {
                return { tags: [...old.tags.filter((t) => t.id !== resp.id)] };
            });
            setMutationCount((old) => old + 1);
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to delete tag", variant: "destructive" });
        }
    }, queryClient);

    return (
        <TagInput
            tags={tags}
            setTags={(newTags) => { setTags(newTags) }}
            onTagAdd={(tag) => {
                const newId = uuidv4();
                createMutation.mutate({ tagId: newId, tag });
            }}
            onTagRemove={(tag) => {
                deleteMutation.mutate(tag);
            }}
            placeholder="Add a tag"
            styleClasses={{ input: 'w-full flex sm:max-w-[350px]' }}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
        />
    );
}