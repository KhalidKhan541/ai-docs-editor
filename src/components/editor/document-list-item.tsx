"use client";

import Link from "next/link";
import { Star, MoreHorizontal, Users } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface DocumentListItemProps {
  document: Document;
}

export default function DocumentListItem({ document }: DocumentListItemProps) {
  return (
    <Link href={`/documents/${document.id}`}>
      <div className="group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
        <span className="text-xl shrink-0">{document.icon}</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-violet-600 transition-colors">
              {document.title}
            </h3>
            {document.isPublished && (
              <Badge variant="secondary" className="text-[9px] shrink-0">Published</Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(document.updatedAt)}</span>
            <span className="flex items-center gap-1">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[7px] bg-gray-100 text-gray-600">
                  {getInitials(document.owner.name)}
                </AvatarFallback>
              </Avatar>
              {document.owner.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {document.collaboratorCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5" />
              {document.collaboratorCount}
            </div>
          )}
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
    </Link>
  );
}
