import * as Y from "yjs";
import { customBlockSchema, type CustomBlock } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Version {
  id: string;
  documentId: string;
  timestamp: number;
  authorId: string;
  authorName: string;
  description?: string;
  blockCount: number;
  snapshot: Uint8Array;
  checksum: string;
  tags: string[];
  isAutoSave: boolean;
}

export interface VersionDiff {
  version1Id: string;
  version2Id: string;
  additions: DiffOperation[];
  deletions: DiffOperation[];
  modifications: DiffOperation[];
  summary: string;
}

export interface DiffOperation {
  type: "add" | "delete" | "modify";
  blockId: string;
  blockType: string;
  before?: Partial<CustomBlock>;
  after?: Partial<CustomBlock>;
  timestamp: number;
}

export interface VersionComparison {
  version1: Version;
  version2: Version;
  diff: VersionDiff;
  renderedBlocks: RenderedBlock[];
}

export interface RenderedBlock {
  blockId: string;
  type: string;
  content: string;
  changeType: "unchanged" | "added" | "deleted" | "modified";
}

export interface VersioningConfig {
  documentId: string;
  autoSaveInterval?: number;
  maxVersions?: number;
  maxAutoSaveVersions?: number;
  snapshotDepth?: number;
}

export type VersioningEvent =
  | { type: "version-created"; version: Version }
  | { type: "version-restored"; version: Version }
  | { type: "version-deleted"; versionId: string }
  | { type: "auto-save"; version: Version }
  | { type: "cleanup"; deletedCount: number };

export type VersioningEventListener = (event: VersioningEvent) => void;

// ─── Version Manager ─────────────────────────────────────────────────────────

export class VersionManager {
  private config: VersioningConfig;
  private versions: Version[] = [];
  private doc: Y.Doc;
  private listeners: VersioningEventListener[] = [];
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private lastSnapshot: Uint8Array | null = null;

  constructor(config: VersioningConfig) {
    this.config = {
      autoSaveInterval: 30000, // 30 seconds
      maxVersions: 100,
      maxAutoSaveVersions: 50,
      snapshotDepth: 3,
      ...config,
    };

    this.doc = new Y.Doc();
  }

  // ─── Version Creation ────────────────────────────────────────────────

  createVersion(
    authorId: string,
    authorName: string,
    description?: string,
    isAutoSave = false,
    tags: string[] = []
  ): Version {
    const snapshot = Y.encodeStateAsUpdate(this.doc);
    const checksum = this.computeChecksum(snapshot);

    // Check if content actually changed
    if (this.lastSnapshot) {
      const lastChecksum = this.computeChecksum(this.lastSnapshot);
      if (checksum === lastChecksum && !description) {
        // No changes, skip creating a version
        return this.versions[this.versions.length - 1];
      }
    }

    const blocks = this.doc.getArray("blocks");
    const version: Version = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      documentId: this.config.documentId,
      timestamp: Date.now(),
      authorId,
      authorName,
      description,
      blockCount: blocks.length,
      snapshot,
      checksum,
      tags,
      isAutoSave,
    };

    this.versions.push(version);
    this.lastSnapshot = snapshot;

    // Store version metadata in Yjs
    const versionsArray = this.doc.getArray("versions");
    const versionMap = new Y.Map();
    versionMap.set("id", version.id);
    versionMap.set("timestamp", version.timestamp);
    versionMap.set("authorId", version.authorId);
    versionMap.set("authorName", version.authorName);
    versionMap.set("description", description || "");
    versionMap.set("blockCount", version.blockCount);
    versionMap.set("checksum", version.checksum);
    versionsArray.push([versionMap]);

    this.emit({ type: "version-created", version });

    if (isAutoSave) {
      this.emit({ type: "auto-save", version });
    }

    // Cleanup old versions
    this.cleanupVersions();

    return version;
  }

  // ─── Version Retrieval ───────────────────────────────────────────────

  getVersions(): Version[] {
    return [...this.versions];
  }

  getVersion(versionId: string): Version | undefined {
    return this.versions.find((v) => v.id === versionId);
  }

  getVersionsByAuthor(authorId: string): Version[] {
    return this.versions.filter((v) => v.authorId === authorId);
  }

  getVersionsByTag(tag: string): Version[] {
    return this.versions.filter((v) => v.tags.includes(tag));
  }

  getVersionsInRange(
    startTime: number,
    endTime: number
  ): Version[] {
    return this.versions.filter(
      (v) => v.timestamp >= startTime && v.timestamp <= endTime
    );
  }

  getNamedVersions(): Version[] {
    return this.versions.filter((v) => v.description && !v.isAutoSave);
  }

  getAutoSaveVersions(): Version[] {
    return this.versions.filter((v) => v.isAutoSave);
  }

  getLatestVersion(): Version | undefined {
    return this.versions[this.versions.length - 1];
  }

  // ─── Version Restoration ─────────────────────────────────────────────

  restoreVersion(versionId: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    try {
      Y.applyUpdate(this.doc, version.snapshot);
      this.lastSnapshot = Y.encodeStateAsUpdate(this.doc);
      this.emit({ type: "version-restored", version });
      return true;
    } catch (error) {
      console.error("Failed to restore version:", error);
      return false;
    }
  }

  // ─── Version Diff ────────────────────────────────────────────────────

  computeDiff(versionId1: string, versionId2: string): VersionDiff | null {
    const v1 = this.getVersion(versionId1);
    const v2 = this.getVersion(versionId2);

    if (!v1 || !v2) return null;

    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    try {
      Y.applyUpdate(doc1, v1.snapshot);
      Y.applyUpdate(doc2, v2.snapshot);

      const blocks1 = doc1.getArray("blocks");
      const blocks2 = doc2.getArray("blocks");

      const additions: DiffOperation[] = [];
      const deletions: DiffOperation[] = [];
      const modifications: DiffOperation[] = [];

      const map1 = new Map<string, any>();
      const map2 = new Map<string, any>();

      for (let i = 0; i < blocks1.length; i++) {
        const block = blocks1.get(i);
        if (block) map1.set(block.get("id") || `idx-${i}`, block.toJSON());
      }

      for (let i = 0; i < blocks2.length; i++) {
        const block = blocks2.get(i);
        if (block) map2.set(block.get("id") || `idx-${i}`, block.toJSON());
      }

      // Find additions and modifications
      for (const [id, block2] of map2) {
        const block1 = map1.get(id);
        if (!block1) {
          additions.push({
            type: "add",
            blockId: id,
            blockType: block2.type || "unknown",
            after: block2,
            timestamp: v2.timestamp,
          });
        } else if (JSON.stringify(block1) !== JSON.stringify(block2)) {
          modifications.push({
            type: "modify",
            blockId: id,
            blockType: block2.type || "unknown",
            before: block1,
            after: block2,
            timestamp: v2.timestamp,
          });
        }
      }

      // Find deletions
      for (const [id, block1] of map1) {
        if (!map2.has(id)) {
          deletions.push({
            type: "delete",
            blockId: id,
            blockType: block1.type || "unknown",
            before: block1,
            timestamp: v1.timestamp,
          });
        }
      }

      const summary = this.generateDiffSummary(additions, deletions, modifications);

      return {
        version1Id: versionId1,
        version2Id: versionId2,
        additions,
        deletions,
        modifications,
        summary,
      };
    } finally {
      doc1.destroy();
      doc2.destroy();
    }
  }

  compareVersions(versionId1: string, versionId2: string): VersionComparison | null {
    const v1 = this.getVersion(versionId1);
    const v2 = this.getVersion(versionId2);
    const diff = this.computeDiff(versionId1, versionId2);

    if (!v1 || !v2 || !diff) return null;

    const renderedBlocks: RenderedBlock[] = [];

    // Render diff as blocks
    for (const op of diff.additions) {
      renderedBlocks.push({
        blockId: op.blockId,
        type: op.blockType,
        content: this.extractBlockContent(op.after),
        changeType: "added",
      });
    }

    for (const op of diff.deletions) {
      renderedBlocks.push({
        blockId: op.blockId,
        type: op.blockType,
        content: this.extractBlockContent(op.before),
        changeType: "deleted",
      });
    }

    for (const op of diff.modifications) {
      renderedBlocks.push({
        blockId: op.blockId,
        type: op.blockType,
        content: this.extractBlockContent(op.after),
        changeType: "modified",
      });
    }

    return {
      version1: v1,
      version2: v2,
      diff,
      renderedBlocks,
    };
  }

  // ─── Version Tagging ─────────────────────────────────────────────────

  tagVersion(versionId: string, tag: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    if (!version.tags.includes(tag)) {
      version.tags.push(tag);
    }
    return true;
  }

  untagVersion(versionId: string, tag: string): boolean {
    const version = this.getVersion(versionId);
    if (!version) return false;

    version.tags = version.tags.filter((t) => t !== tag);
    return true;
  }

  // ─── Version Deletion ────────────────────────────────────────────────

  deleteVersion(versionId: string): boolean {
    const index = this.versions.findIndex((v) => v.id === versionId);
    if (index === -1) return false;

    // Don't delete the last version
    if (index === this.versions.length - 1 && this.versions.length > 1) {
      return false;
    }

    const deleted = this.versions.splice(index, 1)[0];
    this.emit({ type: "version-deleted", versionId: deleted.id });
    return true;
  }

  // ─── Auto-Save ───────────────────────────────────────────────────────

  startAutoSave(authorId: string, authorName: string): void {
    this.stopAutoSave();

    this.autoSaveTimer = setInterval(() => {
      this.createVersion(authorId, authorName, undefined, true);
    }, this.config.autoSaveInterval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────

  private cleanupVersions(): void {
    const maxVersions = this.config.maxVersions || 100;
    const maxAutoSave = this.config.maxAutoSaveVersions || 50;

    // Trim total versions
    if (this.versions.length > maxVersions) {
      const toDelete = this.versions.length - maxVersions;
      this.versions.splice(0, toDelete);
      this.emit({ type: "cleanup", deletedCount: toDelete });
    }

    // Trim auto-save versions
    const autoSaveVersions = this.getAutoSaveVersions();
    if (autoSaveVersions.length > maxAutoSave) {
      const toDelete = autoSaveVersions.length - maxAutoSave;
      for (let i = 0; i < toDelete; i++) {
        const idx = this.versions.findIndex((v) => v.id === autoSaveVersions[i].id);
        if (idx !== -1) {
          this.versions.splice(idx, 1);
        }
      }
      this.emit({ type: "cleanup", deletedCount: toDelete });
    }
  }

  // ─── Event System ────────────────────────────────────────────────────

  addEventListener(listener: VersioningEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: VersioningEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in versioning event listener:", error);
      }
    }
  }

  // ─── Utilities ───────────────────────────────────────────────────────

  private computeChecksum(data: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  private extractBlockContent(block: any): string {
    if (!block) return "";
    if (block.content && Array.isArray(block.content)) {
      return block.content
        .map((item: any) => item.text || "")
        .join("");
    }
    return block.text || "";
  }

  private generateDiffSummary(
    additions: DiffOperation[],
    deletions: DiffOperation[],
    modifications: DiffOperation[]
  ): string {
    const parts: string[] = [];

    if (additions.length > 0) {
      parts.push(`${additions.length} block(s) added`);
    }
    if (deletions.length > 0) {
      parts.push(`${deletions.length} block(s) deleted`);
    }
    if (modifications.length > 0) {
      parts.push(`${modifications.length} block(s) modified`);
    }

    return parts.join(", ") || "No changes";
  }

  // ─── Export/Import ───────────────────────────────────────────────────

  exportVersions(): string {
    return JSON.stringify(
      this.versions.map((v) => ({
        ...v,
        snapshot: Array.from(v.snapshot),
      })),
      null,
      2
    );
  }

  importVersions(json: string): void {
    try {
      const imported = JSON.parse(json);
      for (const v of imported) {
        this.versions.push({
          ...v,
          snapshot: new Uint8Array(v.snapshot),
        });
      }
    } catch (error) {
      console.error("Failed to import versions:", error);
    }
  }

  // ─── Get Doc ─────────────────────────────────────────────────────────

  getDoc(): Y.Doc {
    return this.doc;
  }

  destroy(): void {
    this.stopAutoSave();
    this.doc.destroy();
    this.listeners = [];
  }
}

// ─── Version History Utilities ───────────────────────────────────────────────

export function formatVersionTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function getVersionLabel(version: Version): string {
  if (version.description) return version.description;
  if (version.isAutoSave) return `Auto-save ${formatVersionTimestamp(version.timestamp)}`;
  return `Version ${formatVersionTimestamp(version.timestamp)}`;
}

export function getVersionColor(version: Version): string {
  if (version.isAutoSave) return "#6b7280";
  if (version.tags.includes("milestone")) return "#3b82f6";
  if (version.tags.includes("release")) return "#10b981";
  if (version.tags.includes("backup")) return "#f59e0b";
  return "#6366f1";
}

export function calculateVersionStats(versions: Version[]) {
  const totalVersions = versions.length;
  const autoSaveVersions = versions.filter((v) => v.isAutoSave).length;
  const manualVersions = totalVersions - autoSaveVersions;
  const namedVersions = versions.filter((v) => v.description && !v.isAutoSave).length;
  const uniqueAuthors = new Set(versions.map((v) => v.authorId)).size;
  const allTags = new Set(versions.flatMap((v) => v.tags));

  const oldestVersion = versions[0];
  const newestVersion = versions[versions.length - 1];
  const timeSpan = oldestVersion && newestVersion
    ? newestVersion.timestamp - oldestVersion.timestamp
    : 0;

  return {
    totalVersions,
    autoSaveVersions,
    manualVersions,
    namedVersions,
    uniqueAuthors,
    tags: Array.from(allTags),
    oldestVersion: oldestVersion ? formatVersionTimestamp(oldestVersion.timestamp) : "N/A",
    newestVersion: newestVersion ? formatVersionTimestamp(newestVersion.timestamp) : "N/A",
    timeSpan,
    avgVersionsPerDay: timeSpan > 0 ? (totalVersions / (timeSpan / 86400000)).toFixed(1) : "0",
  };
}
