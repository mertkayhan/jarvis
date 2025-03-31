'use client'

import { ClimbingBoxLoader } from "react-spinners";

export function Loading() {
    return (
        <div className="flex w-full h-full items-center justify-center mx-auto my-auto">
            <ClimbingBoxLoader color="#94a3b8" size={20} />
        </div>
    );
}
