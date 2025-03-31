import Image from "next/image"

import { cn } from "@/lib/utils"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { PID } from "@/app/modules/summaries/types"

interface ArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
    album: PID
    aspectRatio?: "portrait" | "square"
    width?: number
    height?: number
}

export function blurDataUrl() {
    const blurSvg = `
        <svg height="100" width="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="f1" x="0" y="0" xmlns="http://www.w3.org/2000/svg">
            <feGaussianBlur in="SourceGraphic" stdDeviation="55" />
            </filter>
        </defs>
        <rect width="90" height="90" fill="gray" filter="url(#f1)" />
        </svg>
    `;
    const toBase64 = (str: string) =>
        typeof window === 'undefined'
            ? Buffer.from(str).toString('base64')
            : window.btoa(str);
    return `data:image/svg+xml;base64,${toBase64(blurSvg)}`;
}

export function Artwork({
    album,
    aspectRatio = "portrait",
    width,
    height,
    className,
    ...props
}: ArtworkProps) {
    return (
        <div className={cn("space-y-3", className)} {...props}>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div className="overflow-hidden rounded-md">
                        <Image
                            src={album.image_link || ''}
                            alt={album.name}
                            width={width}
                            height={height}
                            className={cn(
                                "h-auto w-auto object-cover transition-all hover:scale-105",
                                aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"
                            )}
                            placeholder="blur"
                            blurDataURL={blurDataUrl()}
                            priority
                            quality={50}
                        />
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                    <ContextMenuItem>Edit</ContextMenuItem>
                    <ContextMenuItem>Delete</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            <div className="space-y-1 text-sm">
                <h3 className="font-medium leading-none">{album.name}</h3>
                <p className="text-xs text-muted-foreground">No description provided.</p>
            </div>
        </div>
    )
}