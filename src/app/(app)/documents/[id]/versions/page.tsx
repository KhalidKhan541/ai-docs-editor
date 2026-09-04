"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, History, RotateCcw, Eye, GitCompare, Tag,
  ChevronRight, Clock, User
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import VersionHistory from "@/components/editor/version-history";

interface Version {
  id: string;
  title: string;
  author: { name: string; image?: string };
  createdAt: Date;
  label?: string;
  changes: { added: number; removed: number };
}

const mockVersions: Version[] = [
  { id: "v8", title: "Updated scalability requirements", author: { name: "John Doe" }, createdAt: new Date(Date.now() - 1800000), label: "Current", changes: { added: 45, removed: 12 } },
  { id: "v7", title: "Added API rate limiting section", author: { name: "Jane Smith" }, createdAt: new Date(Date.now() - 7200000), changes: { added: 120, removed: 8 } },
  { id: "v6", title: "Revised auth flow documentation", author: { name: "Alex Chen" }, createdAt: new Date(Date.now() - 86400000), label: "v2.0", changes: { added: 89, removed: 45 } },
  { id: "v5", title: "Merged review comments", author: { name: "John Doe" }, createdAt: new Date(Date.now() - 172800000), changes: { added: 34, removed: 67 } },
  { id: "v4", title: "Initial draft complete", author: { name: "Sarah Kim" }, createdAt: new Date(Date.now() - 259200000), label: "v1.0", changes: { added: 450, removed: 0 } },
  { id: "v3", title: "Added user stories", author: { name: "John Doe" }, createdAt: new Date(Date.now() - 345600000), changes: { added: 200, removed: 15 } },
  { id: "v2", title: "Structured document outline", author: { name: "Jane Smith" }, createdAt: new Date(Date.now() - 432000000), changes: { added: 150, removed: 30 } },
  { id: "v1", title: "Created document", author: { name: "John Doe" }, createdAt: new Date(Date.now() - 518400000), changes: { added: 50, removed: 0 } },
];

export default function VersionsPage() {
  const params = useParams();
  const docId = params.id as string;
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string, string] | null>(null);

  const handleCompare = (v1: string, v2: string) => {
    setCompareVersions([v1, v2]);
    setCompareMode(true);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-3">
          <Link href={`/documents/${docId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Version History</span>
            <Badge variant="secondary" className="text-xs">{mockVersions.length} versions</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={compareMode ? "secondary" : "ghost"}
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setCompareMode(!compareMode);
              setCompareVersions(null);
            }}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Compare
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 border-r border-gray-200">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {mockVersions.map((version, index) => (
                <button
                  key={version.id}
                  onClick={() => {
                    if (compareMode) {
                      if (!compareVersions) {
                        setCompareVersions([version.id, ""]);
                      } else if (compareVersions[1] === "") {
                        setCompareVersions([compareVersions[0], version.id]);
                      }
                    } else {
                      setSelectedVersion(version.id);
                    }
                  }}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    selectedVersion === version.id
                      ? "border-violet-300 bg-violet-50"
                      : "border-gray-200 hover:bg-gray-50",
                    compareVersions?.includes(version.id) && "border-blue-300 bg-blue-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                        v{mockVersions.length - index}
                      </div>
                      {version.label && (
                        <Badge variant="outline" className="text-[10px]">{version.label}</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{formatDate(version.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-gray-900 line-clamp-1">{version.title}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[7px] bg-violet-100 text-violet-700">
                          {getInitials(version.author.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-gray-500">{version.author.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-green-600">+{version.changes.added}</span>
                      <span className="text-red-600">-{version.changes.removed}</span>
                    </div>
                  </div>
                  {index < mockVersions.length - 1 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      {Math.round((mockVersions[index].createdAt.getTime() - version.createdAt.getTime()) / 3600000)}h difference
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-auto">
          {compareMode && compareVersions && compareVersions[1] ? (
            <VersionHistory
              versionA={mockVersions.find((v) => v.id === compareVersions[0])!}
              versionB={mockVersions.find((v) => v.id === compareVersions[1])!}
            />
          ) : selectedVersion ? (
            <div className="p-6">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {mockVersions.find((v) => v.id === selectedVersion)?.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      By {mockVersions.find((v) => v.id === selectedVersion)?.author.name} ·{" "}
                      {formatDate(mockVersions.find((v) => v.id === selectedVersion)?.createdAt!)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </Button>
                    <Button size="sm" className="gap-1.5 bg-gray-900 text-white hover:bg-gray-800">
                      <RotateCcw className="h-3.5 w-3.5" /> Restore this version
                    </Button>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600">
                    This is a preview of the document content at version {mockVersions.findIndex((v) => v.id === selectedVersion) + 1}. In production, this would render the actual BlockNote document content from the selected version, with added/removed changes highlighted.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <History className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-3 text-sm font-medium text-gray-900">Select a version</h3>
                <p className="mt-1 text-sm text-gray-500">Choose a version from the list to preview its content.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
