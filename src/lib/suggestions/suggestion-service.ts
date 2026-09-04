import { generateId } from "@/lib/utils";
import type { CommentMention } from "@/lib/comments/comment-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SuggestionType = "insertion" | "deletion" | "formatting" | "replacement";

export type SuggestionStatus = "pending" | "accepted" | "rejected";

export type SuggestionChange = {
  type: SuggestionType;
  startOffset: number;
  endOffset: number;
  oldText: string;
  newText: string;
  formatting?: Record<string, unknown>;
  blockId?: string;
};

export type SuggestionComment = {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: CommentMention[];
  createdAt: string;
};

export type Suggestion = {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  change: SuggestionChange;
  status: SuggestionStatus;
  comments: SuggestionComment[];
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
};

export type SuggestionSnapshot = {
  suggestions: Suggestion[];
  snapshotAt: string;
  version: number;
};

export type VersionDiff = {
  versionA: number;
  versionB: number;
  suggestionsInA: string[];
  suggestionsInB: string[];
  textChanges: { start: number; end: number; oldText: string; newText: string }[];
};

export type SuggestionFilter = {
  status?: SuggestionStatus | SuggestionStatus[];
  authorId?: string;
  type?: SuggestionType;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
};

export type SuggestionEventListener = (event: SuggestionEvent) => void;

export type SuggestionEventType =
  | "suggestion:created"
  | "suggestion:accepted"
  | "suggestion:rejected"
  | "suggestion:comment:added"
  | "suggestion:batch:accepted"
  | "suggestion:batch:rejected";

export type SuggestionEvent = {
  type: SuggestionEventType;
  suggestion?: Suggestion;
  suggestionIds?: string[];
  actorId: string;
  timestamp: string;
};

export type SuggestionStats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  insertions: number;
  deletions: number;
  replacements: number;
  formatting: number;
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SuggestionService {
  private suggestions: Map<string, Suggestion> = new Map();
  private documentSuggestions: Map<string, Set<string>> = new Map();
  private snapshots: SuggestionSnapshot[] = [];
  private versionCounter = 0;
  private listeners: Set<SuggestionEventListener> = new Set();

  // ---- CRUD --------------------------------------------------------------

  createSuggestion(
    documentId: string,
    authorId: string,
    authorName: string,
    change: SuggestionChange
  ): Suggestion {
    this.validateChange(change);

    const now = new Date().toISOString();
    const suggestion: Suggestion = {
      id: generateId(),
      documentId,
      authorId,
      authorName,
      change: { ...change },
      status: "pending",
      comments: [],
      createdAt: now,
      updatedAt: now,
      acceptedAt: null,
      acceptedBy: null,
      rejectedAt: null,
      rejectedBy: null,
    };

    this.suggestions.set(suggestion.id, suggestion);

    const docSet = this.documentSuggestions.get(documentId) ?? new Set();
    docSet.add(suggestion.id);
    this.documentSuggestions.set(documentId, docSet);

    this.emit({
      type: "suggestion:created",
      suggestion,
      actorId: authorId,
      timestamp: now,
    });

    return suggestion;
  }

  getSuggestion(id: string): Suggestion | undefined {
    return this.suggestions.get(id);
  }

  deleteSuggestion(id: string, actorId: string): boolean {
    const suggestion = this.suggestions.get(id);
    if (!suggestion) return false;

    this.suggestions.delete(id);
    const docSet = this.documentSuggestions.get(suggestion.documentId);
    docSet?.delete(id);

    return true;
  }

  // ---- Accept / Reject ---------------------------------------------------

  acceptSuggestion(id: string, actorId: string): Suggestion | undefined {
    const suggestion = this.suggestions.get(id);
    if (!suggestion || suggestion.status !== "pending") return undefined;

    const now = new Date().toISOString();
    suggestion.status = "accepted";
    suggestion.acceptedAt = now;
    suggestion.acceptedBy = actorId;
    suggestion.updatedAt = now;

    this.emit({ type: "suggestion:accepted", suggestion, actorId, timestamp: now });
    return suggestion;
  }

  rejectSuggestion(id: string, actorId: string): Suggestion | undefined {
    const suggestion = this.suggestions.get(id);
    if (!suggestion || suggestion.status !== "pending") return undefined;

    const now = new Date().toISOString();
    suggestion.status = "rejected";
    suggestion.rejectedAt = now;
    suggestion.rejectedBy = actorId;
    suggestion.updatedAt = now;

    this.emit({ type: "suggestion:rejected", suggestion, actorId, timestamp: now });
    return suggestion;
  }

  acceptAll(documentId: string, actorId: string): string[] {
    const accepted: string[] = [];
    for (const s of this.getDocumentSuggestions(documentId)) {
      if (s.status === "pending") {
        this.acceptSuggestion(s.id, actorId);
        accepted.push(s.id);
      }
    }
    if (accepted.length > 0) {
      this.emit({
        type: "suggestion:batch:accepted",
        suggestionIds: accepted,
        actorId,
        timestamp: new Date().toISOString(),
      });
    }
    return accepted;
  }

  rejectAll(documentId: string, actorId: string): string[] {
    const rejected: string[] = [];
    for (const s of this.getDocumentSuggestions(documentId)) {
      if (s.status === "pending") {
        this.rejectSuggestion(s.id, actorId);
        rejected.push(s.id);
      }
    }
    if (rejected.length > 0) {
      this.emit({
        type: "suggestion:batch:rejected",
        suggestionIds: rejected,
        actorId,
        timestamp: new Date().toISOString(),
      });
    }
    return rejected;
  }

  acceptMultiple(ids: string[], actorId: string): string[] {
    const accepted: string[] = [];
    for (const id of ids) {
      if (this.acceptSuggestion(id, actorId)) {
        accepted.push(id);
      }
    }
    if (accepted.length > 0) {
      this.emit({
        type: "suggestion:batch:accepted",
        suggestionIds: accepted,
        actorId,
        timestamp: new Date().toISOString(),
      });
    }
    return accepted;
  }

  rejectMultiple(ids: string[], actorId: string): string[] {
    const rejected: string[] = [];
    for (const id of ids) {
      if (this.rejectSuggestion(id, actorId)) {
        rejected.push(id);
      }
    }
    if (rejected.length > 0) {
      this.emit({
        type: "suggestion:batch:rejected",
        suggestionIds: rejected,
        actorId,
        timestamp: new Date().toISOString(),
      });
    }
    return rejected;
  }

  // ---- Comments on suggestions -------------------------------------------

  addComment(
    suggestionId: string,
    authorId: string,
    authorName: string,
    content: string,
    mentions: CommentMention[] = []
  ): SuggestionComment | undefined {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) return undefined;

    if (!content.trim()) throw new Error("Comment content cannot be empty");

    const comment: SuggestionComment = {
      id: generateId(),
      authorId,
      authorName,
      content: content.trim(),
      mentions,
      createdAt: new Date().toISOString(),
    };

    suggestion.comments.push(comment);
    suggestion.updatedAt = comment.createdAt;

    this.emit({
      type: "suggestion:comment:added",
      suggestion,
      actorId: authorId,
      timestamp: comment.createdAt,
    });

    return comment;
  }

  getComments(suggestionId: string): SuggestionComment[] {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) return [];
    return [...suggestion.comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  // ---- Querying ----------------------------------------------------------

  getDocumentSuggestions(documentId: string): Suggestion[] {
    const ids = this.documentSuggestions.get(documentId);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.suggestions.get(id))
      .filter((s): s is Suggestion => s !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  filterSuggestions(documentId: string, filter: SuggestionFilter): Suggestion[] {
    let results = this.getDocumentSuggestions(documentId);

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      results = results.filter((s) => statuses.includes(s.status));
    }

    if (filter.authorId) {
      results = results.filter((s) => s.authorId === filter.authorId);
    }

    if (filter.type) {
      results = results.filter((s) => s.change.type === filter.type);
    }

    if (filter.dateFrom) {
      const from = new Date(filter.dateFrom).getTime();
      results = results.filter((s) => new Date(s.createdAt).getTime() >= from);
    }

    if (filter.dateTo) {
      const to = new Date(filter.dateTo).getTime();
      results = results.filter((s) => new Date(s.createdAt).getTime() <= to);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.change.oldText.toLowerCase().includes(query) ||
          s.change.newText.toLowerCase().includes(query) ||
          s.authorName.toLowerCase().includes(query)
      );
    }

    return results;
  }

  getDocumentStats(documentId: string): SuggestionStats {
    const suggestions = this.getDocumentSuggestions(documentId);
    return {
      total: suggestions.length,
      pending: suggestions.filter((s) => s.status === "pending").length,
      accepted: suggestions.filter((s) => s.status === "accepted").length,
      rejected: suggestions.filter((s) => s.status === "rejected").length,
      insertions: suggestions.filter((s) => s.change.type === "insertion").length,
      deletions: suggestions.filter((s) => s.change.type === "deletion").length,
      replacements: suggestions.filter((s) => s.change.type === "replacement").length,
      formatting: suggestions.filter((s) => s.change.type === "formatting").length,
    };
  }

  getPendingCount(documentId: string): number {
    const ids = this.documentSuggestions.get(documentId);
    if (!ids) return 0;
    let count = 0;
    for (const id of ids) {
      const s = this.suggestions.get(id);
      if (s && s.status === "pending") count++;
    }
    return count;
  }

  // ---- Version snapshots -------------------------------------------------

  saveSnapshot(documentId: string): SuggestionSnapshot {
    this.versionCounter++;
    const snapshot: SuggestionSnapshot = {
      suggestions: this.getDocumentSuggestions(documentId).map((s) => ({
        ...s,
        change: { ...s.change },
        comments: s.comments.map((c) => ({ ...c })),
      })),
      snapshotAt: new Date().toISOString(),
      version: this.versionCounter,
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  getVersion(version: number): SuggestionSnapshot | undefined {
    return this.snapshots.find((s) => s.version === version);
  }

  getLatestVersion(documentId: string): SuggestionSnapshot | undefined {
    const docVersions = this.snapshots
      .filter((s) => s.suggestions.some((su) => su.documentId === documentId))
      .sort((a, b) => b.version - a.version);
    return docVersions[0];
  }

  compareVersions(versionA: number, versionB: number): VersionDiff | null {
    const snapA = this.getVersion(versionA);
    const snapB = this.getVersion(versionB);
    if (!snapA || !snapB) return null;

    const idsA = new Set(snapA.suggestions.map((s) => s.id));
    const idsB = new Set(snapB.suggestions.map((s) => s.id));

    const suggestionsInA = snapA.suggestions.filter((s) => !idsB.has(s.id)).map((s) => s.id);
    const suggestionsInB = snapB.suggestions.filter((s) => !idsA.has(s.id)).map((s) => s.id);

    const textChanges: VersionDiff["textChanges"] = [];
    const bMap = new Map(snapB.suggestions.map((s) => [s.id, s]));
    for (const sA of snapA.suggestions) {
      const sB = bMap.get(sA.id);
      if (sB && sA.change.startOffset === sB.change.startOffset) {
        if (sA.change.newText !== sB.change.newText || sA.change.oldText !== sB.change.oldText) {
          textChanges.push({
            start: sA.change.startOffset,
            end: sA.change.endOffset,
            oldText: sA.change.newText,
            newText: sB.change.newText,
          });
        }
      }
    }

    return { versionA, versionB, suggestionsInA, suggestionsInB, textChanges };
  }

  getSuggestionHistory(documentId: string): SuggestionSnapshot[] {
    return this.snapshots
      .filter((s) => s.suggestions.some((su) => su.documentId === documentId))
      .sort((a, b) => a.version - b.version);
  }

  // ---- Inline representation helpers -------------------------------------

  getSuggestionRanges(documentId: string): SuggestionRange[] {
    return this.getDocumentSuggestions(documentId)
      .filter((s) => s.status === "pending")
      .map((s) => ({
        id: s.id,
        type: s.change.type,
        start: s.change.startOffset,
        end: s.change.endOffset,
        oldText: s.change.oldText,
        newText: s.change.newText,
        authorName: s.authorName,
      }));
  }

  // ---- Validation --------------------------------------------------------

  private validateChange(change: SuggestionChange): void {
    if (change.startOffset < 0) throw new Error("startOffset must be non-negative");
    if (change.endOffset < change.startOffset) throw new Error("endOffset must be >= startOffset");
    if (!change.type) throw new Error("Suggestion type is required");
  }

  // ---- Events ------------------------------------------------------------

  subscribe(listener: SuggestionEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: SuggestionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Swallow listener errors
      }
    }
  }

  // ---- Serialization -----------------------------------------------------

  toJSON(): string {
    return JSON.stringify({
      suggestions: Array.from(this.suggestions.values()),
      documentSuggestions: Object.fromEntries(
        Array.from(this.documentSuggestions.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      snapshots: this.snapshots,
      versionCounter: this.versionCounter,
    });
  }

  static fromJSON(json: string): SuggestionService {
    const data = JSON.parse(json) as {
      suggestions: Suggestion[];
      documentSuggestions: Record<string, string[]>;
      snapshots: SuggestionSnapshot[];
      versionCounter: number;
    };
    const service = new SuggestionService();
    for (const s of data.suggestions) {
      service.suggestions.set(s.id, s);
      const docSet = service.documentSuggestions.get(s.documentId) ?? new Set();
      docSet.add(s.id);
      service.documentSuggestions.set(s.documentId, docSet);
    }
    service.snapshots = data.snapshots;
    service.versionCounter = data.versionCounter;
    return service;
  }

  clear(): void {
    this.suggestions.clear();
    this.documentSuggestions.clear();
    this.snapshots = [];
    this.versionCounter = 0;
  }
}

export type SuggestionRange = {
  id: string;
  type: SuggestionType;
  start: number;
  end: number;
  oldText: string;
  newText: string;
  authorName: string;
};

export const suggestionService = new SuggestionService();
