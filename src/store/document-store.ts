import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  Document,
  DocumentListParams,
  DocumentListResponse,
  DocumentStatus,
} from "@/types";

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: DocumentListParams;

  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (doc: Document | null) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (time: string) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<DocumentState["pagination"]>) => void;
  setFilters: (filters: Partial<DocumentListParams>) => void;
  loadDocuments: (response: DocumentListResponse) => void;
  reset: () => void;
}

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

const defaultFilters: DocumentListParams = {
  sortBy: "updatedAt",
  sortOrder: "desc",
  page: 1,
  limit: 20,
};

export const useDocumentStore = create<DocumentState>()(
  immer((set) => ({
    documents: [],
    currentDocument: null,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    error: null,
    pagination: { ...defaultPagination },
    filters: { ...defaultFilters },

    setDocuments: (documents) =>
      set((state) => {
        state.documents = documents;
      }),

    setCurrentDocument: (doc) =>
      set((state) => {
        state.currentDocument = doc;
      }),

    addDocument: (doc) =>
      set((state) => {
        state.documents.unshift(doc);
        state.pagination.total += 1;
      }),

    updateDocument: (id, updates) =>
      set((state) => {
        const doc = state.documents.find((d) => d.id === id);
        if (doc) Object.assign(doc, updates);

        if (state.currentDocument?.id === id) {
          Object.assign(state.currentDocument, updates);
        }
      }),

    removeDocument: (id) =>
      set((state) => {
        state.documents = state.documents.filter((d) => d.id !== id);
        state.pagination.total -= 1;

        if (state.currentDocument?.id === id) {
          state.currentDocument = null;
        }
      }),

    setLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),

    setSaving: (isSaving) =>
      set((state) => {
        state.isSaving = isSaving;
      }),

    setLastSaved: (time) =>
      set((state) => {
        state.lastSaved = time;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    setPagination: (pagination) =>
      set((state) => {
        Object.assign(state.pagination, pagination);
      }),

    setFilters: (filters) =>
      set((state) => {
        Object.assign(state.filters, filters);
      }),

    loadDocuments: (response) =>
      set((state) => {
        state.documents = response.documents;
        state.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
          hasMore: response.hasMore,
        };
        state.isLoading = false;
      }),

    reset: () =>
      set((state) => {
        state.documents = [];
        state.currentDocument = null;
        state.isLoading = false;
        state.isSaving = false;
        state.lastSaved = null;
        state.error = null;
        state.pagination = { ...defaultPagination };
        state.filters = { ...defaultFilters };
      }),
  }))
);
