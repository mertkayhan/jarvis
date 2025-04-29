'use client'

import { FilterIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Dispatch, SetStateAction } from "react";
import { MultiSelectAdditionalInfoValues } from "./multi-select-additional-info-values";
import { MultiSelectTags } from "./multi-select-tags";
import { useRouter, useSearchParams } from "next/navigation";
import { SelectAdditionalInfoKey } from "./select-additional-info-key";
import { AnimatePresence, motion } from "framer-motion";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Tooltip, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import { QuestionFilter } from "@/lib/types";

interface QuestionFiltersProps {
    setCurrentFilters: Dispatch<SetStateAction<QuestionFilter | null>>
    filters: QuestionFilter
    dispatch: Dispatch<any>
}

export function QuestionFilters({ setCurrentFilters, filters, dispatch }: QuestionFiltersProps) {
    const searchparams = useSearchParams();
    const packId = searchparams?.get("pack_id");
    const router = useRouter();

    return (
        <Dialog modal={false}>
            <DialogTrigger asChild>
                <Button className="w-1/6" variant="outline">
                    <FilterIcon />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[60vw] max-w-none">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Filter Menu
                    </DialogTitle>
                    <DialogDescription>Please add filters to narrow down your search</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-2">
                        <span className="text-lg mb-2">Additional Info</span>
                        <FilterRow packId={packId} filter={filters} dispatch={dispatch} />
                    </div>
                    <div className="flex flex-col space-y-2">
                        <span className="text-lg mb-2">Tags</span>
                        <div className="w-1/2">
                            <MultiSelectTags packId={packId} filter={filters} dispatch={dispatch} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose>
                        <div className="flex flex-1 justify-end gap-x-2">
                            <Button
                                variant="destructive"
                                disabled={filters.tags.size === 0 && filters.additionalInfo.length === 0}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    router.replace(`?pack_id=${packId}&page=1`);
                                    dispatch({ type: "RESET" });
                                    setCurrentFilters(null);
                                }}
                            >
                                Reset filters
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                    router.replace(`?pack_id=${packId}&page=1`);
                                    setCurrentFilters(filters);
                                }}
                            >
                                Apply filters
                            </Button>
                        </div>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface FilterRowProps {
    packId?: string | null
    filter: QuestionFilter
    dispatch: Dispatch<any>
}

export function FilterRow({ packId, filter, dispatch }: FilterRowProps) {
    const setKeyHandler = (index: number) => {
        return (key: string) => {
            return dispatch({ type: "SET ADDITIONAL INFO KEY", value: key, index: index });
        }
    };

    // console.log("filters", filter);

    return (
        <TooltipProvider>
            <Tooltip>
                {filter.additionalInfo.map((v, i) => {
                    return (
                        <div className="flex flex-1 gap-x-4 justify-between" key={i}>
                            <div className="flex-1">
                                <SelectAdditionalInfoKey packId={packId} value={v.key} setValue={setKeyHandler(i)} />
                            </div>
                            <div className="flex-1">
                                <AnimatePresence>
                                    {v.key.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-1 gap-x-1"
                                        >
                                            <MultiSelectAdditionalInfoValues selectedKey={v.key} filter={filter} dispatch={dispatch} index={i} packId={packId} />

                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        dispatch({ type: "REMOVE ADDITIONAL INFO ROW", index: i });
                                                    }}
                                                    className="hover:bg-transparent hover:text-red-500"
                                                >
                                                    <Cross2Icon />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="text-xs">Remove filter row</TooltipContent>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
                <Button
                    className="w-20 h-10"
                    variant="outline"
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        dispatch({ type: "ADD ADDITIONAL INFO KEY" });
                    }}
                >
                    Add filter
                </Button>
            </Tooltip>
        </TooltipProvider>
    )
}