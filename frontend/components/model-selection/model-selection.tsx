"use client"

import { Dialog } from "../ui/dialog"
import { SidebarButton } from "./sidebar-button"
import { SelectionDialog } from "./selection-dialog"

interface ModelSelectionProps {
    userId: string
    highlightStyle: string
}

export function ModelSelection({ userId }: ModelSelectionProps) {
    // const [value, setValue] = useState("automatic");

    return (
        <Dialog modal={false}>
            <SidebarButton />
            <SelectionDialog userId={userId} />
        </Dialog>
    )
}