"use client";

import { useState } from "react";
import { MessageSquare, Reply, MoreHorizontal, Send, Smile, Paperclip } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Comment {
  id: string;
  content: string;
  author: { name: string; image?: string };
  blockId?: string;
  resolved: boolean;
  createdAt: Date;
  replies: Comment[];
}

interface CommentsPanelProps {
  comments: Comment[];
  onAddComment?: (content: string) => void;
  onResolve?: (commentId: string) => void;
  onReply?: (commentId: string, content: string) => void;
}

export default function CommentsPanel({
  comments,
  onAddComment,
  onResolve,
  onReply,
}: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const openComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment?.(newComment);
      setNewComment("");
    }
  };

  const handleReply = (commentId: string) => {
    if (replyContent.trim()) {
      onReply?.(commentId, replyContent);
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Comments</span>
          <Badge variant="secondary" className="text-[10px]">{openComments.length}</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {openComments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-start gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700">
                    {getInitials(comment.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">{comment.author.name}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700"
                    >
                      <Reply className="h-3 w-3" /> Reply
                    </button>
                    <button
                      onClick={() => onResolve?.(comment.id)}
                      className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-green-600"
                    >
                      Resolve
                    </button>
                  </div>

                  {comment.replies.length > 0 && (
                    <div className="mt-2 space-y-2 border-l-2 border-gray-100 pl-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarFallback className="text-[7px] bg-gray-100 text-gray-600">
                              {getInitials(reply.author.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-gray-900">{reply.author.name}</span>
                              <span className="text-[9px] text-gray-400">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-gray-600">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {replyingTo === comment.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Reply..."
                        className="h-7 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleReply(comment.id);
                          if (e.key === "Escape") setReplyingTo(null);
                        }}
                        autoFocus
                      />
                      <Button size="icon" className="h-7 w-7" onClick={() => handleReply(comment.id)}>
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {resolvedComments.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Resolved ({resolvedComments.length})
              </div>
              {resolvedComments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 opacity-60">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[8px] bg-gray-200 text-gray-500">
                        {getInitials(comment.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-gray-700">{comment.author.name}</span>
                        <Badge variant="secondary" className="text-[8px]">Resolved</Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700">JD</AvatarFallback>
          </Avatar>
          <div className="relative flex-1">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="h-8 text-xs pr-20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleSubmit();
              }}
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Smile className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Paperclip className="h-3 w-3" />
              </Button>
              <Button size="icon" className="h-6 w-6" onClick={handleSubmit} disabled={!newComment.trim()}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
