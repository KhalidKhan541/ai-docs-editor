import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Theme, User, UserPreferences } from "@/types";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
  duration?: number;
}

interface AppState {
  user: User | null;
  teamId: string | null;
  theme: Theme;
  locale: string;
  notifications: Notification[];
  isLoading: boolean;
  isConnected: boolean;
  sidebarOpen: boolean;
  preferences: UserPreferences;

  setUser: (user: User | null) => void;
  setTeamId: (teamId: string | null) => void;
  setTheme: (theme: Theme) => void;
  setLocale: (locale: string) => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  logout: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: "system",
  language: "en",
  editorFont: "Inter",
  editorFontSize: 16,
  editorLineHeight: 1.6,
  showWordCount: true,
  showReadingTime: true,
  autoSave: true,
  autoSaveInterval: 30_000,
  emailNotifications: true,
  browserNotifications: true,
};

export const useAppStore = create<AppState>()(
  immer((set) => ({
    user: null,
    teamId: null,
    theme: "system",
    locale: "en",
    notifications: [],
    isLoading: false,
    isConnected: true,
    sidebarOpen: true,
    preferences: { ...defaultPreferences },

    setUser: (user) =>
      set((state) => {
        state.user = user;
      }),

    setTeamId: (teamId) =>
      set((state) => {
        state.teamId = teamId;
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
        state.preferences.theme = theme;
      }),

    setLocale: (locale) =>
      set((state) => {
        state.locale = locale;
        state.preferences.language = locale;
      }),

    addNotification: (notification) =>
      set((state) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        state.notifications.push({ ...notification, id });

        if (notification.duration !== 0) {
          setTimeout(() => {
            useAppStore.getState().removeNotification(id);
          }, notification.duration ?? 5000);
        }
      }),

    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
      }),

    clearNotifications: () =>
      set((state) => {
        state.notifications = [];
      }),

    setLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),

    setConnected: (isConnected) =>
      set((state) => {
        state.isConnected = isConnected;
      }),

    setSidebarOpen: (sidebarOpen) =>
      set((state) => {
        state.sidebarOpen = sidebarOpen;
      }),

    toggleSidebar: () =>
      set((state) => {
        state.sidebarOpen = !state.sidebarOpen;
      }),

    updatePreferences: (prefs) =>
      set((state) => {
        Object.assign(state.preferences, prefs);
      }),

    logout: () =>
      set((state) => {
        state.user = null;
        state.teamId = null;
        state.notifications = [];
      }),
  }))
);
