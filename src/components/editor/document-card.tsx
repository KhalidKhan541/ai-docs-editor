"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, MoreHorizontal, FileText, Users } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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

interface DocumentCardProps {
  document: Document;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/documents/${document.id}`}>
      <div
        className={cn(
          "group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md cursor-pointer",
          isHovered && "ring-2 ring-violet-200"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xl">
            {document.icon}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Star className={cn("h-3.5 w-3.5", document.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Move to folder</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-violet-600 transition-colors">
          {document.title}
        </h3>

        {document.preview && (
          <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">{document.preview}</p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">{formatDate(document.updatedAt)}</span>
          <div className="flex items-center gap-2">
            {document.isPublished && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                Published
              </Badge>
            )}
            {document.collaboratorCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <Users className="h-3 w-3" />
                {document.collaboratorCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
