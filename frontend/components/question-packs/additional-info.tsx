'use client'

import { Question } from "@/lib/types";
import { Dispatch, Reducer, SetStateAction, useEffect, useReducer, useState } from "react";
import { listAdditionalInfo, removeAdditionalInfo, saveAdditionalInfo } from "./question-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { uuidv4 } from "@/lib/utils";
import { AdditionalInfo as AdditionalInfoType } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";

interface AdditionalInfoProps {
    question: Question
    userId: string
    setMutationCount: Dispatch<SetStateAction<number>>
    packId: string
}

function infoReducer(state: AdditionalInfoType[], action: any) {
    switch (action.type) {
        case "SET_INFO":
            return action.payload;
        case "UPDATE_FIELD":
            return state.map((item, index) =>
                index === action.index ? { ...item, [action.field]: action.value } : item
            );
        case "ADD_ROW":
            return [...state, { key: "", value: "", id: uuidv4() } as AdditionalInfoType];
        case "REMOVE_ROW":
            return state.filter((_, index) => index !== action.index);
        case "FILTER_EMPTY_KEYS":
            return state.filter((o) => Boolean(o.key.trim().length));
        case "RESET_INFO":
            return [];
        default:
            return state;
    }
}

export function AdditionalInfo({ question, userId, setMutationCount, packId }: AdditionalInfoProps) {
    const [info, dispatch] = useReducer<Reducer<AdditionalInfoType[], any>>(infoReducer, []);
    const [edit, setEdit] = useState(false);
    const { data, isFetching, error } = useQuery({
        queryKey: ["listAdditionalInfo", question.id],
        queryFn: () => listAdditionalInfo(question.id),
    });
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const deleteMutation = useMutation({
        mutationFn: (id: string) => removeAdditionalInfo(id, userId, question.id),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listAdditionalInfo", question.id], () => {
                dispatch({ type: "REMOVE_ROW", index: resp.id });
                return { info: info };
            });
            setMutationCount((old) => old + 1);
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to remove additional information row", variant: "destructive" });
        }
    }, queryClient);
    useEffect(() => {
        if (error) {
            toast({ title: "Failed to load additional information", variant: "destructive" });
        }
    }, [error]);
    const saveMutation = useMutation({
        mutationFn: () => saveAdditionalInfo(question.id, info, userId, packId),
        onSuccess: async (resp) => {
            await queryClient.setQueryData(["listAdditionalInfo", question.id], () => {
                dispatch({ type: "SET_INFO", payload: resp.info });
                return { info: resp.info };
            });
            setEdit(false);
            setMutationCount((old) => old + 1);
        },
        onError: (error) => {
            console.error(error);
            toast({ title: "Failed to save additional information", variant: "destructive" });
        }
    }, queryClient);
    useEffect(() => {
        if (data?.info) {
            dispatch({ type: "SET_INFO", payload: data.info });
        }
    }, [data, isFetching]);

    return (
        <TooltipProvider>
            <div className="space-y-2">
                <div className="flex flex-1 gap-x-2">
                    <span className="w-40 ml-2">Key</span>
                    <span className="w-40">Value</span>
                </div>
                {info.map((i, j) => {
                    return (
                        <div className="flex flex-1 gap-x-2" key={j}>
                            <Input
                                value={i.key}
                                className="w-40"
                                disabled={!edit}
                                onChange={(e) => dispatch({ type: "UPDATE_FIELD", index: j, field: "key", value: e.target.value })}
                            />
                            <Input
                                value={i.value}
                                className="w-60"
                                disabled={!edit}
                                onChange={(e) => dispatch({ type: "UPDATE_FIELD", index: j, field: "value", value: e.target.value })}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        disabled={!edit}
                                        size="icon"
                                        type="button"
                                        variant="ghost"
                                        className="hover:bg-transparent hover:text-red-500"
                                        onClick={() => {
                                            deleteMutation.mutate(i.id);
                                            dispatch({ type: "REMOVE_ROW", index: j });
                                        }}
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            viewBox="0 0 15 15"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                        </svg>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove row</TooltipContent>
                            </Tooltip>
                        </div>
                    )
                })}
                <div className="flex">
                    {!edit
                        &&
                        <Button variant="outline" type="button" onClick={() => { setEdit(true) }}>Edit</Button>
                        ||
                        <div className="flex flex-1 gap-x-2">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => dispatch({ type: "ADD_ROW" })}
                            >
                                Add row
                            </Button>
                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                    dispatch({ type: "FILTER_EMPTY_KEYS" });
                                    saveMutation.mutate();
                                }}
                            >
                                Save changes
                            </Button>
                        </div>
                    }
                </div>
            </div>
        </TooltipProvider>
    )
}