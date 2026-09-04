"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText, Star, Users, Trash2, Settings, Search, FolderOpen,
  ChevronDown, ChevronRight, Plus, Clock, Zap, LogOut, Bell,
  Command, LayoutGrid, List, MoreHorizontal, ChevronUp
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface FolderItem {
  id: string;
  name: string;
  isOpen: boolean;
  documentCount: number;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [folders, setFolders] = useState<FolderItem[]>([
    { id: "1", name: "Product", isOpen: true, documentCount: 12 },
    { id: "2", name: "Engineering", isOpen: false, documentCount: 8 },
    { id: "3", name: "Marketing", isOpen: false, documentCount: 5 },
  ]);
  const [recentDocs] = useState([
    { id: "doc-1", title: "Product Requirements v2", updatedAt: new Date(Date.now() - 3600000) },
    { id: "doc-2", title: "Q1 Planning Notes", updatedAt: new Date(Date.now() - 7200000) },
    { id: "doc-3", title: "Design System Guidelines", updatedAt: new Date(Date.now() - 86400000) },
  ]);

  const toggleFolder = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isOpen: !f.isOpen } : f))
    );
  };

  const navItems = [
    { href: "/", icon: Clock, label: "Recent", badge: null },
    { href: "/favorites", icon: Star, label: "Favorites", badge: null },
    { href: "/shared", icon: Users, label: "Shared with me", badge: 3 },
    { href: "/templates", icon: LayoutGrid, label: "Templates", badge: null },
    { href: "/trash", icon: Trash2, label: "Trash", badge: null },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("open-search"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside
        className={cn(
          "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">DocuFlow</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            <ChevronUp className={cn("h-4 w-4 transition-transform", sidebarCollapsed ? "rotate-90" : "-rotate-90")} />
          </Button>
        </div>

        <div className="p-3">
          <Button className="w-full justify-start gap-2 bg-gray-900 text-white hover:bg-gray-800" size="sm">
            <Plus className="h-4 w-4" />
            {!sidebarCollapsed && "New document"}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <div className="px-3 pb-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-gray-600"
              size="sm"
              onClick={() => document.dispatchEvent(new CustomEvent("open-search"))}
            >
              <Search className="h-4 w-4" />
              Search
              <kbd className="ml-auto rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                <Command className="inline h-2.5 w-2.5" />K
              </kbd>
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 px-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <>
              <Separator className="my-4" />

              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Folders</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {folders.map((folder) => (
                  <div key={folder.id}>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      {folder.isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
                      <span className="flex-1 text-left">{folder.name}</span>
                      <span className="text-xs text-gray-400">{folder.documentCount}</span>
                    </button>
                    {folder.isOpen && (
                      <div className="ml-6 space-y-0.5 border-l border-gray-100 pl-3">
                        {recentDocs.slice(0, 2).map((doc) => (
                          <Link
                            key={doc.id}
                            href={`/documents/${doc.id}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{doc.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-1 px-3 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Recent</span>
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{doc.title}</div>
                      <div className="text-xs text-gray-400">{formatDate(doc.updatedAt)}</div>
                    </div>
                    <MoreHorizontal className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </ScrollArea>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">JD</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">John Doe</div>
                <div className="text-xs text-gray-500 truncate">john@example.com</div>
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Bell className="h-3.5 w-3.5" />
                </Button>
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
