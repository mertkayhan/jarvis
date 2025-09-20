"use client";

import { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

interface AppShellProps {
    children: ReactNode;
    history?: { name: string; url: string; icon?: undefined; id: string; }[];
    docs?: { name: string; url: string; icon?: undefined; id: string; }[];
}

export function AppShell({ children, history, docs }: AppShellProps) {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" history={history} docs={docs} />
            <SidebarInset>
                <SiteHeader />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
};