import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface CollaboratorPresence {
  userId: string;
  name: string;
  avatar?: string;
  color: string;
  cursor: {
    blockId: string;
    offset: number;
  } | null;
  selection: {
    blockId: string;
    startOffset: number;
    endOffset: number;
  } | null;
  isActive: boolean;
  lastSeen: string;
}

interface SyncState {
  localVersion: number;
  remoteVersion: number;
  pendingOps: unknown[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
}

interface CollaborationState {
  documentId: string | null;
  collaborators: CollaboratorPresence[];
  myPresence: CollaboratorPresence | null;
  isConnected: boolean;
  isReconnecting: boolean;
  sync: SyncState;
  undoStack: unknown[];
  redoStack: unknown[];

  setDocumentId: (id: string | null) => void;
  setCollaborators: (collaborators: CollaboratorPresence[]) => void;
  addCollaborator: (collaborator: CollaboratorPresence) => void;
  removeCollaborator: (userId: string) => void;
  updateCollaborator: (
    userId: string,
    updates: Partial<CollaboratorPresence>
  ) => void;
  setMyPresence: (presence: CollaboratorPresence | null) => void;
  updateMyCursor: (
    blockId: string,
    offset: number
  ) => void;
  updateMySelection: (
    blockId: string,
    startOffset: number,
    endOffset: number
  ) | null;
  clearMySelection: () => void;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setSyncState: (sync: Partial<SyncState>) => void;
  addPendingOp: (op: unknown) => void;
  clearPendingOps: () => void;
  getCollaboratorByUserId: (userId: string) => CollaboratorPresence | undefined;
  getActiveCollaborators: () => CollaboratorPresence[];
  getCollaboratorCount: () => number;
}

const COLLABORATOR_COLORS = [
  "#f43f5e",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length]!;
}

export const useCollaborationStore = create<CollaborationState>()(
  immer((set, get) => ({
    documentId: null,
    collaborators: [],
    myPresence: null,
    isConnected: false,
    isReconnecting: false,
    sync: {
      localVersion: 0,
      remoteVersion: 0,
      pendingOps: [],
      isSyncing: false,
      lastSyncedAt: null,
    },
    undoStack: [],
    redoStack: [],

    setDocumentId: (id) =>
      set((state) => {
        state.documentId = id;
        state.collaborators = [];
        state.myPresence = null;
        state.isConnected = false;
        state.sync = {
          localVersion: 0,
          remoteVersion: 0,
          pendingOps: [],
          isSyncing: false,
          lastSyncedAt: null,
        };
      }),

    setCollaborators: (collaborators) =>
      set((state) => {
        state.collaborators = collaborators;
      }),

    addCollaborator: (collaborator) =>
      set((state) => {
        const exists = state.collaborators.find(
          (c) => c.userId === collaborator.userId
        );
        if (!exists) {
          state.collaborators.push({
            ...collaborator,
            color: collaborator.color || getColorForUser(collaborator.userId),
          });
        }
      }),

    removeCollaborator: (userId) =>
      set((state) => {
        state.collaborators = state.collaborators.filter(
          (c) => c.userId !== userId
        );
      }),

    updateCollaborator: (userId, updates) =>
      set((state) => {
        const collab = state.collaborators.find(
          (c) => c.userId === userId
        );
        if (collab) {
          Object.assign(collab, updates);
          collab.lastSeen = new Date().toISOString();
        }
      }),

    setMyPresence: (presence) =>
      set((state) => {
        state.myPresence = presence
          ? {
              ...presence,
              color: presence.color || getColorForUser(presence.userId),
            }
          : null;
      }),

    updateMyCursor: (blockId, offset) =>
      set((state) => {
        if (state.myPresence) {
          state.myPresence.cursor = { blockId, offset };
          state.myPresence.isActive = true;
          state.myPresence.lastSeen = new Date().toISOString();
        }
      }),

    updateMySelection: (blockId, startOffset, endOffset) =>
      set((state) => {
        if (state.myPresence) {
          state.myPresence.selection = {
            blockId,
            startOffset,
            endOffset,
          };
          state.myPresence.isActive = true;
          state.myPresence.lastSeen = new Date().toISOString();
        }
      }),

    clearMySelection: () =>
      set((state) => {
        if (state.myPresence) {
          state.myPresence.selection = null;
        }
      }),

    setConnected: (isConnected) =>
      set((state) => {
        state.isConnected = isConnected;
        if (isConnected) state.isReconnecting = false;
      }),

    setReconnecting: (isReconnecting) =>
      set((state) => {
        state.isReconnecting = isReconnecting;
      }),

    setSyncState: (sync) =>
      set((state) => {
        Object.assign(state.sync, sync);
      }),

    addPendingOp: (op) =>
      set((state) => {
        state.sync.pendingOps.push(op);
        state.sync.localVersion += 1;
      }),

    clearPendingOps: () =>
      set((state) => {
        state.sync.pendingOps = [];
      }),

    getCollaboratorByUserId: (userId) => {
      return get().collaborators.find((c) => c.userId === userId);
    },

    getActiveCollaborators: () => {
      return get().collaborators.filter((c) => c.isActive);
    },

    getCollaboratorCount: () => {
      return get().collaborators.length + (get().myPresence ? 1 : 0);
    },
  }))
);
