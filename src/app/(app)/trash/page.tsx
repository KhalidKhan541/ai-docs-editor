"use client";

import { useState } from "react";
import {
  Trash2, Search, Undo2, XCircle, Clock, FileText, MoreHorizontal
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface TrashDoc {
  id: string;
  title: string;
  icon: string;
  deletedAt: Date;
  originalOwner: { name: string };
  daysUntilPermanentDeletion: number;
}

const mockTrash: TrashDoc[] = [
  { id: "doc-t1", title: "Old Meeting Notes", icon: "📝", deletedAt: new Date(Date.now() - 86400000), originalOwner: { name: "John Doe" }, daysUntilPermanentDeletion: 29 },
  { id: "doc-t2", title: "Draft Blog Post", icon: "📰", deletedAt: new Date(Date.now() - 172800000), originalOwner: { name: "John Doe" }, daysUntilPermanentDeletion: 28 },
  { id: "doc-t3", title: "Exploration Notes", icon: "🔍", deletedAt: new Date(Date.now() - 604800000), originalOwner: { name: "John Doe" }, daysUntilPermanentDeletion: 22 },
];

export default function TrashPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = mockTrash.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Trash</h1>
          <Badge variant="secondary" className="text-xs">{mockTrash.length} documents</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Empty trash
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search trash..." className="w-80 pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="grid grid-cols-[1fr_150px_120px_80px] gap-4 text-xs font-medium text-gray-500">
              <span>Name</span>
              <span>Deleted</span>
              <span>Original owner</span>
              <span></span>
            </div>
          </div>
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 border-b border-gray-50 px-4 py-3 last:border-0 hover:bg-gray-50">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-xl shrink-0">{doc.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDate(doc.deletedAt)}
              </div>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[8px] bg-gray-100 text-gray-600">
                    {getInitials(doc.originalOwner.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500">{doc.originalOwner.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-gray-600">
                  <Undo2 className="h-3 w-3" /> Restore
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Undo2 className="mr-2 h-3.5 w-3.5" /> Restore
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <XCircle className="mr-2 h-3.5 w-3.5" /> Delete permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Trash2 className="h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">Trash is empty</h3>
            <p className="mt-1 text-sm text-gray-500">Deleted documents will appear here.</p>
          </div>
        )}

        <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Automatic deletion</h3>
              <p className="mt-1 text-sm text-amber-700">
                Documents in trash are permanently deleted after 30 days. Restore important documents before then.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
