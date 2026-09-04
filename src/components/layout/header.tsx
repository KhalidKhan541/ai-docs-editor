"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, MessageSquare, History, Globe, Share2, MoreHorizontal,
  Star, Download, Trash2, Copy, Eye, Lock, Users, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  onTitleChange?: (title: string) => void;
  isStarred?: boolean;
  onStarToggle?: () => void;
  isSaving?: boolean;
  lastSaved?: Date;
  wordCount?: number;
  documentId: string;
}

export default function Header({
  title,
  onTitleChange,
  isStarred = false,
  onStarToggle,
  isSaving = false,
  lastSaved,
  wordCount = 0,
  documentId,
}: HeaderProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="border-none bg-transparent text-lg font-semibold text-gray-900 outline-none focus:ring-0"
          />
          {onStarToggle && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStarToggle}>
              <Star className={cn("h-4 w-4", isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-400")} />
            </Button>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" /> Saving...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Saved {formatTime(lastSaved)}
            </span>
          ) : (
            "Draft"
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {wordCount > 0 && (
          <>
            <span className="text-xs text-gray-500">{wordCount.toLocaleString()} words</span>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}
        <div className="flex -space-x-2">
          {["bg-violet-500", "bg-blue-500", "bg-green-500"].map((color, i) => (
            <div key={i} className={`h-6 w-6 rounded-full ${color} border-2 border-white flex items-center justify-center text-[8px] text-white font-bold`}>
              {["JD", "JS", "AC"][i]}
            </div>
          ))}
        </div>
        <Separator orientation="vertical" className="h-6" />
        <Link href={`/documents/${documentId}/comments`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/documents/${documentId}/versions`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <History className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/documents/${documentId}/publish`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Globe className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Export as PDF</DropdownMenuItem>
            <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Export as Markdown</DropdownMenuItem>
            <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Lock className="mr-2 h-4 w-4" /> Lock editing</DropdownMenuItem>
            <DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Manage access</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Move to trash</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
