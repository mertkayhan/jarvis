'use client'

import { QuestionFilter } from "@/lib/types";

export function questionFilterReducer(state: QuestionFilter, action: any) {
    switch (action.type) {
        case "ADD TAG":
            if (state.tags.has(action.value)) {
                return state;
            }
            return { additionalInfo: state.additionalInfo, tags: new Set([...state.tags, action.value]) } as QuestionFilter;
        case "REMOVE TAG":
            if (state.tags.has(action.value)) {
                const newTags = new Set(state.tags); // Create a copy
                newTags.delete(action.value); // Modify the copy
                return { additionalInfo: state.additionalInfo, tags: newTags } as QuestionFilter; // Return new object
            }
            return state;
        case "ADD ADDITIONAL INFO KEY":
            if (state.additionalInfo.every((a) => a.key.trim().length > 0)) {
                return { tags: state.tags, additionalInfo: [...state.additionalInfo, { key: "", value: new Set() }] } as QuestionFilter;
            }
            return state;
        case "SET ADDITIONAL INFO KEY":
            return {
                tags: state.tags,
                additionalInfo: state.additionalInfo.map((a, i) => {
                    if (i === action.index) {
                        return { key: action.value, value: a.value };
                    }
                    return a;
                })
            } as QuestionFilter;
        case "ADD ADDITIONAL INFO VALUE":
            return {
                tags: state.tags,
                additionalInfo: state.additionalInfo.map((v, i) => {
                    if (i === action.index && !v.value.has(action.value)) {
                        return { key: v.key, value: new Set([...v.value, action.value]) };
                    }
                    return v;
                })
            } as QuestionFilter;
        case "REMOVE ADDITIONAL INFO VALUE":
            return {
                tags: state.tags,
                additionalInfo: state.additionalInfo.map((v, i) => {
                    if (i === action.index && v.value.has(action.value)) {
                        const newValue = new Set(v.value);
                        newValue.delete(action.value);
                        return { key: v.key, value: newValue };
                    }
                    return v;
                })
            } as QuestionFilter;
        case "REMOVE ADDITIONAL INFO ROW":
            return {
                tags: state.tags,
                additionalInfo: state.additionalInfo.filter((_, i) => i !== action.index)
            } as QuestionFilter;
        case "RESET":
            return {
                tags: new Set(),
                additionalInfo: []
            } as QuestionFilter;
    }
    return state;
}