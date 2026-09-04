"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MessageSquare, History, Globe, Share2, MoreHorizontal,
  Star, Download, Trash2, Copy, Eye, Lock, Users
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import DocumentEditor from "@/components/editor/document-editor";
import Collaborators from "@/components/editor/collaborators";

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const [title, setTitle] = useState("Product Requirements v2");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isStarred, setIsStarred] = useState(true);
  const [wordCount, setWordCount] = useState(2847);

  const collaborators = [
    { id: "1", name: "John Doe", image: "", color: "#7c3aed", isActive: true, role: "owner" as const },
    { id: "2", name: "Jane Smith", image: "", color: "#2563eb", isActive: true, role: "editor" as const },
    { id: "3", name: "Alex Chen", image: "", color: "#16a34a", isActive: false, role: "editor" as const },
  ];

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setLastSaved(new Date());
    setIsSaving(false);
  }, []);

  const handleContentChange = useCallback(() => {
    const timeout = setTimeout(handleSave, 1500);
    return () => clearTimeout(timeout);
  }, [handleSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <span className="text-xl">{isStarred ? "📋" : "📝"}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none bg-transparent text-lg font-semibold text-gray-900 outline-none focus:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsStarred(!isStarred)}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" /> Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Saved {formatTime(lastSaved)}
              </span>
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{wordCount.toLocaleString()} words</span>
          <Separator orientation="vertical" className="h-6" />
          <Collaborators collaborators={collaborators} />
          <Separator orientation="vertical" className="h-6" />
          <Link href={`/documents/${docId}/comments`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/documents/${docId}/versions`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <History className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/documents/${docId}/publish`}>
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
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" /> Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" /> Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Lock className="mr-2 h-4 w-4" /> Lock editing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className="mr-2 h-4 w-4" /> Manage access
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Move to trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <DocumentEditor
        documentId={docId}
        onContentChange={handleContentChange}
        onWordCountChange={setWordCount}
      />
    </div>
  );
}
