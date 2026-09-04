"use client";

import { useState } from "react";
import { Search, FileText, Clock, ArrowRight, Filter, X } from "lucide-react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  matchCount: number;
  updatedAt: Date;
  type: "document" | "template";
}

const mockResults: SearchResult[] = [
  { id: "doc-1", title: "Product Requirements v2", snippet: "This document outlines the core <mark>requirements</mark> for the Q1 product launch, including user stories and acceptance criteria...", matchCount: 12, updatedAt: new Date(Date.now() - 3600000), type: "document" },
  { id: "doc-2", title: "Q1 Planning Notes", snippet: "Key <mark>requirements</mark> identified during the planning session include performance optimization and security audit...", matchCount: 5, updatedAt: new Date(Date.now() - 7200000), type: "document" },
  { id: "doc-3", title: "Design System Guidelines", snippet: "Component <mark>requirements</mark> for the design system include accessibility compliance and responsive behavior...", matchCount: 8, updatedAt: new Date(Date.now() - 86400000), type: "document" },
  { id: "doc-4", title: "API Documentation", snippet: "API rate limiting <mark>requirements</mark> and authentication specifications for the document management service...", matchCount: 3, updatedAt: new Date(Date.now() - 172800000), type: "document" },
  { id: "t1", title: "PRD Template", snippet: "Standard PRD template with sections for <mark>requirements</mark>, user stories, and technical specifications...", matchCount: 2, updatedAt: new Date(Date.now() - 604800000), type: "template" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("requirements");
  const [activeFilter, setActiveFilter] = useState<"all" | "documents" | "templates">("all");

  const results = mockResults.filter((r) => {
    if (activeFilter === "documents") return r.type === "document";
    if (activeFilter === "templates") return r.type === "template";
    return true;
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Search</h1>
          <Badge variant="secondary" className="text-xs">{results.length} results</Badge>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents, templates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 pl-12 text-base"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className={activeFilter === "all" ? "bg-gray-900 text-white" : ""}
            >
              All
            </Button>
            <Button
              variant={activeFilter === "documents" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("documents")}
              className={activeFilter === "documents" ? "bg-gray-900 text-white" : ""}
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Documents
            </Button>
            <Button
              variant={activeFilter === "templates" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("templates")}
              className={activeFilter === "templates" ? "bg-gray-900 text-white" : ""}
            >
              Templates
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <Filter className="h-3.5 w-3.5" /> More filters
            </Button>
          </div>

          <div className="space-y-1">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.type === "document" ? `/documents/${result.id}` : `/templates/${result.id}`}
                className="group block rounded-lg border border-transparent p-4 transition-colors hover:border-gray-200 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {result.type === "document" ? "📝" : "📋"}
                      </span>
                      <h3 className="text-sm font-medium text-gray-900 group-hover:text-violet-600">
                        {result.title}
                      </h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {result.type}
                      </Badge>
                    </div>
                    <p
                      className="mt-1.5 text-sm text-gray-600 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: result.snippet }}
                    />
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(result.updatedAt)}
                      </span>
                      <span>{result.matchCount} matches</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>

          {results.length === 0 && query && (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-gray-300" />
              <h3 className="mt-3 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">Try different keywords or adjust your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
