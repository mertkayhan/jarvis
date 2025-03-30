'use client'
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

export default function VersionChecker() {
    const [version, setVersion] = useState<string | null>(null);
    const [newVersionAvailable, setNewVersionAvailable] = useState(false);

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_ENV !== "production") {
            return;
        }
        const checkForUpdate = async () => {
            try {
                const response = await fetch("/version.json", { cache: "no-store" });
                const data = await response.json();
                if (version && version !== data.version) {
                    setNewVersionAvailable(true);
                } else {
                    setVersion(data.version);
                }
            } catch (error) {
                console.error("Failed to check app version:", error);
            }
        };

        checkForUpdate();
        const interval = setInterval(checkForUpdate, CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [version]);

    return newVersionAvailable ? (
        <div className="fixed bottom-4 right-4 bg-red-800 text-white p-3 rounded-md shadow-md flex items-center space-x-2">
            <span>A new version of Jarvis is available.</span>
            <Button variant="outline" onClick={() => location.reload()} className=" bg-transparent text-white hover:bg-red-400 rounded-md px-3 py-1">
                Refresh
            </Button>
        </div>

    ) : null;
}