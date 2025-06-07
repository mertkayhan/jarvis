'use client';

interface ConnectionBannerProps {
    connected: boolean | undefined;
    initialized: boolean;
}

export default function ConnectionBanner({ connected, initialized }: ConnectionBannerProps) {
    const getStatusText = () => {
        if (connected && initialized) {
            return <span className="text-xs">Online</span>;
        } else if (connected && !initialized) {
            return <span className="text-xs">Initializing...</span>;
        } else {
            return <span className="text-xs text-slate-500">Offline</span>;
        }
    };
    return (
        <div className="flex w-full justify-end items-center gap-x-1">
            <div
                className={`ml-2 w-2 h-2 rounded-full ${connected
                    ? "bg-green-500"
                    : "bg-red-500"
                    }`}
            ></div>

            {getStatusText()}
        </div >
    );
}