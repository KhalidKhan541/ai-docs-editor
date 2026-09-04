"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown, ChevronRight, FolderOpen, FolderClosed,
  FileText, Plus, MoreHorizontal, Trash2, Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
  documentCount: number;
}

interface FolderTreeProps {
  folders: FolderNode[];
  onAddFolder?: (parentId?: string) => void;
  onRenameFolder?: (folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export default function FolderTree({
  folders,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  return (
    <div className="space-y-0.5">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          level={0}
          onAddFolder={onAddFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
      <button
        onClick={() => onAddFolder?.()}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add folder</span>
      </button>
    </div>
  );
}

function FolderItem({
  folder,
  level,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  folder: FolderNode;
  level: number;
  onAddFolder?: (parentId?: string) => void;
  onRenameFolder?: (folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-gray-50",
          "text-gray-600 hover:text-gray-900"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-gray-200"
          >
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}

        {isOpen ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <FolderClosed className="h-4 w-4 shrink-0 text-amber-500" />
        )}

        <span className="flex-1 truncate">{folder.name}</span>

        <span className="text-[10px] text-gray-400 mr-1">{folder.documentCount}</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onAddFolder?.(folder.id)}>
              <FolderOpen className="mr-2 h-3.5 w-3.5" /> Add subfolder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRenameFolder?.(folder.id)}>
              <Edit2 className="mr-2 h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDeleteFolder?.(folder.id)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isOpen && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              onAddFolder={onAddFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
