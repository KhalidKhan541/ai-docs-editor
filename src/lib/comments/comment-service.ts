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
  searchQuery?: string;
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

export type CommentStats = {
  total: number;
  open: number;
  resolved: number;
  archived: number;
  withMentions: number;
  withAssignments: number;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CommentService {
  private comments: Map<string, Comment> = new Map();
  private documentComments: Map<string, Set<string>> = new Map();
  private authorComments: Map<string, Set<string>> = new Map();
  private listeners: Set<CommentEventListener> = new Set();

  // ---- CRUD --------------------------------------------------------------

  createComment(payload: CreateCommentPayload): Comment {
    this.validateCreatePayload(payload);

    const now = new Date().toISOString();
    const comment: Comment = {
      id: generateId(),
      documentId: payload.documentId,
      parentId: payload.parentId ?? null,
      authorId: payload.authorId,
      authorName: payload.authorName,
      content: this.sanitizeContent(payload.content),
      mentions: payload.mentions ?? this.extractMentions(payload.content),
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
    this.indexDocument(comment.documentId, comment.id);
    this.indexAuthor(comment.authorId, comment.id);

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
    const previousStatus = existing.status;
    const newStatus = payload.status ?? existing.status;

    const updated: Comment = {
      ...existing,
      content: payload.content !== undefined ? this.sanitizeContent(payload.content) : existing.content,
      mentions: payload.content !== undefined ? this.extractMentions(payload.content) : existing.mentions,
      status: newStatus,
      assignedTo: payload.assignedTo !== undefined ? payload.assignedTo : existing.assignedTo,
      assignedToName: payload.assignedToName !== undefined ? payload.assignedToName : existing.assignedToName,
      updatedAt: now,
      resolvedAt: newStatus === "resolved" ? now : newStatus === "open" ? null : existing.resolvedAt,
      resolvedBy: newStatus === "resolved" ? actorId : newStatus === "open" ? null : existing.resolvedBy,
    };

    this.comments.set(id, updated);

    if (newStatus === "resolved" && previousStatus !== "resolved") {
      this.emit({ type: "comment:resolved", comment: updated, actorId, timestamp: now });
    } else if (newStatus === "open" && previousStatus !== "open") {
      this.emit({ type: "comment:unresolved", comment: updated, actorId, timestamp: now });
    } else if (payload.assignedTo !== undefined) {
      this.emit({ type: "comment:assigned", comment: updated, actorId, timestamp: now });
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
    this.unindexDocument(existing.documentId, id);
    this.unindexAuthor(existing.authorId, id);

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

  getReplyCount(commentId: string): number {
    return this.getReplies(commentId).length;
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

  getReactionSummary(commentId: string): Map<string, { count: number; userIds: string[] }> {
    const comment = this.comments.get(commentId);
    if (!comment) return new Map();

    const summary = new Map<string, { count: number; userIds: string[] }>();
    for (const reaction of comment.reactions) {
      const entry = summary.get(reaction.emoji) ?? { count: 0, userIds: [] };
      entry.count++;
      entry.userIds.push(reaction.userId);
      summary.set(reaction.emoji, entry);
    }
    return summary;
  }

  toggleReaction(commentId: string, userId: string, emoji: string, actorId: string): { added: boolean; comment: Comment | undefined } {
    const comment = this.comments.get(commentId);
    if (!comment) return { added: false, comment: undefined };

    const existingIdx = comment.reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
    if (existingIdx !== -1) {
      this.removeReaction(commentId, userId, emoji, actorId);
      return { added: false, comment: this.comments.get(commentId) };
    }
    this.addReaction(commentId, userId, emoji, actorId);
    return { added: true, comment: this.comments.get(commentId) };
  }

  // ---- Assignment --------------------------------------------------------

  assignComment(commentId: string, assigneeId: string, assigneeName: string, actorId: string): Comment | undefined {
    return this.updateComment(commentId, { assignedTo: assigneeId, assignedToName: assigneeName }, actorId);
  }

  unassignComment(commentId: string, actorId: string): Comment | undefined {
    return this.updateComment(commentId, { assignedTo: null, assignedToName: null }, actorId);
  }

  getAssignedComments(assigneeId: string, documentId?: string): Comment[] {
    let results = Array.from(this.comments.values()).filter((c) => c.assignedTo === assigneeId);
    if (documentId) {
      results = results.filter((c) => c.documentId === documentId);
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.content.toLowerCase().includes(query) ||
          c.authorName.toLowerCase().includes(query)
      );
    }

    return results;
  }

  getDocumentStats(documentId: string): CommentStats {
    const comments = this.getDocumentComments(documentId);
    return {
      total: comments.length,
      open: comments.filter((c) => c.status === "open").length,
      resolved: comments.filter((c) => c.status === "resolved").length,
      archived: comments.filter((c) => c.status === "archived").length,
      withMentions: comments.filter((c) => c.mentions.length > 0).length,
      withAssignments: comments.filter((c) => c.assignedTo !== null).length,
    };
  }

  // ---- Bulk operations ---------------------------------------------------

  resolveAll(documentId: string, actorId: string): number {
    let count = 0;
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

  reopenAll(documentId: string, actorId: string): number {
    let count = 0;
    for (const comment of this.getDocumentComments(documentId)) {
      if (comment.status !== "open") {
        this.updateComment(comment.id, { status: "open" }, actorId);
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

  // ---- Validation & sanitization -----------------------------------------

  private validateCreatePayload(payload: CreateCommentPayload): void {
    if (!payload.documentId) throw new Error("Document ID is required");
    if (!payload.authorId) throw new Error("Author ID is required");
    if (!payload.authorName) throw new Error("Author name is required");
    if (!payload.content.trim()) throw new Error("Comment content cannot be empty");
    if (payload.content.length > 5000) throw new Error("Comment content exceeds maximum length of 5000 characters");
  }

  private sanitizeContent(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .trim();
  }

  // ---- Index helpers -----------------------------------------------------

  private indexDocument(documentId: string, commentId: string): void {
    const docSet = this.documentComments.get(documentId) ?? new Set();
    docSet.add(commentId);
    this.documentComments.set(documentId, docSet);
  }

  private unindexDocument(documentId: string, commentId: string): void {
    const docSet = this.documentComments.get(documentId);
    docSet?.delete(commentId);
  }

  private indexAuthor(authorId: string, commentId: string): void {
    const authorSet = this.authorComments.get(authorId) ?? new Set();
    authorSet.add(commentId);
    this.authorComments.set(authorId, authorSet);
  }

  private unindexAuthor(authorId: string, commentId: string): void {
    const authorSet = this.authorComments.get(authorId);
    authorSet?.delete(commentId);
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
      service.indexDocument(comment.documentId, comment.id);
      service.indexAuthor(comment.authorId, comment.id);
    }

    return service;
  }

  clear(): void {
    this.comments.clear();
    this.documentComments.clear();
    this.authorComments.clear();
  }
}

export const commentService = new CommentService();
