import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import type { BlockNoteEditor } from "@blocknote/core";
import { customBlockSchema, type CustomBlock } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CollaborationConfig {
  documentId: string;
  userId: string;
  userName: string;
  userColor: string;
  serverUrl: string;
  roomPrefix?: string;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  offlineStorageKey?: string;
  awarenessTimeout?: number;
}

export interface PresenceInfo {
  userId: string;
  userName: string;
  userColor: string;
  cursor: { blockId: string; offset: number } | null;
  selection: { startBlockId: string; endBlockId: string } | null;
  isActive: boolean;
  lastSeen: number;
}

export interface VersionInfo {
  versionId: string;
  timestamp: number;
  authorId: string;
  authorName: string;
  description?: string;
  snapshot: Y.Doc;
}

export interface SyncStatus {
  isSynced: boolean;
  isOnline: boolean;
  pendingChanges: number;
  lastSyncTime: number | null;
  connectionState: "connecting" | "connected" | "disconnected" | "failed";
}

export type CollaborationEvent =
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "awareness-updated"; presence: PresenceInfo[] }
  | { type: "sync-status-changed"; status: SyncStatus }
  | { type: "version-created"; version: VersionInfo };

export type CollaborationEventListener = (event: CollaborationEvent) => void;

// ─── Collaboration Provider ──────────────────────────────────────────────────

export class CollaborationProvider {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private config: CollaborationConfig;
  private listeners: CollaborationEventListener[] = [];
  private presenceMap: Map<string, PresenceInfo> = new Map();
  private versions: VersionInfo[] = [];
  private offlineQueue: Y.ApplyUpdate[] = [];
  private syncStatus: SyncStatus = {
    isSynced: false,
    isOnline: false,
    pendingChanges: 0,
    lastSyncTime: null,
    connectionState: "disconnected",
  };

  constructor(config: CollaborationConfig) {
    this.config = {
      maxReconnectAttempts: 10,
      reconnectInterval: 1000,
      offlineStorageKey: `offline-${config.documentId}`,
      awarenessTimeout: 30000,
      ...config,
    };

    this.doc = new Y.Doc();
    this.setupDocument();
  }

  private setupDocument(): void {
    this.doc.on("update", (update: Uint8Array, origin: any) => {
      if (origin !== "remote") {
        this.offlineQueue.push(update);
        this.updateSyncStatus({ pendingChanges: this.offlineQueue.length });
      }
    });
  }

  connect(): void {
    const roomName = `${this.config.roomPrefix || ""}${this.config.documentId}`;

    this.provider = new WebsocketProvider(
      this.config.serverUrl,
      roomName,
      this.doc,
      {
        connect: true,
        awareness: {
          localState: {
            user: {
              name: this.config.userName,
              color: this.config.userColor,
              colorIndex: this.getColorIndex(this.config.userColor),
            },
          },
        },
        params: {
          userId: this.config.userId,
        },
      }
    );

    this.provider.on("status", ({ status }: { status: string }) => {
      const connectionState = status as SyncStatus["connectionState"];
      this.updateSyncStatus({ connectionState });

      if (status === "connected") {
        this.updateSyncStatus({
          isOnline: true,
          isSynced: true,
          connectionState: "connected",
        });
        this.flushOfflineQueue();
        this.emit({ type: "connected" });
      } else if (status === "disconnected") {
        this.updateSyncStatus({
          isOnline: false,
          connectionState: "disconnected",
        });
        this.emit({ type: "disconnected" });
      }
    });

    this.provider.on("sync", (isSynced: boolean) => {
      this.updateSyncStatus({ isSynced });
      if (isSynced) {
        this.updateSyncStatus({ lastSyncTime: Date.now() });
      }
    });

    this.provider.awareness.on(
      "change",
      () => {
        this.updatePresence();
      }
    );

    this.provider.on("connection-error", (error: Error) => {
      console.error("Collaboration connection error:", error);
      this.updateSyncStatus({ connectionState: "failed" });
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.awareness.setLocalState(null);
      this.provider.disconnect();
      this.provider.destroy();
      this.provider = null;
    }

    this.updateSyncStatus({
      isOnline: false,
      connectionState: "disconnected",
    });
  }

  // ─── Document Operations ──────────────────────────────────────────────

  getDocument(): Y.Doc {
    return this.doc;
  }

  getBlocks(): Y.Array<Y.Map<any>> {
    return this.doc.getArray("blocks");
  }

  getYBlock(blockId: string): Y.Map<any> | null {
    const blocks = this.getBlocks();
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks.get(i);
      if (block?.get("id") === blockId) {
        return block;
      }
    }
    return null;
  }

  updateYBlock(blockId: string, updates: Record<string, any>): void {
    const yBlock = this.getYBlock(blockId);
    if (yBlock) {
      this.doc.transact(() => {
        for (const [key, value] of Object.entries(updates)) {
          yBlock.set(key, value);
        }
      });
    }
  }

  insertYBlock(index: number, blockData: Record<string, any>): void {
    const blocks = this.getBlocks();
    const yBlock = new Y.Map();

    this.doc.transact(() => {
      for (const [key, value] of Object.entries(blockData)) {
        yBlock.set(key, value);
      }
      blocks.insert(index, [yBlock]);
    });
  }

  removeYBlock(blockId: string): void {
    const blocks = this.getBlocks();
    for (let i = 0; i < blocks.length; i++) {
      if (blocks.get(i)?.get("id") === blockId) {
        blocks.delete(i, 1);
        break;
      }
    }
  }

  // ─── Awareness (Cursors & Presence) ───────────────────────────────────

  updateLocalPresence(data: Partial<PresenceInfo>): void {
    if (!this.provider) return;

    const currentState = this.provider.awareness.getLocalState() || {};
    this.provider.awareness.setLocalState({
      ...currentState,
      ...data,
      userId: this.config.userId,
      userName: this.config.userName,
      userColor: this.config.userColor,
      lastSeen: Date.now(),
    });
  }

  setCursor(blockId: string, offset: number): void {
    this.updateLocalPresence({
      cursor: { blockId, offset },
    });
  }

  setSelection(startBlockId: string, endBlockId: string): void {
    this.updateLocalPresence({
      selection: { startBlockId, endBlockId },
    });
  }

  clearSelection(): void {
    this.updateLocalPresence({
      cursor: null,
      selection: null,
    });
  }

  private updatePresence(): void {
    if (!this.provider) return;

    const states = this.provider.awareness.getStates();
    this.presenceMap.clear();

    states.forEach((state, clientId) => {
      if (state.user && clientId !== this.doc.clientID) {
        const presence: PresenceInfo = {
          userId: state.userId || `user-${clientId}`,
          userName: state.userName || "Anonymous",
          userColor: state.userColor || "#ccc",
          cursor: state.cursor || null,
          selection: state.selection || null,
          isActive: true,
          lastSeen: state.lastSeen || Date.now(),
        };
        this.presenceMap.set(presence.userId, presence);
      }
    });

    // Clean up stale presences
    const now = Date.now();
    for (const [userId, presence] of this.presenceMap) {
      if (now - presence.lastSeen > (this.config.awarenessTimeout || 30000)) {
        presence.isActive = false;
      }
    }

    this.emit({
      type: "awareness-updated",
      presence: Array.from(this.presenceMap.values()),
    });
  }

  getPresence(): PresenceInfo[] {
    return Array.from(this.presenceMap.values());
  }

  getUserPresence(userId: string): PresenceInfo | undefined {
    return this.presenceMap.get(userId);
  }

  // ─── Version History ──────────────────────────────────────────────────

  createVersion(description?: string): VersionInfo {
    const snapshot = Y.snapshot(this.doc);
    const version: VersionInfo = {
      versionId: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      authorId: this.config.userId,
      authorName: this.config.userName,
      description,
      snapshot: this.doc,
    };

    this.versions.push(version);

    // Store in Yjs
    const versionsArray = this.doc.getArray("versions");
    const versionMap = new Y.Map();
    versionMap.set("id", version.versionId);
    versionMap.set("timestamp", version.timestamp);
    versionMap.set("authorId", version.authorId);
    versionMap.set("authorName", version.authorName);
    versionMap.set("description", description || "");
    versionsArray.push([versionMap]);

    return version;
  }

  getVersions(): VersionInfo[] {
    return [...this.versions];
  }

  restoreVersion(versionId: string): boolean {
    const version = this.versions.find((v) => v.versionId === versionId);
    if (!version) return false;

    try {
      const stateVector = Y.encodeStateAsUpdate(version.snapshot);
      Y.applyUpdate(this.doc, stateVector);
      return true;
    } catch (error) {
      console.error("Failed to restore version:", error);
      return false;
    }
  }

  getVersionDiff(
    versionId1: string,
    versionId2: string
  ): { additions: number; deletions: number; changes: string[] } {
    const v1 = this.versions.find((v) => v.versionId === versionId1);
    const v2 = this.versions.find((v) => v.versionId === versionId2);

    if (!v1 || !v2) {
      return { additions: 0, deletions: 0, changes: ["Version not found"] };
    }

    const state1 = Y.encodeStateAsUpdate(v1.snapshot);
    const state2 = Y.encodeStateAsUpdate(v2.snapshot);

    const diff1to2 = Y.encodeStateAsUpdate(v2.snapshot, Y.encodeStateVector(v1.snapshot));
    const diff2to1 = Y.encodeStateAsUpdate(v1.snapshot, Y.encodeStateVector(v2.snapshot));

    return {
      additions: diff1to2.length,
      deletions: diff2to1.length,
      changes: [
        `Added ${diff1to2.length} bytes`,
        `Removed ${diff2to1.length} bytes`,
      ],
    };
  }

  // ─── Offline Support ──────────────────────────────────────────────────

  private flushOfflineQueue(): void {
    if (this.offlineQueue.length === 0) return;

    try {
      for (const update of this.offlineQueue) {
        Y.applyUpdate(this.doc, update, "offline-flush");
      }
      this.offlineQueue = [];
      this.updateSyncStatus({ pendingChanges: 0 });
      this.saveOfflineState();
    } catch (error) {
      console.error("Failed to flush offline queue:", error);
    }
  }

  saveOfflineState(): void {
    try {
      const state = Y.encodeStateAsUpdate(this.doc);
      const base64 = btoa(String.fromCharCode(...state));
      localStorage.setItem(this.config.offlineStorageKey!, base64);
    } catch (error) {
      console.error("Failed to save offline state:", error);
    }
  }

  loadOfflineState(): boolean {
    try {
      const stored = localStorage.getItem(this.config.offlineStorageKey!);
      if (!stored) return false;

      const binary = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
      Y.applyUpdate(this.doc, binary, "offline-load");
      return true;
    } catch (error) {
      console.error("Failed to load offline state:", error);
      return false;
    }
  }

  clearOfflineState(): void {
    localStorage.removeItem(this.config.offlineStorageKey!);
  }

  // ─── Sync Status ──────────────────────────────────────────────────────

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.emit({ type: "sync-status-changed", status: this.syncStatus });
  }

  // ─── Event System ─────────────────────────────────────────────────────

  addEventListener(listener: CollaborationEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: CollaborationEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in collaboration event listener:", error);
      }
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────

  private getColorIndex(color: string): number {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
      "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    ];
    return colors.indexOf(color) % colors.length;
  }

  getDocState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  mergeDocState(state: Uint8Array): void {
    Y.applyUpdate(this.doc, state, "merge");
  }

  destroy(): void {
    this.disconnect();
    this.doc.destroy();
    this.listeners = [];
    this.presenceMap.clear();
  }
}

// ─── Awareness Helpers ───────────────────────────────────────────────────────

export function createCursorElement(presence: PresenceInfo): HTMLElement {
  const cursor = document.createElement("div");
  cursor.className = "collaboration-cursor";
  cursor.style.borderLeft = `2px solid ${presence.userColor}`;
  cursor.style.position = "relative";
  cursor.style.pointerEvents = "none";

  const label = document.createElement("div");
  label.className = "collaboration-cursor-label";
  label.style.backgroundColor = presence.userColor;
  label.style.color = "white";
  label.style.padding = "2px 6px";
  label.style.borderRadius = "3px";
  label.style.fontSize = "12px";
  label.style.fontWeight = "bold";
  label.style.whiteSpace = "nowrap";
  label.style.position = "absolute";
  label.style.top = "-20px";
  label.style.left = "-1px";
  label.textContent = presence.userName;

  cursor.appendChild(label);
  return cursor;
}

export function createSelectionHighlight(
  presence: PresenceInfo
): { startElement: HTMLElement; endElement: HTMLElement } {
  const startEl = document.createElement("div");
  startEl.className = "collaboration-selection-start";
  startEl.style.backgroundColor = `${presence.userColor}33`;

  const endEl = document.createElement("div");
  endEl.className = "collaboration-selection-end";
  endEl.style.backgroundColor = `${presence.userColor}33`;

  return { startElement: startEl, endElement: endEl };
}

// ─── Conflict Resolution ────────────────────────────────────────────────────

export class ConflictResolver {
  private provider: CollaborationProvider;

  constructor(provider: CollaborationProvider) {
    this.provider = provider;
  }

  resolveConflicts(
    localBlocks: CustomBlock[],
    remoteBlocks: CustomBlock[]
  ): CustomBlock[] {
    const merged: CustomBlock[] = [];
    const localMap = new Map(localBlocks.map((b) => [b.id, b]));
    const remoteMap = new Map(remoteBlocks.map((b) => [b.id, b]));

    // Add all local blocks
    for (const block of localBlocks) {
      merged.push(block);
    }

    // Add remote blocks that don't exist locally
    for (const [id, block] of remoteMap) {
      if (!localMap.has(id)) {
        merged.push(block);
      }
    }

    return merged;
  }

  detectConflicts(
    localBlocks: CustomBlock[],
    remoteBlocks: CustomBlock[]
  ): { blockId: string; local: CustomBlock; remote: CustomBlock }[] {
    const conflicts: { blockId: string; local: CustomBlock; remote: CustomBlock }[] = [];
    const localMap = new Map(localBlocks.map((b) => [b.id, b]));
    const remoteMap = new Map(remoteBlocks.map((b) => [b.id, b]));

    for (const [id, localBlock] of localMap) {
      const remoteBlock = remoteMap.get(id);
      if (remoteBlock) {
        const localHash = this.hashBlock(localBlock);
        const remoteHash = this.hashBlock(remoteBlock);
        if (localHash !== remoteHash) {
          conflicts.push({ blockId: id, local: localBlock, remote: remoteBlock });
        }
      }
    }

    return conflicts;
  }

  private hashBlock(block: CustomBlock): string {
    return JSON.stringify({
      type: block.type,
      props: block.props,
      content: block.content,
    });
  }
}

// ─── Collaboration Factory ───────────────────────────────────────────────────

export function createCollaborationProvider(
  config: CollaborationConfig
): CollaborationProvider {
  return new CollaborationProvider(config);
}

export function connectToDocument(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  config: CollaborationConfig
): CollaborationProvider {
  const provider = new CollaborationProvider(config);

  provider.addEventListener((event) => {
    switch (event.type) {
      case "connected":
        console.log("Connected to collaboration server");
        break;
      case "disconnected":
        console.log("Disconnected from collaboration server");
        break;
      case "awareness-updated":
        // Update cursor positions in editor
        break;
      case "sync-status-changed":
        // Update sync indicator
        break;
    }
  });

  provider.connect();
  return provider;
}
