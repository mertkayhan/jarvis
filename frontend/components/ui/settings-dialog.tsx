// "use client"

// import * as React from "react"
// import {
//     Lightbulb,
//     File,
//     HelpCircle,
//     FolderSearch2
// } from "lucide-react"

// import {
//     Breadcrumb,
//     BreadcrumbItem,
//     BreadcrumbLink,
//     BreadcrumbList,
//     BreadcrumbPage,
//     BreadcrumbSeparator,
// } from "@/components/ui/breadcrumb"
// import { Button } from "@/components/ui/button"
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogTitle,
//     DialogTrigger,
// } from "@/components/ui/dialog"
// import {
//     Sidebar,
//     SidebarContent,
//     SidebarGroup,
//     SidebarGroupContent,
//     SidebarMenu,
//     SidebarMenuButton,
//     SidebarMenuItem,
//     SidebarProvider,
// } from "@/components/ui/sidebar"
// import { DocumentList } from "../document-repo/document-list"
// import { useQuery } from "@tanstack/react-query"
// import { listDocuments } from "../document-repo/document-repo-actions"
// import { useToast } from "@/lib/hooks/use-toast"
// import { UserDocument } from "@/lib/types"
// import { UploadButton } from "../document-repo/buttons"
// import { Skeleton } from "./skeleton"
// import { useAuthToken } from "@/lib/hooks/use-auth-token"
// import { useSocket } from "@/lib/hooks/use-socket"
// import { Socket } from "socket.io-client"

// const data = {
//     nav: [
//         { name: "Documents [WIP]", icon: File },
//         { name: "Question Packs [WIP]", icon: HelpCircle },
//         { name: "Document Packs [WIP]", icon: FolderSearch2 },
//     ],
// }

// interface BuildDialogContentProps {
//     selection: string,
//     userId: string,
//     data: UserDocument[] | null | undefined,
//     socket: Socket | null,
//     uploadRunning: boolean
//     setUploadRunning: React.Dispatch<React.SetStateAction<boolean>>
//     docsLoading: boolean
// }

// function BuildDialogContent({ selection, userId, data, socket, uploadRunning, setUploadRunning, docsLoading }: BuildDialogContentProps) {
//     switch (selection) {
//         case "Documents":
//             return (
//                 <div className="flex flex-col w-full h-full p-4">
//                     <header className="flex flex-col h-12 items-center">
//                         <div className="items-center w-full justify-end flex">
//                             <UploadButton
//                                 uploadRunning={uploadRunning}
//                                 userId={userId}
//                                 setUploadRunning={setUploadRunning}
//                                 socket={socket}
//                             />
//                         </div>
//                     </header>
//                     {docsLoading &&
//                         <div className="space-y-2">
//                             <Skeleton className="h-10" />
//                             <Skeleton className="h-10" />
//                             <Skeleton className="h-10" />
//                             <Skeleton className="h-10" />
//                             <Skeleton className="h-10" />
//                             <Skeleton className="h-10" />
//                             <Skeleton className="h-10" />
//                         </div>
//                         ||
//                         <DocumentList documents={data} userId={userId} />
//                     }
//                     <span className="text-xs text-slate-600 mt-2">Note: Your documents will be processed and parsed which can take some time depending on the complexity and number of pages.</span>
//                 </div>
//             );
//         default:
//             return null;
//     }
// }

// function useDocuments(userId: string) {
//     const { data, isLoading, error } = useQuery({
//         queryKey: ["listDocuments", userId],
//         queryFn: () => listDocuments(userId),
//         enabled: !!userId,
//     });
//     const { toast } = useToast();
//     React.useEffect(() => {
//         if (error) {
//             toast({
//                 title: "Failed to fetch documents",
//                 variant: "destructive"
//             })
//         }
//     }, [error]);
//     return { docs: data, docsLoading: isLoading };
// }

// export function SettingsDialog({ userId }: { userId: string }) {
//     const [open, setOpen] = React.useState(false);
//     const [selection, setSelection] = React.useState("Documents");
//     const { docs, docsLoading } = useDocuments(userId);
//     const [uploadRunning, setUploadRunning] = React.useState(false);
//     const token = useAuthToken();
//     const socket = useSocket({ socketNamespace: "jarvis", userId, token });

//     return (
//         <Dialog open={open} onOpenChange={(open) => {
//             setSelection("Documents");
//             setOpen(open);
//         }}>
//             <DialogTrigger asChild>
//                 <Button
//                     size="icon"
//                     variant="ghost"
//                     onClick={() => setOpen(true)}
//                     className="rounded-lg hover:bg-slate-200 p-1.5 text-slate-600 transition-colors duration-200 dark:hover:bg-slate-800 dark:text-slate-200"
//                 >
//                     <Lightbulb />
//                 </Button>
//             </DialogTrigger>
//             <DialogContent className="min-h-[70vh] overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px] bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
//                 <SidebarProvider className="items-start">
//                     <Sidebar collapsible="none" className="hidden md:flex bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-lg dark:from-slate-800 dark:via-slate-900 dark:to-black">
//                         <SidebarContent>
//                             <SidebarGroup>
//                                 <SidebarGroupContent>
//                                     <SidebarMenu>
//                                         {data.nav.map((item) => (
//                                             <SidebarMenuItem key={item.name} >
//                                                 <SidebarMenuButton
//                                                     asChild
//                                                     isActive={item.name === selection}
//                                                     className="hover:text-purple-500 dark:text-slate-300 dark:hover:text-purple-400 data-[active=true]:bg-slate-600 data-[active=true]:text-purple-500 dark:data-[active=true]:text-purple-400"
//                                                 >
//                                                     <Button
//                                                         variant="ghost"
//                                                         className="justify-start flex w-full dark:hover:bg-slate-600 hover:bg-slate-400"
//                                                         onClick={() => setSelection(item.name)}
//                                                     >
//                                                         <item.icon />
//                                                         <span>{item.name}</span>
//                                                     </Button>
//                                                 </SidebarMenuButton>
//                                             </SidebarMenuItem>
//                                         ))}
//                                     </SidebarMenu>
//                                 </SidebarGroupContent>
//                             </SidebarGroup>
//                         </SidebarContent>
//                     </Sidebar>
//                     <main className="flex h-[480px] flex-1 flex-col overflow-hidden p-4">
//                         <BuildDialogContent
//                             selection={selection}
//                             userId={userId}
//                             data={docs?.docs}
//                             socket={socket}
//                             setUploadRunning={setUploadRunning}
//                             uploadRunning={uploadRunning}
//                             docsLoading={docsLoading}
//                         />
//                     </main>
//                 </SidebarProvider>
//             </DialogContent>
//         </Dialog>
//     )
// }
