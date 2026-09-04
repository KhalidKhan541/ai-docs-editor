import { generateId } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommentStatus = "open" | "resolved" | "archived";

export type CommentReaction = {
  emoji: string;
  userId: string;
  createdAt: string;
};

export type CommentMention = {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
};

export type Comment = {
  id: string;
  documentId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  mentions: CommentMention[];
  reactions: CommentReaction[];
  status: CommentStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  selectionAnchor: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type CommentFilter = {
  status?: CommentStatus | CommentStatus[];
  authorId?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  hasMentions?: boolean;
};

export type CreateCommentPayload = {
  documentId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId?: string | null;
  selectionAnchor: string;
  mentions?: CommentMention[];
  assignedTo?: string | null;
  assignedToName?: string | null;
};

export type UpdateCommentPayload = {
  content?: string;
  status?: CommentStatus;
  assignedTo?: string | null;
  assignedToName?: string | null;
};

export type CommentEventListener = (event: CommentEvent) => void;

export type CommentEventType =
  | "comment:created"
  | "comment:updated"
  | "comment:deleted"
  | "comment:resolved"
  | "comment:unresolved"
  | "comment:reaction:added"
  | "comment:reaction:removed"
  | "comment:assigned"
  | "comment:reply:created";

export type CommentEvent = {
  type: CommentEventType;
  comment: Comment;
  parentId?: string | null;
  actorId: string;
  timestamp: string;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CommentService {
  private comments: Map<string, Comment> = new Map();
  private documentComments: Map<string, Set<string>> = new Map();
  private listeners: Set<CommentEventListener> = new Set();

  // ---- CRUD --------------------------------------------------------------

  createComment(payload: CreateCommentPayload): Comment {
    const now = new Date().toISOString();
    const comment: Comment = {
      id: generateId(),
      documentId: payload.documentId,
      parentId: payload.parentId ?? null,
      authorId: payload.authorId,
      authorName: payload.authorName,
      content: payload.content,
      mentions: payload.mentions ?? [],
      reactions: [],
      status: "open",
      assignedTo: payload.assignedTo ?? null,
      assignedToName: payload.assignedToName ?? null,
      selectionAnchor: payload.selectionAnchor,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolvedBy: null,
    };

    this.comments.set(comment.id, comment);

    const docSet = this.documentComments.get(payload.documentId) ?? new Set();
    docSet.add(comment.id);
    this.documentComments.set(payload.documentId, docSet);

    this.emit({
      type: payload.parentId ? "comment:reply:created" : "comment:created",
      comment,
      parentId: payload.parentId ?? null,
      actorId: payload.authorId,
      timestamp: now,
    });

    return comment;
  }

  getComment(id: string): Comment | undefined {
    return this.comments.get(id);
  }

  updateComment(id: string, payload: UpdateCommentPayload, actorId: string): Comment | undefined {
    const existing = this.comments.get(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const updated: Comment = {
      ...existing,
      content: payload.content ?? existing.content,
      status: payload.status ?? existing.status,
      assignedTo: payload.assignedTo !== undefined ? payload.assignedTo : existing.assignedTo,
      assignedToName: payload.assignedToName !== undefined ? payload.assignedToName : existing.assignedToName,
      updatedAt: now,
      resolvedAt: payload.status === "resolved" ? now : payload.status === "open" ? null : existing.resolvedAt,
      resolvedBy: payload.status === "resolved" ? actorId : payload.status === "open" ? null : existing.resolvedBy,
    };

    this.comments.set(id, updated);

    if (payload.status === "resolved" && existing.status !== "resolved") {
      this.emit({ type: "comment:resolved", comment: updated, actorId, timestamp: now });
    } else if (payload.status === "open" && existing.status !== "open") {
      this.emit({ type: "comment:unresolved", comment: updated, actorId, timestamp: now });
    } else {
      this.emit({ type: "comment:updated", comment: updated, actorId, timestamp: now });
    }

    return updated;
  }

  deleteComment(id: string, actorId: string): boolean {
    const existing = this.comments.get(id);
    if (!existing) return false;

    const now = new Date().toISOString();
    this.comments.delete(id);

    const docSet = this.documentComments.get(existing.documentId);
    docSet?.delete(id);

    this.emit({ type: "comment:deleted", comment: existing, actorId, timestamp: now });
    return true;
  }

  // ---- Thread helpers ----------------------------------------------------

  getReplies(parentId: string): Comment[] {
    const replies: Comment[] = [];
    for (const comment of this.comments.values()) {
      if (comment.parentId === parentId) {
        replies.push(comment);
      }
    }
    return replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getThread(commentId: string): Comment | null {
    const root = this.comments.get(commentId);
    if (!root) return null;
    if (root.parentId) {
      const parent = this.comments.get(root.parentId);
      if (!parent) return root;
      return parent;
    }
    return root;
  }

  getThreadWithReplies(commentId: string): Comment[] {
    const root = this.getThread(commentId);
    if (!root) return [];
    return [root, ...this.getReplies(root.id)];
  }

  // ---- Reactions ---------------------------------------------------------

  addReaction(commentId: string, userId: string, emoji: string, actorId: string): Comment | undefined {
    const comment = this.comments.get(commentId);
    if (!comment) return undefined;

    const exists = comment.reactions.some((r) => r.userId === userId && r.emoji === emoji);
    if (exists) return comment;

    const now = new Date().toISOString();
    comment.reactions.push({ emoji, userId, createdAt: now });
    comment.updatedAt = now;

    this.emit({ type: "comment:reaction:added", comment, actorId, timestamp: now });
    return comment;
  }

  removeReaction(commentId: string, userId: string, emoji: string, actorId: string): Comment | undefined {
    const comment = this.comments.get(commentId);
    if (!comment) return undefined;

    const idx = comment.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
    if (idx === -1) return comment;

    const now = new Date().toISOString();
    comment.reactions.splice(idx, 1);
    comment.updatedAt = now;

    this.emit({ type: "comment:reaction:removed", comment, actorId, timestamp: now });
    return comment;
  }

  getReactionSummary(commentId: string): Map<string, number> {
    const comment = this.comments.get(commentId);
    if (!comment) return new Map();

    const summary = new Map<string, number>();
    for (const reaction of comment.reactions) {
      summary.set(reaction.emoji, (summary.get(reaction.emoji) ?? 0) + 1);
    }
    return summary;
  }

  // ---- Assignment --------------------------------------------------------

  assignComment(commentId: string, assigneeId: string, assigneeName: string, actorId: string): Comment | undefined {
    return this.updateComment(commentId, { assignedTo: assigneeId, assignedToName: assigneeName }, actorId);
  }

  unassignComment(commentId: string, actorId: string): Comment | undefined {
    return this.updateComment(commentId, { assignedTo: null, assignedToName: null }, actorId);
  }

  // ---- Filtering ---------------------------------------------------------

  getDocumentComments(documentId: string): Comment[] {
    const ids = this.documentComments.get(documentId);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.comments.get(id))
      .filter((c): c is Comment => c !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  filterComments(documentId: string, filter: CommentFilter): Comment[] {
    let results = this.getDocumentComments(documentId);

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      results = results.filter((c) => statuses.includes(c.status));
    }

    if (filter.authorId) {
      results = results.filter((c) => c.authorId === filter.authorId);
    }

    if (filter.assignedTo) {
      results = results.filter((c) => c.assignedTo === filter.assignedTo);
    }

    if (filter.dateFrom) {
      const from = new Date(filter.dateFrom).getTime();
      results = results.filter((c) => new Date(c.createdAt).getTime() >= from);
    }

    if (filter.dateTo) {
      const to = new Date(filter.dateTo).getTime();
      results = results.filter((c) => new Date(c.createdAt).getTime() <= to);
    }

    if (filter.hasMentions) {
      results = results.filter((c) => c.mentions.length > 0);
    }

    return results;
  }

  getOpenCommentCount(documentId: string): number {
    return this.getDocumentComments(documentId).filter((c) => c.status === "open").length;
  }

  getResolvedCommentCount(documentId: string): number {
    return this.getDocumentComments(documentId).filter((c) => c.status === "resolved").length;
  }

  // ---- Bulk operations ---------------------------------------------------

  resolveAll(documentId: string, actorId: string): number {
    let count = 0;
    const now = new Date().toISOString();
    for (const comment of this.getDocumentComments(documentId)) {
      if (comment.status === "open") {
        this.updateComment(comment.id, { status: "resolved" }, actorId);
        count++;
      }
    }
    return count;
  }

  archiveAll(documentId: string, actorId: string): number {
    let count = 0;
    for (const comment of this.getDocumentComments(documentId)) {
      if (comment.status !== "archived") {
        this.updateComment(comment.id, { status: "archived" }, actorId);
        count++;
      }
    }
    return count;
  }

  // ---- @Mention extraction ------------------------------------------------

  extractMentions(content: string): CommentMention[] {
    const mentions: CommentMention[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        userId: "",
        username: match[1] ?? "",
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
    return mentions;
  }

  getMentionedUserIds(comments: Comment[]): string[] {
    const userIds = new Set<string>();
    for (const comment of comments) {
      for (const mention of comment.mentions) {
        if (mention.userId) {
          userIds.add(mention.userId);
        }
      }
    }
    return Array.from(userIds);
  }

  // ---- Events ------------------------------------------------------------

  subscribe(listener: CommentEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: CommentEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Swallow listener errors to prevent cascade failures
      }
    }
  }

  // ---- Serialization -----------------------------------------------------

  toJSON(): string {
    const data = {
      comments: Array.from(this.comments.values()),
      documentComments: Object.fromEntries(
        Array.from(this.documentComments.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
    };
    return JSON.stringify(data);
  }

  static fromJSON(json: string): CommentService {
    const service = new CommentService();
    const data = JSON.parse(json) as {
      comments: Comment[];
      documentComments: Record<string, string[]>;
    };

    for (const comment of data.comments) {
      service.comments.set(comment.id, comment);
    }
    for (const [docId, ids] of Object.entries(data.documentComments)) {
      service.documentComments.set(docId, new Set(ids));
    }

    return service;
  }

  clear(): void {
    this.comments.clear();
    this.documentComments.clear();
  }
}

export const commentService = new CommentService();
