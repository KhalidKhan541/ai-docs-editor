type EventCallback<T = unknown> = (data: T) => void;

interface EventEntry {
  callback: EventCallback;
  once: boolean;
}

export class EventEmitter<Events extends Record<string, unknown> = Record<string, unknown>> {
  private listeners = new Map<string, EventEntry[]>();
  private maxListeners = 50;

  on<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>
  ): () => void {
    return this.addListener(event, callback, false);
  }

  once<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>
  ): () => void {
    return this.addListener(event, callback, true);
  }

  private addListener<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>,
    once: boolean
  ): () => void {
    const key = String(event);
    const entries = this.listeners.get(key) ?? [];

    if (entries.length >= this.maxListeners) {
      console.warn(
        `Max listeners (${this.maxListeners}) exceeded for event "${key}"`
      );
    }

    const entry: EventEntry = { callback: callback as EventCallback, once };
    entries.push(entry);
    this.listeners.set(key, entries);

    return () => this.removeListener(event, callback as EventCallback);
  }

  off<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>
  ): void {
    this.removeListener(event, callback as EventCallback);
  }

  private removeListener(event: string | number | symbol, callback: EventCallback): void {
    const key = String(event);
    const entries = this.listeners.get(key);
    if (!entries) return;

    const filtered = entries.filter((e) => e.callback !== callback);
    if (filtered.length === 0) {
      this.listeners.delete(key);
    } else {
      this.listeners.set(key, filtered);
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): boolean {
    const key = String(event);
    const entries = this.listeners.get(key);
    if (!entries || entries.length === 0) return false;

    const toRemove: EventEntry[] = [];

    for (const entry of entries) {
      try {
        entry.callback(data);
      } catch (error) {
        console.error(`Error in event listener for "${key}":`, error);
      }
      if (entry.once) {
        toRemove.push(entry);
      }
    }

    if (toRemove.length > 0) {
      const remaining = entries.filter((e) => !toRemove.includes(e));
      if (remaining.length === 0) {
        this.listeners.delete(key);
      } else {
        this.listeners.set(key, remaining);
      }
    }

    return true;
  }

  removeAllListeners(event?: keyof Events): void {
    if (event) {
      this.listeners.delete(String(event));
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: keyof Events): number {
    return this.listeners.get(String(event))?.length ?? 0;
  }

  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  setMaxListeners(max: number): this {
    this.maxListeners = max;
    return this;
  }

  addListener<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>
  ): () => void {
    return this.on(event, callback);
  }

  prependListener<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>
  ): () => void {
    const key = String(event);
    const entries = this.listeners.get(key) ?? [];
    const entry: EventEntry = { callback: callback as EventCallback, once: false };
    entries.unshift(entry);
    this.listeners.set(key, entries);
    return () => this.removeListener(event, callback as EventCallback);
  }
}

export interface AppEvents {
  "document:created": { id: string; title: string };
  "document:updated": { id: string; changes: string[] };
  "document:deleted": { id: string };
  "document:shared": { id: string; userId: string; permission: string };
  "document:published": { id: string; url: string };
  "comment:created": { threadId: string; documentId: string };
  "comment:resolved": { threadId: string; documentId: string };
  "mention:received": { userId: string; documentId: string };
  "collaboration:joined": { documentId: string; userId: string };
  "collaboration:left": { documentId: string; userId: string };
  "ai:suggestion": { documentId: string; count: number };
  "user:login": { userId: string };
  "user:logout": { userId: string };
  "notification:received": { id: string; type: string };
  "theme:changed": { theme: string };
  "sidebar:toggle": { open: boolean };
  "modal:open": { modal: string; data?: unknown };
  "modal:close": { modal: string };
}

export const appEvents = new EventEmitter<AppEvents>();
