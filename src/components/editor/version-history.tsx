"use client";

import { useState } from "react";
import { GitCompare, RotateCcw, Eye, Tag, Check, Minus } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Version {
  id: string;
  title: string;
  author: { name: string; image?: string };
  createdAt: Date;
  label?: string;
  changes: { added: number; removed: number };
}

interface VersionHistoryProps {
  versionA: Version;
  versionB: Version;
}

export default function VersionHistory({ versionA, versionB }: VersionHistoryProps) {
  const [showDiff, setShowDiff] = useState(true);

  const mockDiff = [
    { type: "unchanged" as const, content: "This document outlines the core requirements" },
    { type: "removed" as const, content: "for the Q1 product launch." },
    { type: "added" as const, content: "for the Q2 product launch, including expanded scope." },
    { type: "unchanged" as const, content: "" },
    { type: "unchanged" as const, content: "## Overview" },
    { type: "unchanged" as const, content: "" },
    { type: "removed" as const, content: "The goal is to ship the MVP by March." },
    { type: "added" as const, content: "The goal is to ship a comprehensive solution by June, with phased rollout starting in April." },
    { type: "unchanged" as const, content: "" },
    { type: "unchanged" as const, content: "## Key Features" },
    { type: "unchanged" as const, content: "" },
    { type: "added" as const, content: "- AI-powered content suggestions" },
    { type: "added" as const, content: "- Real-time collaboration with up to 50 users" },
    { type: "removed" as const, content: "- Basic real-time editing" },
    { type: "unchanged" as const, content: "- Version history and rollback" },
    { type: "added" as const, content: "- Advanced template system" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <GitCompare className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Comparing versions</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showDiff ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDiff(true)}
            className={showDiff ? "bg-gray-900 text-white" : ""}
          >
            Diff view
          </Button>
          <Button
            variant={!showDiff ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDiff(false)}
            className={!showDiff ? "bg-gray-900 text-white" : ""}
          >
            Side by side
          </Button>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <div className="flex-1 border-r border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[8px] bg-violet-100 text-violet-700">
                {getInitials(versionA.author.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-900">{versionA.author.name}</span>
                {versionA.label && <Badge variant="outline" className="text-[9px]">{versionA.label}</Badge>}
              </div>
              <span className="text-[10px] text-gray-500">{formatDate(versionA.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">
                {getInitials(versionB.author.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-900">{versionB.author.name}</span>
                {versionB.label && <Badge variant="outline" className="text-[9px]">{versionB.label}</Badge>}
              </div>
              <span className="text-[10px] text-gray-500">{formatDate(versionB.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {showDiff ? (
          <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white font-mono text-sm">
            {mockDiff.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start border-b border-gray-50 px-4 py-1",
                  line.type === "added" && "bg-green-50",
                  line.type === "removed" && "bg-red-50"
                )}
              >
                <span className="w-6 shrink-0 text-right text-gray-400 text-xs">{i + 1}</span>
                <span className={cn(
                  "ml-3 w-4 shrink-0 text-xs",
                  line.type === "added" && "text-green-600",
                  line.type === "removed" && "text-red-600"
                )}>
                  {line.type === "added" && <Check className="h-3.5 w-3.5" />}
                  {line.type === "removed" && <Minus className="h-3.5 w-3.5" />}
                </span>
                <span className={cn(
                  "flex-1 whitespace-pre-wrap",
                  line.type === "added" && "text-green-800",
                  line.type === "removed" && "text-red-800 line-through"
                )}>
                  {line.content || "\u00A0"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mx-auto max-w-5xl">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3">Version A</h3>
              <div className="prose prose-sm text-gray-700">
                <p>This document outlines the core requirements for the Q1 product launch.</p>
                <h4>Overview</h4>
                <p>The goal is to ship the MVP by March.</p>
                <h4>Key Features</h4>
                <ul>
                  <li>Basic real-time editing</li>
                  <li>Version history and rollback</li>
                </ul>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3">Version B</h3>
              <div className="prose prose-sm text-gray-700">
                <p>This document outlines the core requirements for the Q2 product launch, including expanded scope.</p>
                <h4>Overview</h4>
                <p>The goal is to ship a comprehensive solution by June, with phased rollout starting in April.</p>
                <h4>Key Features</h4>
                <ul>
                  <li>AI-powered content suggestions</li>
                  <li>Real-time collaboration with up to 50 users</li>
                  <li>Version history and rollback</li>
                  <li>Advanced template system</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Added
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Removed
          </span>
          <span>{versionA.changes.added + versionB.changes.added} additions, {versionA.changes.removed + versionB.changes.removed} deletions</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button size="sm" className="gap-1.5 bg-gray-900 text-white hover:bg-gray-800">
            <RotateCcw className="h-3.5 w-3.5" /> Restore Version A
          </Button>
        </div>
      </div>
    </div>
  );
}
