"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText, Star, Users, Trash2, Settings, Search, FolderOpen,
  ChevronDown, ChevronRight, Plus, Clock, Zap, LogOut, Bell,
  Command, MoreHorizontal
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [folders, setFolders] = useState([
    { id: "1", name: "Product", isOpen: true, documentCount: 12 },
    { id: "2", name: "Engineering", isOpen: false, documentCount: 8 },
    { id: "3", name: "Marketing", isOpen: false, documentCount: 5 },
  ]);

  const toggleFolder = (id: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isOpen: !f.isOpen } : f))
    );
  };

  const navItems = [
    { href: "/", icon: Clock, label: "Recent" },
    { href: "/favorites", icon: Star, label: "Favorites" },
    { href: "/shared", icon: Users, label: "Shared", badge: 3 },
    { href: "/templates", icon: FileText, label: "Templates" },
    { href: "/trash", icon: Trash2, label: "Trash" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">DocuFlow</span>
          </Link>
        )}
      </div>

      <div className="p-3">
        <Button className="w-full justify-start gap-2 bg-gray-900 text-white hover:bg-gray-800" size="sm">
          <Plus className="h-4 w-4" />
          {!collapsed && "New document"}
        </Button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-gray-600"
            size="sm"
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
              {!collapsed && (
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

        {!collapsed && (
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
                    {folder.isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                    <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="flex-1 text-left">{folder.name}</span>
                    <span className="text-xs text-gray-400">{folder.documentCount}</span>
                  </button>
                  {folder.isOpen && (
                    <div className="ml-6 space-y-0.5 border-l border-gray-100 pl-3">
                      {["Requirements", "Planning"].slice(0, Math.min(2, folder.documentCount)).map((name, i) => (
                        <Link
                          key={i}
                          href={`/documents/doc-${i}`}
                          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </ScrollArea>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">JD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">John Doe</div>
                <div className="text-xs text-gray-500 truncate">john@example.com</div>
              </div>
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
