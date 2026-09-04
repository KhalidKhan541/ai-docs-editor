import type { InlineStyle } from "./document";

export type CommentStatus = "open" | "resolved" | "deleted";

export type CommentReaction = "thumbsup" | "thumbsdown" | "heart" | "laugh" | "sad" | "confused";

export interface CommentMention {
  userId: string;
  startOffset: number;
  endOffset: number;
}

export interface CommentReactionData {
  userId: string;
  reaction: CommentReaction;
  createdAt: string;
}

export interface Comment {
  id: string;
  threadId: string;
  content: string;
  htmlContent?: string;
  mentions: CommentMention[];
  reactions: CommentReactionData[];
  status: CommentStatus;
  isEdited: boolean;
  editedAt?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CommentThread {
  id: string;
  documentId: string;
  blockId?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  status: CommentStatus;
  comments: Comment[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ThreadSelection {
  blockId: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  styles?: InlineStyle[];
}

export interface CommentFilter {
  status?: CommentStatus;
  userId?: string;
  blockId?: string;
  dateFrom?: string;
  dateTo?: string;
  hasMention?: boolean;
}

export interface CommentNotification {
  id: string;
  type: "new_comment" | "reply" | "mention" | "resolved" | "reaction";
  threadId: string;
  commentId: string;
  documentId: string;
  documentTitle: string;
  fromUserId: string;
  fromUserName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CommentStats {
  totalThreads: number;
  openThreads: number;
  resolvedThreads: number;
  totalComments: number;
  myOpenThreads: number;
  mentionedMe: number;
}

export interface CommentSortOptions {
  sortBy: "createdAt" | "updatedAt" | "commentCount";
  sortOrder: "asc" | "desc";
}
