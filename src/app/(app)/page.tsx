"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, LayoutGrid, List, Search, Clock, Star, Users,
  FileText, MoreHorizontal, FolderPlus, ArrowUpDown, Filter,
  Grid3X3
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import DocumentCard from "@/components/editor/document-card";
import DocumentListItem from "@/components/editor/document-list-item";

interface Document {
  id: string;
  title: string;
  icon: string;
  updatedAt: Date;
  owner: { name: string; image?: string };
  collaboratorCount: number;
  isFavorite: boolean;
  isPublished: boolean;
  preview?: string;
}

const mockDocs: Document[] = [
  { id: "doc-1", title: "Product Requirements v2", icon: "📋", updatedAt: new Date(Date.now() - 3600000), owner: { name: "John Doe" }, collaboratorCount: 4, isFavorite: true, isPublished: true, preview: "This document outlines the core requirements for the Q1 product launch, including user stories, acceptance criteria, and technical specifications..." },
  { id: "doc-2", title: "Q1 Planning Notes", icon: "📝", updatedAt: new Date(Date.now() - 7200000), owner: { name: "Jane Smith" }, collaboratorCount: 6, isFavorite: false, isPublished: false, preview: "Meeting notes from the Q1 planning session. Key decisions around resource allocation and timeline..." },
  { id: "doc-3", title: "Design System Guidelines", icon: "🎨", updatedAt: new Date(Date.now() - 86400000), owner: { name: "John Doe" }, collaboratorCount: 3, isFavorite: true, isPublished: true, preview: "Comprehensive guide to our design system including color tokens, typography, spacing, and component patterns..." },
  { id: "doc-4", title: "API Documentation", icon: "🔌", updatedAt: new Date(Date.now() - 172800000), owner: { name: "Alex Chen" }, collaboratorCount: 2, isFavorite: false, isPublished: true, preview: "REST API endpoints for the document management service. Authentication, CRUD operations, and webhook integration..." },
  { id: "doc-5", title: "Brand Guidelines", icon: "✨", updatedAt: new Date(Date.now() - 259200000), owner: { name: "Sarah Kim" }, collaboratorCount: 5, isFavorite: true, isPublished: false, preview: "Brand identity guidelines including logo usage, color palette, typography, and tone of voice..." },
  { id: "doc-6", title: "Sprint Retrospective", icon: "🔄", updatedAt: new Date(Date.now() - 345600000), owner: { name: "John Doe" }, collaboratorCount: 8, isFavorite: false, isPublished: false, preview: "Retrospective notes from Sprint 24. What went well, what could be improved, action items..." },
];

export default function DocumentsHomePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "owner">("recent");

  const sortedDocs = [...mockDocs].sort((a, b) => {
    if (sortBy === "recent") return b.updatedAt.getTime() - a.updatedAt.getTime();
    if (sortBy === "name") return a.title.localeCompare(b.title);
    return a.owner.name.localeCompare(b.owner.name);
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">My Documents</h1>
          <Badge variant="secondary" className="text-xs">{mockDocs.length} documents</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
            <FolderPlus className="h-4 w-4" />
            New folder
          </Button>
          <Button size="sm" className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
            <Plus className="h-4 w-4" />
            New document
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search documents..." className="w-80 pl-10" />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("recent")}>
                  <Clock className="mr-2 h-4 w-4" /> Last modified
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  <FileText className="mr-2 h-4 w-4" /> Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("owner")}>
                  <Users className="mr-2 h-4 w-4" /> Owner
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex rounded-lg border border-gray-200 bg-white">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="mr-1.5 h-3.5 w-3.5" /> Recent
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="mr-1.5 h-3.5 w-3.5" /> Favorites
            </TabsTrigger>
            <TabsTrigger value="shared">
              <Users className="mr-1.5 h-3.5 w-3.5" /> Shared
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedDocs.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
            <button className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600">
              <Plus className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">New document</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1 rounded-xl border border-gray-200 bg-white">
            {sortedDocs.map((doc) => (
              <DocumentListItem key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
