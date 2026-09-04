import { generateId } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "mention"
  | "reply"
  | "assignment"
  | "reaction"
  | "resolve"
  | "suggestion"
  | "suggestion:accepted"
  | "suggestion:rejected"
  | "comment:status"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationChannel = "in_app" | "email" | "push" | "webhook";

export type Notification = {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  documentId: string;
  documentTitle: string;
  commentId?: string;
  suggestionId?: string;
  threadId?: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  channels: NotificationChannel[];
  metadata: Record<string, unknown>;
};

export type NotificationPreferences = {
  userId: string;
  channels: NotificationChannel[];
  mutedTypes: NotificationType[];
  mutedDocuments: string[];
  emailDigest: "instant" | "hourly" | "daily" | "weekly" | "never";
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  mentionSound: boolean;
  replySound: boolean;
};

export type NotificationFilter = {
  read?: boolean;
  type?: NotificationType | NotificationType[];
  dateFrom?: string;
  dateTo?: string;
  documentId?: string;
  priority?: NotificationPriority;
};

export type EmailNotification = {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  replyTo?: string;
};

export type NotificationEventListener = (event: NotificationEvent) => void;

export type NotificationEventType =
  | "notification:created"
  | "notification:read"
  | "notification:read_all"
  | "notification:deleted";

export type NotificationEvent = {
  type: NotificationEventType;
  notification?: Notification;
  notificationIds?: string[];
  actorId: string;
  timestamp: string;
};

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

function mentionEmailTemplate(
  senderName: string,
  documentTitle: string,
  commentPreview: string,
  documentUrl: string
): { subject: string; html: string; text: string } {
  return {
    subject: `${senderName} mentioned you in "${documentTitle}"`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 8px; font-size: 16px; color: #333;">You were mentioned</h2>
    <p style="margin: 0; color: #666;">${senderName} mentioned you in <strong>${documentTitle}</strong></p>
  </div>
  <div style="border-left: 3px solid #4f46e5; padding-left: 16px; margin: 20px 0; color: #555;">
    ${commentPreview}
  </div>
  <a href="${documentUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Document</a>
  <p style="margin-top: 30px; font-size: 12px; color: #999;">AI Docs Editor</p>
</body>
</html>`,
    text: `${senderName} mentioned you in "${documentTitle}"\n\n${commentPreview}\n\nView: ${documentUrl}`,
  };
}

function replyEmailTemplate(
  senderName: string,
  documentTitle: string,
  replyPreview: string,
  documentUrl: string
): { subject: string; html: string; text: string } {
  return {
    subject: `${senderName} replied to your comment in "${documentTitle}"`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 8px; font-size: 16px; color: #333;">New reply</h2>
    <p style="margin: 0; color: #666;">${senderName} replied to your comment in <strong>${documentTitle}</strong></p>
  </div>
  <div style="border-left: 3px solid #22c55e; padding-left: 16px; margin: 20px 0; color: #555;">
    ${replyPreview}
  </div>
  <a href="${documentUrl}" style="display: inline-block; background: #22c55e; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Reply</a>
  <p style="margin-top: 30px; font-size: 12px; color: #999;">AI Docs Editor</p>
</body>
</html>`,
    text: `${senderName} replied to your comment in "${documentTitle}"\n\n${replyPreview}\n\nView: ${documentUrl}`,
  };
}

function assignmentEmailTemplate(
  senderName: string,
  documentTitle: string,
  documentUrl: string
): { subject: string; html: string; text: string } {
  return {
    subject: `${senderName} assigned you a comment in "${documentTitle}"`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 8px; font-size: 16px; color: #333;">Comment assigned to you</h2>
    <p style="margin: 0; color: #666;">${senderName} assigned you a comment in <strong>${documentTitle}</strong></p>
  </div>
  <a href="${documentUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500;">View Comment</a>
  <p style="margin-top: 30px; font-size: 12px; color: #999;">AI Docs Editor</p>
</body>
</html>`,
    text: `${senderName} assigned you a comment in "${documentTitle}"\n\nView: ${documentUrl}`,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private userNotifications: Map<string, Set<string>> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private emailQueue: EmailNotification[] = [];
  private listeners: Set<NotificationEventListener> = new Set();

  // ---- Preferences -------------------------------------------------------

  getPreferences(userId: string): NotificationPreferences {
    return (
      this.preferences.get(userId) ?? {
        userId,
        channels: ["in_app"],
        mutedTypes: [],
        mutedDocuments: [],
        emailDigest: "daily",
        quietHoursStart: null,
        quietHoursEnd: null,
        mentionSound: true,
        replySound: true,
      }
    );
  }

  updatePreferences(userId: string, updates: Partial<Omit<NotificationPreferences, "userId">>): NotificationPreferences {
    const current = this.getPreferences(userId);
    const updated = { ...current, ...updates };
    this.preferences.set(userId, updated);
    return updated;
  }

  isMuted(userId: string, type: NotificationType, documentId?: string): boolean {
    const prefs = this.getPreferences(userId);
    if (prefs.mutedTypes.includes(type)) return true;
    if (documentId && prefs.mutedDocuments.includes(documentId)) return true;

    if (prefs.quietHoursStart && prefs.quietHoursEnd) {
      const now = new Date();
      const hours = now.getHours();
      const startHour = parseInt(prefs.quietHoursStart.split(":")[0] ?? "0", 10);
      const endHour = parseInt(prefs.quietHoursEnd.split(":")[0] ?? "0", 10);
      if (startHour <= endHour) {
        if (hours >= startHour && hours < endHour) return true;
      } else {
        if (hours >= startHour || hours < endHour) return true;
      }
    }

    return false;
  }

  // ---- Notification creation ---------------------------------------------

  private createNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    type: NotificationType,
    priority: NotificationPriority,
    title: string,
    body: string,
    documentId: string,
    documentTitle: string,
    channels: NotificationChannel[],
    metadata: Record<string, unknown> = {}
  ): Notification | null {
    if (this.isMuted(recipientId, type, documentId)) return null;
    if (recipientId === senderId) return null;

    const now = new Date().toISOString();
    const notification: Notification = {
      id: generateId(),
      recipientId,
      senderId,
      senderName,
      type,
      priority,
      title,
      body,
      documentId,
      documentTitle,
      read: false,
      readAt: null,
      createdAt: now,
      channels,
      metadata,
    };

    this.notifications.set(notification.id, notification);

    const userSet = this.userNotifications.get(recipientId) ?? new Set();
    userSet.add(notification.id);
    this.userNotifications.set(recipientId, userSet);

    this.emit({
      type: "notification:created",
      notification,
      actorId: senderId,
      timestamp: now,
    });

    if (channels.includes("email")) {
      this.queueEmailNotification(notification);
    }

    return notification;
  }

  notifyMention(
    recipientId: string,
    senderId: string,
    senderName: string,
    documentId: string,
    documentTitle: string,
    commentId: string,
    commentPreview: string,
    documentUrl: string
  ): Notification | null {
    const prefs = this.getPreferences(recipientId);
    const channels = prefs.channels.includes("email") ? ["in_app", "email" as NotificationChannel] : ["in_app" as NotificationChannel];

    return this.createNotification(
      recipientId,
      senderId,
      senderName,
      "mention",
      "high",
      `${senderName} mentioned you`,
      commentPreview,
      documentId,
      documentTitle,
      channels as NotificationChannel[],
      { commentId, documentUrl }
    );
  }

  notifyReply(
    recipientId: string,
    senderId: string,
    senderName: string,
    documentId: string,
    documentTitle: string,
    commentId: string,
    threadId: string,
    replyPreview: string,
    documentUrl: string
  ): Notification | null {
    const prefs = this.getPreferences(recipientId);
    const channels = prefs.channels.includes("email") ? ["in_app", "email" as NotificationChannel] : ["in_app" as NotificationChannel];

    return this.createNotification(
      recipientId,
      senderId,
      senderName,
      "reply",
      "medium",
      `${senderName} replied to your comment`,
      replyPreview,
      documentId,
      documentTitle,
      channels as NotificationChannel[],
      { commentId, threadId, documentUrl }
    );
  }

  notifyAssignment(
    recipientId: string,
    senderId: string,
    senderName: string,
    documentId: string,
    documentTitle: string,
    commentId: string,
    documentUrl: string
  ): Notification | null {
    const prefs = this.getPreferences(recipientId);
    const channels = prefs.channels.includes("email") ? ["in_app", "email" as NotificationChannel] : ["in_app" as NotificationChannel];

    return this.createNotification(
      recipientId,
      senderId,
      senderName,
      "assignment",
      "medium",
      `${senderName} assigned you a comment`,
      `You have been assigned a comment in "${documentTitle}"`,
      documentId,
      documentTitle,
      channels as NotificationChannel[],
      { commentId, documentUrl }
    );
  }

  notifyReaction(
    recipientId: string,
    senderId: string,
    senderName: string,
    documentId: string,
    documentTitle: string,
    commentId: string,
    emoji: string
  ): Notification | null {
    return this.createNotification(
      recipientId,
      senderId,
      senderName,
      "reaction",
      "low",
      `${senderName} reacted ${emoji}`,
      `${senderName} reacted with ${emoji} to your comment`,
      documentId,
      documentTitle,
      ["in_app"],
      { commentId, emoji }
    );
  }

  notifySuggestion(
    recipientId: string,
    senderId: string,
    senderName: string,
    documentId: string,
    documentTitle: string,
    suggestionId: string,
    action: "created" | "accepted" | "rejected"
  ): Notification | null {
    const titleMap = {
      created: `${senderName} made a suggestion`,
      accepted: `Your suggestion was accepted`,
      rejected: `Your suggestion was rejected`,
    };

    const bodyMap = {
      created: `${senderName} suggested a change in "${documentTitle}"`,
      accepted: `Your suggestion in "${documentTitle}" was accepted`,
      rejected: `Your suggestion in "${documentTitle}" was rejected`,
    };

    const priorityMap: Record<string, NotificationPriority> = {
      created: "medium",
      accepted: "high",
      rejected: "medium",
    };

    return this.createNotification(
      recipientId,
      senderId,
      senderName,
      `suggestion:${action}` as NotificationType,
      priorityMap[action],
      titleMap[action],
      bodyMap[action],
      documentId,
      documentTitle,
      ["in_app"],
      { suggestionId }
    );
  }

  // ---- Querying ----------------------------------------------------------

  getUserNotifications(userId: string, filter?: NotificationFilter): Notification[] {
    const ids = this.userNotifications.get(userId);
    if (!ids) return [];

    let results = Array.from(ids)
      .map((id) => this.notifications.get(id))
      .filter((n): n is Notification => n !== undefined);

    if (filter) {
      if (filter.read !== undefined) {
        results = results.filter((n) => n.read === filter.read);
      }
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        results = results.filter((n) => types.includes(n.type));
      }
      if (filter.dateFrom) {
        const from = new Date(filter.dateFrom).getTime();
        results = results.filter((n) => new Date(n.createdAt).getTime() >= from);
      }
      if (filter.dateTo) {
        const to = new Date(filter.dateTo).getTime();
        results = results.filter((n) => new Date(n.createdAt).getTime() <= to);
      }
      if (filter.documentId) {
        results = results.filter((n) => n.documentId === filter.documentId);
      }
      if (filter.priority) {
        results = results.filter((n) => n.priority === filter.priority);
      }
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getUnreadCount(userId: string): number {
    const ids = this.userNotifications.get(userId);
    if (!ids) return 0;
    return Array.from(ids).filter((id) => {
      const n = this.notifications.get(id);
      return n && !n.read;
    }).length;
  }

  getNotification(id: string): Notification | undefined {
    return this.notifications.get(id);
  }

  // ---- Read / Unread -----------------------------------------------------

  markAsRead(id: string, userId: string): boolean {
    const notification = this.notifications.get(id);
    if (!notification || notification.recipientId !== userId) return false;

    notification.read = true;
    notification.readAt = new Date().toISOString();

    this.emit({
      type: "notification:read",
      notification,
      actorId: userId,
      timestamp: notification.readAt,
    });

    return true;
  }

  markAllAsRead(userId: string): number {
    const ids = this.userNotifications.get(userId);
    if (!ids) return 0;

    let count = 0;
    const now = new Date().toISOString();
    for (const id of ids) {
      const n = this.notifications.get(id);
      if (n && !n.read) {
        n.read = true;
        n.readAt = now;
        count++;
      }
    }

    if (count > 0) {
      this.emit({
        type: "notification:read_all",
        notificationIds: Array.from(ids),
        actorId: userId,
        timestamp: now,
      });
    }

    return count;
  }

  // ---- Delete ------------------------------------------------------------

  deleteNotification(id: string, userId: string): boolean {
    const notification = this.notifications.get(id);
    if (!notification || notification.recipientId !== userId) return false;

    this.notifications.delete(id);
    const userSet = this.userNotifications.get(userId);
    userSet?.delete(id);

    this.emit({
      type: "notification:deleted",
      notification,
      actorId: userId,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  clearAll(userId: string): number {
    const ids = this.userNotifications.get(userId);
    if (!ids) return 0;

    const count = ids.size;
    for (const id of ids) {
      this.notifications.delete(id);
    }
    this.userNotifications.set(userId, new Set());

    return count;
  }

  // ---- Email queue -------------------------------------------------------

  private queueEmailNotification(notification: Notification): void {
    const templates: Record<NotificationType, (() => { subject: string; html: string; text: string }) | null> = {
      mention: () =>
        mentionEmailTemplate(
          notification.senderName,
          notification.documentTitle,
          notification.body,
          (notification.metadata.documentUrl as string) ?? ""
        ),
      reply: () =>
        replyEmailTemplate(
          notification.senderName,
          notification.documentTitle,
          notification.body,
          (notification.metadata.documentUrl as string) ?? ""
        ),
      assignment: () =>
        assignmentEmailTemplate(
          notification.senderName,
          notification.documentTitle,
          (notification.metadata.documentUrl as string) ?? ""
        ),
      reaction: null,
      resolve: null,
      suggestion: null,
      "suggestion:accepted": null,
      "suggestion:rejected": null,
      "comment:status": null,
      system: null,
    };

    const templateFn = templates[notification.type];
    if (!templateFn) return;

    const template = templateFn();
    this.emailQueue.push({
      to: notification.recipientId,
      subject: template.subject,
      htmlBody: template.html,
      textBody: template.text,
    });
  }

  async flushEmailQueue(): Promise<EmailNotification[]> {
    const queue = [...this.emailQueue];
    this.emailQueue = [];
    return queue;
  }

  getEmailQueue(): EmailNotification[] {
    return [...this.emailQueue];
  }

  // ---- Events ------------------------------------------------------------

  subscribe(listener: NotificationEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: NotificationEvent): void {
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
      notifications: Array.from(this.notifications.values()),
      userNotifications: Object.fromEntries(
        Array.from(this.userNotifications.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      preferences: Array.from(this.preferences.entries()),
      emailQueue: this.emailQueue,
    });
  }

  static fromJSON(json: string): NotificationService {
    const data = JSON.parse(json) as {
      notifications: Notification[];
      userNotifications: Record<string, string[]>;
      preferences: [string, NotificationPreferences][];
      emailQueue: EmailNotification[];
    };
    const service = new NotificationService();
    for (const n of data.notifications) {
      service.notifications.set(n.id, n);
    }
    for (const [userId, ids] of Object.entries(data.userNotifications)) {
      service.userNotifications.set(userId, new Set(ids));
    }
    for (const [userId, prefs] of data.preferences) {
      service.preferences.set(userId, prefs);
    }
    service.emailQueue = data.emailQueue;
    return service;
  }

  clear(): void {
    this.notifications.clear();
    this.userNotifications.clear();
    this.preferences.clear();
    this.emailQueue = [];
  }
}

export const notificationService = new NotificationService();
