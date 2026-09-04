"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, FileText, Clock, ArrowRight, X, Command, Hash
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  type: "document" | "template" | "folder";
  updatedAt: Date;
  icon: string;
}

const recentSearches = ["API documentation", "sprint planning", "brand guidelines"];
const quickActions = [
  { label: "New document", shortcut: "⌘N", href: "/" },
  { label: "New template", shortcut: "⌘⇧N", href: "/templates" },
  { label: "Search settings", shortcut: "⌘,", href: "/settings" },
];

const mockResults: SearchResult[] = [
  { id: "doc-1", title: "Product Requirements v2", type: "document", updatedAt: new Date(Date.now() - 3600000), icon: "📋" },
  { id: "doc-2", title: "Q1 Planning Notes", type: "document", updatedAt: new Date(Date.now() - 7200000), icon: "📝" },
  { id: "doc-3", title: "Design System Guidelines", type: "document", updatedAt: new Date(Date.now() - 86400000), icon: "🎨" },
  { id: "t1", title: "PRD Template", type: "template", updatedAt: new Date(Date.now() - 604800000), icon: "📋" },
];

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredResults = query
    ? mockResults.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents, templates, folders..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">ESC</kbd>
        </div>

        <ScrollArea className="max-h-80">
          {query ? (
            <div className="p-2">
              {filteredResults.length > 0 ? (
                filteredResults.map((result, i) => (
                  <Link
                    key={result.id}
                    href={result.type === "document" ? `/documents/${result.id}` : `/templates/${result.id}`}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      i === selectedIndex ? "bg-violet-50 text-violet-900" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-lg">{result.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-xs text-gray-500 capitalize">{result.type} · {formatDate(result.updatedAt)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                  </Link>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          ) : (
            <div className="p-2">
              {recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Recent searches
                  </div>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="flex-1 text-left">{search}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Quick actions
                </div>
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Hash className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="flex-1 text-left">{action.label}</span>
                    <kbd className="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {action.shortcut}
                    </kbd>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[9px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[9px]">↵</kbd> Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 text-[9px]">esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
