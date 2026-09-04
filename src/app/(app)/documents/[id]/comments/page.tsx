"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Check, CheckCheck, MessageSquare, Reply,
  MoreHorizontal, Send, Smile, Paperclip
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommentsPanel from "@/components/editor/comments-panel";

interface Comment {
  id: string;
  content: string;
  author: { name: string; image?: string };
  blockId?: string;
  resolved: boolean;
  createdAt: Date;
  replies: Comment[];
}

const mockComments: Comment[] = [
  {
    id: "c1",
    content: "Should we add performance benchmarks here? The scalability section feels a bit thin without concrete numbers.",
    author: { name: "Jane Smith" },
    blockId: "block-3",
    resolved: false,
    createdAt: new Date(Date.now() - 3600000),
    replies: [
      { id: "c1-r1", content: "Good point! I'll add the P99 latency data from last quarter's load test.", author: { name: "John Doe" }, resolved: false, createdAt: new Date(Date.now() - 1800000), replies: [] },
    ],
  },
  {
    id: "c2",
    content: "The API rate limiting specs need to be aligned with the new tier pricing. Can someone from product review?",
    author: { name: "Alex Chen" },
    resolved: false,
    createdAt: new Date(Date.now() - 7200000),
    replies: [],
  },
  {
    id: "c3",
    content: "LGTM! Great work on the auth flow documentation.",
    author: { name: "Sarah Kim" },
    resolved: true,
    createdAt: new Date(Date.now() - 86400000),
    replies: [],
  },
];

export default function CommentsPage() {
  const params = useParams();
  const docId = params.id as string;
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "resolved">("open");

  const openComments = mockComments.filter((c) => !c.resolved);
  const resolvedComments = mockComments.filter((c) => c.resolved);

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
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">Comments</span>
            <Badge variant="secondary" className="text-xs">{openComments.length} open</Badge>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-gray-200">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "open" | "resolved")}>
              <TabsList>
                <TabsTrigger value="open" className="gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Open ({openComments.length})
                </TabsTrigger>
                <TabsTrigger value="resolved" className="gap-1.5">
                  <CheckCheck className="h-3.5 w-3.5" /> Resolved ({resolvedComments.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-1 px-4 pb-4">
              {(activeTab === "open" ? openComments : resolvedComments).map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    comment.resolved ? "bg-gray-50 opacity-70" : "bg-white hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-violet-100 text-violet-700">
                        {getInitials(comment.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        {comment.resolved && (
                          <Badge variant="secondary" className="text-[10px]">Resolved</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{comment.content}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-gray-500">
                          <Reply className="h-3 w-3" /> Reply
                        </Button>
                        {!comment.resolved && (
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-gray-500">
                            <Check className="h-3 w-3" /> Resolve
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      {comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 border-l-2 border-gray-100 pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600">
                                  {getInitials(reply.author.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-900">{reply.author.name}</span>
                                  <span className="text-[10px] text-gray-500">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-600">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="hidden w-80 xl:block">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900">Comment threads</h3>
            <p className="mt-1 text-xs text-gray-500">Click on a comment to highlight the referenced block in the document.</p>
          </div>
          <Separator />
          <div className="p-4 space-y-3">
            {mockComments.filter((c) => !c.resolved).map((comment) => (
              <div key={comment.id} className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px] bg-violet-100 text-violet-700">
                      {getInitials(comment.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{comment.author.name}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{comment.content}</p>
                {comment.replies.length > 0 && (
                  <p className="mt-1 text-[10px] text-gray-400">{comment.replies.length} replies</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs bg-violet-100 text-violet-700">JD</AvatarFallback>
          </Avatar>
          <div className="relative flex-1">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="pr-24"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Smile className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Paperclip className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" className="h-6 w-6" disabled={!newComment.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
