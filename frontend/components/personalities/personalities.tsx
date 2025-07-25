"use client";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { listPersonalities } from "@/components/personalities/personality-actions";
import { ClimbingBoxLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/use-toast";
import { Accordion } from "../ui/accordion";
import { PersonalityView } from "./personality-view";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PersonalitiesProps {
  userId: string;
  highlightStyle: string;
}

export function Personalities({ userId, highlightStyle }: PersonalitiesProps) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["listPersonalities", userId],
    queryFn: () => listPersonalities(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
  const router = useRouter();
  // const { toast } = useToast();
  useEffect(() => {
    if (error) {
      // toast({ title: "Failed to list personalities", variant: "destructive" });
      console.error("Failed to list personalities");
    }
  }, [error]);

  return (
    <Dialog modal={false}>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={`${highlightStyle} rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200`}
              type="button"
            >
              <svg
                className="w-4 h-4 md:w-6 md:h-6"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.075 12.975 13.8623 12.975 13.6C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent side="right">Personalities</TooltipContent>
      </Tooltip>
      <DialogContent className="hidden md:flex md:flex-col max-w-none w-[80vw] h-[80vh] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-10 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text">
            Personalities
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Personalities allow you to create customized AI assistants that can
            understand instructions, access specific knowledge, and perform
            tailored tasks to enhance productivity and decision-making. You can
            get an overview of existing personalities and manage them here.
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full justify-end pr-4">
          <Button
            variant="ghost"
            className="group border flex items-center gap-3 px-0 pl-2 py-2 text-sm font-medium text-slate-700 transition-all hover:text-purple-500 dark:text-slate-300 dark:hover:text-purple-400"
            onClick={() => router.push("/personality/new")}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="pr-2 text-xs">Create personality</span>
          </Button>
        </div>
        {isLoading && (
          <div className="flex w-full h-full items-center justify-center mx-auto my-auto">
            <ClimbingBoxLoader color="#94a3b8" size={20} />
          </div>
        )}
        {!isLoading &&
          data?.personalities &&
          data?.personalities.length > 0 && (
            <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 border rounded-lg">
              <div className="flex flex-col w-full h-full overflow-y-auto max-h-[600px]">
                <div className="flex flex-col w-full">
                  {data.personalities.map((personality, i) => {
                    return (
                      <PersonalityView
                        personality={personality}
                        key={i}
                        userId={userId}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        {!isLoading &&
          (!data?.personalities || data?.personalities.length === 0) && (
            <div className="w-full h-full flex flex-1 flex-col items-center justify-center border rounded-lg">
              <span className="text-sm dark:text-slate-400 text-slate-500 p-4">
                No personalities found
              </span>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}
