import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Comment,
  CommentThread,
  CommentStatus,
  CommentFilter,
  CommentSortOptions,
} from "@/types";

interface CommentState {
  threads: CommentThread[];
  activeThreadId: string | null;
  isLoading: boolean;
  error: string | null;
  filter: CommentFilter;
  sort: CommentSortOptions;
  replyingTo: string | null;
  editingCommentId: string | null;

  setThreads: (threads: CommentThread[]) => void;
  addThread: (thread: CommentThread) => void;
  updateThread: (id: string, updates: Partial<CommentThread>) => void;
  removeThread: (id: string) => void;
  addComment: (threadId: string, comment: Comment) => void;
  updateComment: (
    threadId: string,
    commentId: string,
    updates: Partial<Comment>
  ) => void;
  removeComment: (threadId: string, commentId: string) => void;
  resolveThread: (threadId: string, userId: string) => void;
  reopenThread: (threadId: string) => void;
  setActiveThread: (id: string | null) => void;
  setReplyingTo: (commentId: string | null) => void;
  setEditingComment: (commentId: string | null) => void;
  setFilter: (filter: Partial<CommentFilter>) => void;
  setSort: (sort: Partial<CommentSortOptions>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getThreadsByStatus: (status: CommentStatus) => CommentThread[];
  getThreadById: (id: string) => CommentThread | undefined;
  getOpenThreadCount: () => number;
  getResolvedThreadCount: () => number;
}

export const useCommentStore = create<CommentState>()(
  immer((set, get) => ({
    threads: [],
    activeThreadId: null,
    isLoading: false,
    error: null,
    filter: {},
    sort: { sortBy: "createdAt", sortOrder: "desc" },
    replyingTo: null,
    editingCommentId: null,

    setThreads: (threads) =>
      set((state) => {
        state.threads = threads;
      }),

    addThread: (thread) =>
      set((state) => {
        state.threads.unshift(thread);
      }),

    updateThread: (id, updates) =>
      set((state) => {
        const thread = state.threads.find((t) => t.id === id);
        if (thread) Object.assign(thread, updates);
      }),

    removeThread: (id) =>
      set((state) => {
        state.threads = state.threads.filter((t) => t.id !== id);
        if (state.activeThreadId === id) state.activeThreadId = null;
      }),

    addComment: (threadId, comment) =>
      set((state) => {
        const thread = state.threads.find((t) => t.id === threadId);
        if (thread) {
          thread.comments.push(comment);
          thread.commentCount = thread.comments.length;
          thread.updatedAt = comment.createdAt;
        }
      }),

    updateComment: (threadId, commentId, updates) =>
      set((state) => {
        const thread = state.threads.find((t) => t.id === threadId);
        if (thread) {
          const comment = thread.comments.find((c) => c.id === commentId);
          if (comment) Object.assign(comment, updates);
        }
      }),

    removeComment: (threadId, commentId) =>
      set((state) => {
        const thread = state.threads.find((t) => t.id === threadId);
        if (thread) {
          thread.comments = thread.comments.filter(
            (c) => c.id !== commentId
          );
          thread.commentCount = thread.comments.length;
        }
      }),

    resolveThread: (threadId, userId) =>
      set((state) => {
        const thread = state.threads.find((t) => t.id === threadId);
        if (thread) {
          thread.status = "resolved";
          thread.resolvedBy = userId;
          thread.resolvedAt = new Date().toISOString();
        }
      }),

    reopenThread: (threadId) =>
      set((state) => {
        const thread = state.threads.find((t) => t.id === threadId);
        if (thread) {
          thread.status = "open";
          thread.resolvedBy = undefined;
          thread.resolvedAt = undefined;
        }
      }),

    setActiveThread: (id) =>
      set((state) => {
        state.activeThreadId = id;
      }),

    setReplyingTo: (commentId) =>
      set((state) => {
        state.replyingTo = commentId;
      }),

    setEditingComment: (commentId) =>
      set((state) => {
        state.editingCommentId = commentId;
      }),

    setFilter: (filter) =>
      set((state) => {
        Object.assign(state.filter, filter);
      }),

    setSort: (sort) =>
      set((state) => {
        Object.assign(state.sort, sort);
      }),

    setLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    getThreadsByStatus: (status) => {
      return get().threads.filter((t) => t.status === status);
    },

    getThreadById: (id) => {
      return get().threads.find((t) => t.id === id);
    },

    getOpenThreadCount: () => {
      return get().threads.filter((t) => t.status === "open").length;
    },

    getResolvedThreadCount: () => {
      return get().threads.filter((t) => t.status === "resolved").length;
    },
  }))
);
