"use client";

import * as React from "react";
import {
  IconDatabase,
  IconFileWord,
  IconFolder,
  IconReport,
  IconSearch,
} from "@tabler/icons-react";

import { NavSecondary } from "@/components/nav/nav-secondary";
import { NavMain } from "@/components/nav/nav-main";
import { NavUser } from "./nav/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "./ui/badge";
import { User2 } from "lucide-react";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Search chats",
      icon: IconSearch,
    },
    {
      title: "Personalities",
      url: "/personality",
      icon: User2,
    },
    {
      title: "Document Packs",
      url: "/document-pack",
      icon: IconFolder,
    }
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  history?: { name: string; url: string; icon?: undefined; id: string; }[];
  docs?: { name: string; url: string; icon?: undefined; id: string; }[];
}

export function AppSidebar({ history, docs, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <span className="text-base font-semibold">Jarvis</span>
                <Badge>0.0.2</Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {history && <NavSecondary title="Chats" items={history} />}
        {docs && <NavSecondary title="Documents" items={docs} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
