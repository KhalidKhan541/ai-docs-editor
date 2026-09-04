"use client";

import { useState } from "react";
import { Star, Search, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DocumentCard from "@/components/editor/document-card";
import DocumentListItem from "@/components/editor/document-list-item";

interface FavoriteDoc {
  id: string;
  title: string;
  icon: string;
  updatedAt: Date;
  owner: { name: string; image?: string };
  collaboratorCount: number;
  isFavorite: true;
  isPublished: boolean;
  preview?: string;
}

const mockFavorites: FavoriteDoc[] = [
  { id: "doc-f1", title: "Product Requirements v2", icon: "📋", updatedAt: new Date(Date.now() - 3600000), owner: { name: "John Doe" }, collaboratorCount: 4, isFavorite: true, isPublished: true, preview: "This document outlines the core requirements for the Q1 product launch..." },
  { id: "doc-f2", title: "Design System Guidelines", icon: "🎨", updatedAt: new Date(Date.now() - 86400000), owner: { name: "John Doe" }, collaboratorCount: 3, isFavorite: true, isPublished: true, preview: "Comprehensive guide to our design system including color tokens..." },
  { id: "doc-f3", title: "Brand Guidelines", icon: "✨", updatedAt: new Date(Date.now() - 259200000), owner: { name: "Sarah Kim" }, collaboratorCount: 5, isFavorite: true, isPublished: false, preview: "Brand identity guidelines including logo usage, color palette..." },
];

export default function FavoritesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = mockFavorites.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Favorites</h1>
          <Badge variant="secondary" className="text-xs">{mockFavorites.length} documents</Badge>
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
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search favorites..." className="w-80 pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
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

        {filteredDocs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Star className="h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No favorites yet</h3>
            <p className="mt-1 text-sm text-gray-500">Star documents to add them to your favorites.</p>
          </div>
        )}
      </div>
    </div>
  );
}
