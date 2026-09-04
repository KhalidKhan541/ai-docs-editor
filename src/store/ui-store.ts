import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ModalState {
  isOpen: boolean;
  data?: unknown;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  rightPanelOpen: boolean;
  rightPanelTab: "comments" | "ai" | "versions" | "details";
  modals: Record<string, ModalState>;
  toasts: Toast[];
  commandPaletteOpen: boolean;
  searchOpen: boolean;
  isFullscreen: boolean;
  isMobile: boolean;
  isTablet: boolean;
  breadcrumbs: Array<{ label: string; href?: string }>;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: UIState["rightPanelTab"]) => void;
  openModal: (key: string, data?: unknown) => void;
  closeModal: (key: string) => void;
  closeAllModals: () => void;
  isModalOpen: (key: string) => boolean;
  getModalData: <T = unknown>(key: string) => T | undefined;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setMobile: (mobile: boolean) => void;
  setTablet: (tablet: boolean) => void;
  setBreadcrumbs: (breadcrumbs: UIState["breadcrumbs"]) => void;
}

interface Toast {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useUIStore = create<UIState>()(
  immer((set, get) => ({
    sidebarOpen: true,
    sidebarWidth: 260,
    rightPanelOpen: false,
    rightPanelTab: "comments",
    modals: {},
    toasts: [],
    commandPaletteOpen: false,
    searchOpen: false,
    isFullscreen: false,
    isMobile: false,
    isTablet: false,
    breadcrumbs: [],

    setSidebarOpen: (sidebarOpen) =>
      set((state) => {
        state.sidebarOpen = sidebarOpen;
      }),

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),

    setSidebarWidth: (sidebarWidth) =>
      set((state) => {
        state.sidebarWidth = sidebarWidth;
      }),

    setRightPanelOpen: (rightPanelOpen) =>
      set((state) => {
        state.rightPanelOpen = rightPanelOpen;
      }),

    setRightPanelTab: (rightPanelTab) =>
      set((state) => {
        state.rightPanelTab = rightPanelTab;
        state.rightPanelOpen = true;
      }),

    openModal: (key, data) =>
      set((state) => {
        state.modals[key] = { isOpen: true, data };
      }),

    closeModal: (key) =>
      set((state) => {
        if (state.modals[key]) {
          state.modals[key]!.isOpen = false;
          state.modals[key]!.data = undefined;
        }
      }),

    closeAllModals: () =>
      set((state) => {
        for (const key of Object.keys(state.modals)) {
          state.modals[key] = { isOpen: false, data: undefined };
        }
      }),

    isModalOpen: (key) => {
      return get().modals[key]?.isOpen ?? false;
    },

    getModalData: <T = unknown>(key: string): T | undefined => {
      return get().modals[key]?.data as T | undefined;
    },

    addToast: (toast) =>
      set((state) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        state.toasts.push({ ...toast, id });

        if (toast.duration !== 0) {
          setTimeout(() => {
            useUIStore.getState().removeToast(id);
          }, toast.duration ?? 5000);
        }
      }),

    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      }),

    clearToasts: () =>
      set((state) => {
        state.toasts = [];
      }),

    setCommandPaletteOpen: (commandPaletteOpen) =>
      set((state) => {
        state.commandPaletteOpen = commandPaletteOpen;
      }),

    setSearchOpen: (searchOpen) =>
      set((state) => {
        state.searchOpen = searchOpen;
      }),

    setFullscreen: (isFullscreen) =>
      set((state) => {
        state.isFullscreen = isFullscreen;
      }),

    setMobile: (isMobile) =>
      set((state) => {
        state.isMobile = isMobile;
      }),

    setTablet: (isTablet) =>
      set((state) => {
        state.isTablet = isTablet;
      }),

    setBreadcrumbs: (breadcrumbs) =>
      set((state) => {
        state.breadcrumbs = breadcrumbs;
      }),
  }))
);
