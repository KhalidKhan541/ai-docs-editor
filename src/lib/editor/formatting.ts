import type { BlockNoteEditor, InlineContent, InlineContentSchema, StyleSchema } from "@blocknote/core";
import { customBlockSchema, type CustomBlock } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FormattingCommand {
  name: string;
  label: string;
  icon: string;
  shortcut?: string;
  command: (editor: BlockNoteEditor) => void;
  isActive?: (editor: BlockNoteEditor) => boolean;
}

export interface MarkDefinition {
  type: string;
  tag: string;
  attributes?: Record<string, string>;
  styles?: Record<string, string>;
}

export interface LinkConfig {
  autoLinkDetection: boolean;
  defaultTarget?: string;
  defaultRel?: string;
  allowedProtocols: string[];
  validator?: (url: string) => boolean;
}

export interface MentionConfig {
  trigger: string;
  allowSpaces: boolean;
  maxSuggestions: number;
  mentionChar: string;
}

export interface EmojiConfig {
  skinTone: "default" | "light" | "medium" | "mediumLight" | "mediumDark" | "dark";
  recentLimit: number;
  categoryOrder: EmojiCategory[];
}

export type EmojiCategory =
  | "smileys"
  | "people"
  | "animals"
  | "food"
  | "travel"
  | "activities"
  | "objects"
  | "symbols"
  | "flags";

// ─── Mark Definitions ────────────────────────────────────────────────────────

export const MARK_DEFINITIONS: MarkDefinition[] = [
  { type: "bold", tag: "strong" },
  { type: "italic", tag: "em" },
  { type: "underline", tag: "u" },
  { type: "strikethrough", tag: "s" },
  { type: "code", tag: "code", attributes: { class: "inline-code" } },
  { type: "highlight", tag: "mark", attributes: { class: "highlight" } },
  { type: "link", tag: "a", attributes: { href: "", target: "_blank", rel: "noopener noreferrer" } },
  { type: "superscript", tag: "sup" },
  { type: "subscript", tag: "sub" },
];

// ─── Inline Formatting Commands ──────────────────────────────────────────────

export const INLINE_FORMATTING_COMMANDS: FormattingCommand[] = [
  {
    name: "bold",
    label: "Bold",
    icon: "Bold",
    shortcut: "Ctrl+B",
    command: (editor) => editor.toggleStyles({ bold: true }),
    isActive: (editor) => editor.getActiveStyles().bold === true,
  },
  {
    name: "italic",
    label: "Italic",
    icon: "Italic",
    shortcut: "Ctrl+I",
    command: (editor) => editor.toggleStyles({ italic: true }),
    isActive: (editor) => editor.getActiveStyles().italic === true,
  },
  {
    name: "underline",
    label: "Underline",
    icon: "Underline",
    shortcut: "Ctrl+U",
    command: (editor) => editor.toggleStyles({ underline: true }),
    isActive: (editor) => editor.getActiveStyles().underline === true,
  },
  {
    name: "strikethrough",
    label: "Strikethrough",
    icon: "Strikethrough",
    shortcut: "Ctrl+Shift+X",
    command: (editor) => editor.toggleStyles({ strike: true }),
    isActive: (editor) => editor.getActiveStyles().strike === true,
  },
  {
    name: "code",
    label: "Code",
    icon: "Code",
    shortcut: "Ctrl+E",
    command: (editor) => editor.toggleStyles({ code: true }),
    isActive: (editor) => editor.getActiveStyles().code === true,
  },
  {
    name: "highlight",
    label: "Highlight",
    icon: "Highlighter",
    shortcut: "Ctrl+Shift+H",
    command: (editor) => editor.toggleStyles({ highlight: true }),
    isActive: (editor) => editor.getActiveStyles().highlight === true,
  },
];

// ─── Block Formatting Commands ───────────────────────────────────────────────

export const BLOCK_FORMATTING_COMMANDS: FormattingCommand[] = [
  {
    name: "heading-1", label: "Heading 1", icon: "Heading1", shortcut: "Ctrl+Shift+1",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "heading", props: { level: "1" } }); },
    isActive: (editor) => { const block = editor.getTextCursorPosition().block; return block.type === "heading" && (block.props as any)?.level === "1"; },
  },
  {
    name: "heading-2", label: "Heading 2", icon: "Heading2", shortcut: "Ctrl+Shift+2",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "heading", props: { level: "2" } }); },
    isActive: (editor) => { const block = editor.getTextCursorPosition().block; return block.type === "heading" && (block.props as any)?.level === "2"; },
  },
  {
    name: "heading-3", label: "Heading 3", icon: "Heading3", shortcut: "Ctrl+Shift+3",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "heading", props: { level: "3" } }); },
    isActive: (editor) => { const block = editor.getTextCursorPosition().block; return block.type === "heading" && (block.props as any)?.level === "3"; },
  },
  {
    name: "heading-4", label: "Heading 4", icon: "Heading4", shortcut: "Ctrl+Shift+4",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "heading", props: { level: "4" } }); },
    isActive: (editor) => { const block = editor.getTextCursorPosition().block; return block.type === "heading" && (block.props as any)?.level === "4"; },
  },
  {
    name: "heading-5", label: "Heading 5", icon: "Heading5", shortcut: "Ctrl+Shift+5",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "heading", props: { level: "5" } }); },
    isActive: (editor) => { const block = editor.getTextCursorPosition().block; return block.type === "heading" && (block.props as any)?.level === "5"; },
  },
  {
    name: "heading-6", label: "Heading 6", icon: "Heading6", shortcut: "Ctrl+Shift+6",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "heading", props: { level: "6" } }); },
    isActive: (editor) => { const block = editor.getTextCursorPosition().block; return block.type === "heading" && (block.props as any)?.level === "6"; },
  },
  {
    name: "paragraph", label: "Paragraph", icon: "Text", shortcut: "Ctrl+Shift+0",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "paragraph" }); },
    isActive: (editor) => editor.getTextCursorPosition().block.type === "paragraph",
  },
  {
    name: "code-block", label: "Code Block", icon: "CodeSquare", shortcut: "Ctrl+Shift+C",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "codeBlock" }); },
    isActive: (editor) => editor.getTextCursorPosition().block.type === "codeBlock",
  },
];

// ─── List Formatting Commands ────────────────────────────────────────────────

export const LIST_FORMATTING_COMMANDS: FormattingCommand[] = [
  {
    name: "bullet-list", label: "Bullet List", icon: "List",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "bulletListItem" }); },
    isActive: (editor) => editor.getTextCursorPosition().block.type === "bulletListItem",
  },
  {
    name: "numbered-list", label: "Numbered List", icon: "ListOrdered",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "numberedListItem" }); },
    isActive: (editor) => editor.getTextCursorPosition().block.type === "numberedListItem",
  },
  {
    name: "check-list", label: "Check List", icon: "ListChecks",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "checkListItem" }); },
    isActive: (editor) => editor.getTextCursorPosition().block.type === "checkListItem",
  },
  {
    name: "toggle-list", label: "Toggle List", icon: "ChevronRight",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { type: "toggle" }); },
    isActive: (editor) => editor.getTextCursorPosition().block.type === "toggle",
  },
];

// ─── Text Alignment Commands ─────────────────────────────────────────────────

export const ALIGNMENT_COMMANDS: FormattingCommand[] = [
  {
    name: "align-left", label: "Align Left", icon: "AlignLeft", shortcut: "Ctrl+Shift+L",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { props: { textAlignment: "left" } as any }); },
    isActive: (editor) => (editor.getTextCursorPosition().block.props as any)?.textAlignment === "left",
  },
  {
    name: "align-center", label: "Align Center", icon: "AlignCenter", shortcut: "Ctrl+Shift+E",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { props: { textAlignment: "center" } as any }); },
    isActive: (editor) => (editor.getTextCursorPosition().block.props as any)?.textAlignment === "center",
  },
  {
    name: "align-right", label: "Align Right", icon: "AlignRight", shortcut: "Ctrl+Shift+R",
    command: (editor) => { const block = editor.getTextCursorPosition().block; editor.updateBlock(block, { props: { textAlignment: "right" } as any }); },
    isActive: (editor) => (editor.getTextCursorPosition().block.props as any)?.textAlignment === "right",
  },
];

// ─── Link Management ─────────────────────────────────────────────────────────

export class LinkManager {
  private config: LinkConfig;

  constructor(config: Partial<LinkConfig> = {}) {
    this.config = { autoLinkDetection: true, allowedProtocols: ["http:", "https:", "mailto:", "tel:"], ...config };
  }

  isUrl(text: string): boolean {
    try {
      const url = new URL(text);
      return this.config.allowedProtocols.includes(url.protocol);
    } catch {
      return false;
    }
  }

  extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    return (text.match(urlRegex) || []).filter((url) => this.isUrl(url));
  }

  autoLink(text: string): string {
    if (!this.config.autoLinkDetection) return text;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    return text.replace(urlRegex, (url) => {
      const href = url.startsWith("http") ? url : `https://${url}`;
      return `[${url}](${href})`;
    });
  }

  createLink(editor: BlockNoteEditor, url: string, text?: void): void {
    if (!this.validateUrl(url)) return;
    const linkContent: InlineContent[] = [
      { type: "link", href: url, content: [{ type: "text", text: text || url, styles: {} }] } as any,
    ];
    editor.insertInlineContent(linkContent);
  }

  removeLink(editor: BlockNoteEditor): void {
    const block = editor.getTextCursorPosition().block;
    if (Array.isArray(block.content)) {
      const newContent = block.content.map((item: any) => {
        if (item.type === "link") return item.content || [];
        return item;
      }).flat();
      editor.updateBlock(block, { content: newContent } as any);
    }
  }

  validateUrl(url: string): boolean {
    if (this.config.validator) return this.config.validator(url);
    return this.isUrl(url);
  }

  normalizeUrl(url: string): string {
    if (!url.startsWith("http") && !url.startsWith("mailto:") && !url.startsWith("tel:")) return `https://${url}`;
    return url;
  }

  getLinkPreview(url: string): { title: string; description: string; image: string; favicon: string } {
    return {
      title: this.extractDomain(url),
      description: "",
      image: "",
      favicon: `https://www.google.com/s2/favicons?domain=${this.extractDomain(url)}&sz=32`,
    };
  }

  private extractDomain(url: string): string {
    try { return new URL(url).hostname; } catch { return url; }
  }
}

// ─── Mention System ──────────────────────────────────────────────────────────

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  role?: string;
  isOnline?: boolean;
}

export interface MentionSearchResult {
  user: MentionUser;
  score: number;
  matchType: "name" | "email" | "role";
}

export class MentionManager {
  private users: MentionUser[] = [];
  private config: MentionConfig;

  constructor(config: Partial<MentionConfig> = {}) {
    this.config = { trigger: "@", allowSpaces: true, maxSuggestions: 10, mentionChar: "@", ...config };
  }

  setUsers(users: MentionUser[]): void { this.users = users; }

  searchUsers(query: string): MentionSearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: MentionSearchResult[] = [];
    for (const user of this.users) {
      let score = 0;
      let matchType: MentionSearchResult["matchType"] = "name";
      if (user.name.toLowerCase().includes(lowerQuery)) {
        score = user.name.toLowerCase().startsWith(lowerQuery) ? 100 : 50;
        matchType = "name";
      } else if (user.email?.toLowerCase().includes(lowerQuery)) { score = 30; matchType = "email"; }
      else if (user.role?.toLowerCase().includes(lowerQuery)) { score = 20; matchType = "role"; }
      if (score > 0) results.push({ user, score, matchType });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, this.config.maxSuggestions);
  }

  insertMention(editor: BlockNoteEditor, user: MentionUser): void {
    const mentionContent: InlineContent[] = [
      { type: "mention" as any, userId: user.id, userName: user.name, userAvatar: user.avatar, content: [] } as any,
    ];
    editor.insertInlineContent(mentionContent);
  }

  extractMentionIds(content: any[]): string[] {
    const ids: string[] = [];
    function walk(items: any[]) {
      for (const item of items) {
        if (item.type === "mention") ids.push(item.userId);
        if (item.content && Array.isArray(item.content)) walk(item.content);
      }
    }
    walk(content);
    return ids;
  }
}

// ─── Emoji System ────────────────────────────────────────────────────────────

export interface EmojiItem {
  name: string;
  emoji: string;
  category: EmojiCategory;
  keywords: string[];
}

export const EMOJI_DATA: EmojiItem[] = [
  { name: "grinning", emoji: "😀", category: "smileys", keywords: ["happy", "smile"] },
  { name: "joy", emoji: "😂", category: "smileys", keywords: ["laugh", "tears"] },
  { name: "heart_eyes", emoji: "😍", category: "smileys", keywords: ["love", "crush"] },
  { name: "thinking", emoji: "🤔", category: "smileys", keywords: ["think", "hmm"] },
  { name: "rocket", emoji: "🚀", category: "objects", keywords: ["ship", "launch"] },
  { name: "fire", emoji: "🔥", category: "objects", keywords: ["hot", "flame"] },
  { name: "star", emoji: "⭐", category: "objects", keywords: ["star", "favorite"] },
  { name: "check", emoji: "✅", category: "symbols", keywords: ["done", "complete", "yes"] },
  { name: "cross", emoji: "❌", category: "symbols", keywords: ["no", "cancel", "wrong"] },
  { name: "warning", emoji: "⚠️", category: "symbols", keywords: ["alert", "caution"] },
  { name: "bulb", emoji: "💡", category: "objects", keywords: ["idea", "light"] },
  { name: "memo", emoji: "📝", category: "objects", keywords: ["write", "note", "document"] },
  { name: "link", emoji: "🔗", category: "objects", keywords: ["url", "chain", "link"] },
  { name: "calendar", emoji: "📅", category: "objects", keywords: ["date", "schedule"] },
  { name: "clock", emoji: "🕐", category: "objects", keywords: ["time", "clock"] },
  { name: "pin", emoji: "📌", category: "objects", keywords: ["pin", "important"] },
  { name: "lock", emoji: "🔒", category: "objects", keywords: ["security", "private"] },
  { name: "user", emoji: "👤", category: "people", keywords: ["person", "profile"] },
  { name: "users", emoji: "👥", category: "people", keywords: ["team", "group", "people"] },
  { name: "wrench", emoji: "🔧", category: "objects", keywords: ["tool", "fix", "settings"] },
  { name: "bug", emoji: "🐛", category: "animals", keywords: ["insect", "error", "debug"] },
  { name: "tada", emoji: "🎉", category: "activities", keywords: ["party", "celebration"] },
  { name: "chart", emoji: "📊", category: "objects", keywords: ["graph", "analytics", "data"] },
  { name: "folder", emoji: "📁", category: "objects", keywords: ["directory", "file"] },
];

export class EmojiManager {
  private config: EmojiConfig;
  private recentEmojis: string[] = [];

  constructor(config: Partial<EmojiConfig> = {}) {
    this.config = { skinTone: "default", recentLimit: 30, categoryOrder: ["smileys", "people", "animals", "food", "travel", "activities", "objects", "symbols", "flags"], ...config };
  }

  search(query: string): EmojiItem[] {
    const lower = query.toLowerCase();
    return EMOJI_DATA.filter((e) => e.name.includes(lower) || e.keywords.some((k) => k.includes(lower))).slice(0, 20);
  }

  getRecent(): EmojiItem[] {
    return this.recentEmojis.map((name) => EMOJI_DATA.find((e) => e.name === name)).filter((e): e is EmojiItem => e !== undefined);
  }

  addToRecent(emojiName: string): void {
    this.recentEmojis = [emojiName, ...this.recentEmojis.filter((e) => e !== emojiName)].slice(0, this.config.recentLimit);
  }

  getByCategory(category: EmojiCategory): EmojiItem[] { return EMOJI_DATA.filter((e) => e.category === category); }
  getCategories(): EmojiCategory[] { return this.config.categoryOrder; }

  insertEmoji(editor: BlockNoteEditor, emoji: string): void {
    editor.insertInlineContent([{ type: "text", text: emoji, styles: {} } as any]);
  }
}

// ─── Date Mention System ─────────────────────────────────────────────────────

export interface DateMention {
  date: Date;
  format: "short" | "long" | "relative";
  label: string;
}

export class DateMentionManager {
  insertDateMention(editor: BlockNoteEditor, date: Date, format: DateMention["format"] = "long"): void {
    const dateContent: InlineContent[] = [
      { type: "mention" as any, mentionType: "date", date: date.toISOString(), format, content: [{ type: "text", text: this.formatDate(date, format), styles: {} }] } as any,
    ];
    editor.insertInlineContent(dateContent);
  }

  formatDate(date: Date, format: DateMention["format"]): string {
    switch (format) {
      case "short": return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      case "long": return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      case "relative": return this.getRelativeDate(date);
      default: return date.toLocaleDateString();
    }
  }

  private getRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays === -1) return "Tomorrow";
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays < 0 && diffDays >= -7) return `In ${Math.abs(diffDays)} days`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  parseDateFromText(text: string): Date | null {
    const datePatterns = [/(\d{4})-(\d{2})-(\d{2})/, /(\d{1,2})\/(\d{1,2})\/(\d{4})/, /(\w+ \d{1,2},?\s*\d{4})/];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) return date;
      }
    }
    return null;
  }
}

// ─── Reference Linking System ────────────────────────────────────────────────

export interface DocReference {
  docId: string;
  title: string;
  type: "document" | "page" | "note";
  url?: string;
  icon?: string;
}

export class ReferenceLinkManager {
  private documents: DocReference[] = [];

  setDocuments(docs: DocReference[]): void { this.documents = docs; }

  search(query: string): DocReference[] {
    const lower = query.toLowerCase();
    return this.documents.filter((d) => d.title.toLowerCase().includes(lower) || d.type.toLowerCase().includes(lower)).slice(0, 10);
  }

  insertReference(editor: BlockNoteEditor, doc: DocReference): void {
    const refContent: InlineContent[] = [
      { type: "mention" as any, mentionType: "reference", docId: doc.docId, docTitle: doc.title, docType: doc.type, content: [{ type: "text", text: doc.title, styles: {} }] } as any,
    ];
    editor.insertInlineContent(refContent);
  }

  extractReferences(content: any[]): DocReference[] {
    const refs: DocReference[] = [];
    function walk(items: any[]) {
      for (const item of items) {
        if (item.type === "mention" && item.mentionType === "reference") {
          refs.push({ docId: item.docId, title: item.docTitle, type: item.docType || "document" });
        }
        if (item.content && Array.isArray(item.content)) walk(item.content);
      }
    }
    walk(content);
    return refs;
  }
}

// ─── Formatting Utilities ────────────────────────────────────────────────────

export function getAllFormattingCommands(): FormattingCommand[] {
  return [...INLINE_FORMATTING_COMMANDS, ...BLOCK_FORMATTING_COMMANDS, ...LIST_FORMATTING_COMMANDS, ...ALIGNMENT_COMMANDS];
}

export function getFormattingCommand(name: string): FormattingCommand | undefined {
  return getAllFormattingCommands().find((cmd) => cmd.name === name);
}

export function getActiveFormatting(editor: BlockNoteEditor): Record<string, boolean> {
  const active: Record<string, boolean> = {};
  for (const cmd of INLINE_FORMATTING_COMMANDS) active[cmd.name] = cmd.isActive?.(editor) || false;
  return active;
}

export function isFormatActive(editor: BlockNoteEditor, formatName: string): boolean {
  const cmd = getFormattingCommand(formatName);
  return cmd?.isActive?.(editor) || false;
}

export function toggleFormat(editor: BlockNoteEditor, formatName: string): void {
  const cmd = getFormattingCommand(formatName);
  if (cmd) cmd.command(editor);
}
