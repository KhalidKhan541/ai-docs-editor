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
    const now = new Date().toISOString();
    const suggestion: Suggestion = {
      id: generateId(),
      documentId,
      authorId,
      authorName,
      change,
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

  deleteSuggestion(id: string): boolean {
    return this.suggestions.delete(id);
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
    for (const id of this.getDocumentSuggestions(documentId)) {
      if (id.status === "pending") {
        this.acceptSuggestion(id.id, actorId);
        accepted.push(id.id);
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

    const comment: SuggestionComment = {
      id: generateId(),
      authorId,
      authorName,
      content,
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

    return results;
  }

  getPendingCount(documentId: string): number {
    return this.getDocumentSuggestions(documentId).filter((s) => s.status === "pending").length;
  }

  // ---- Version snapshots -------------------------------------------------

  saveSnapshot(documentId: string): SuggestionSnapshot {
    this.versionCounter++;
    const snapshot: SuggestionSnapshot = {
      suggestions: this.getDocumentSuggestions(documentId).map((s) => ({ ...s })),
      snapshotAt: new Date().toISOString(),
      version: this.versionCounter,
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  getVersion(version: number): SuggestionSnapshot | undefined {
    return this.snapshots.find((s) => s.version === version);
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
    return this.snapshots.filter((s) =>
      s.suggestions.some((su) => su.documentId === documentId)
    );
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
    }
    for (const [docId, ids] of Object.entries(data.documentSuggestions)) {
      service.documentSuggestions.set(docId, new Set(ids));
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
