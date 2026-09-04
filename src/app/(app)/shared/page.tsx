"use client";

import { useState } from "react";
import { Users, Search, Grid3X3, List, Filter, ArrowUpDown } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DocumentCard from "@/components/editor/document-card";
import DocumentListItem from "@/components/editor/document-list-item";

interface SharedDoc {
  id: string;
  title: string;
  icon: string;
  updatedAt: Date;
  sharedBy: { name: string; image?: string };
  role: "editor" | "viewer";
  preview?: string;
  collaboratorCount: number;
  isFavorite: boolean;
  isPublished: boolean;
}

const mockSharedDocs: SharedDoc[] = [
  { id: "doc-s1", title: "Marketing Campaign Brief", icon: "📣", updatedAt: new Date(Date.now() - 3600000), sharedBy: { name: "Sarah Kim" }, role: "editor", preview: "Q2 marketing campaign strategy and creative brief for the product launch...", collaboratorCount: 5, isFavorite: false, isPublished: false },
  { id: "doc-s2", title: "Engineering Architecture", icon: "🏗️", updatedAt: new Date(Date.now() - 7200000), sharedBy: { name: "Alex Chen" }, role: "viewer", preview: "System architecture overview for the new microservices migration...", collaboratorCount: 8, isFavorite: true, isPublished: true },
  { id: "doc-s3", title: "Investor Update", icon: "📈", updatedAt: new Date(Date.now() - 86400000), sharedBy: { name: "Jane Smith" }, role: "editor", preview: "Monthly investor update with financial metrics and growth indicators...", collaboratorCount: 3, isFavorite: false, isPublished: false },
  { id: "doc-s4", title: "Design System Changelog", icon: "🎨", updatedAt: new Date(Date.now() - 172800000), sharedBy: { name: "Marcus Lee" }, role: "editor", preview: "Latest updates to the design system including new components and tokens...", collaboratorCount: 4, isFavorite: false, isPublished: true },
];

export default function SharedPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = mockSharedDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Shared with me</h1>
          <Badge variant="secondary" className="text-xs">{mockSharedDocs.length} documents</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-r-none" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-l-none" onClick={() => setViewMode("list")}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search shared documents..." className="w-80 pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowUpDown className="h-3.5 w-3.5" /> Sort
          </Button>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Documents shared by others</h2>
        </div>

        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          <div className="space-y-1 rounded-xl border border-gray-200 bg-white">
            {filteredDocs.map((doc) => (
              <DocumentListItem key={doc.id} document={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
