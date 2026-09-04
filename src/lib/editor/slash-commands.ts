import type { BlockNoteEditor } from "@blocknote/core";
import { customBlockSchema, type CustomBlock } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SlashCommandCategory =
  | "basic"
  | "media"
  | "advanced"
  | "layout"
  | "ai"
  | "actions"
  | "templates";

export interface SlashCommand {
  name: string;
  label: string;
  aliases?: string[];
  description: string;
  icon: string;
  category: SlashCommandCategory;
  group?: string;
  command: (editor: BlockNoteEditor) => void;
  enabled?: boolean;
  badge?: string;
}

export interface SlashCommandGroup {
  category: SlashCommandCategory;
  label: string;
  commands: SlashCommand[];
}

export interface SlashCommandHistory {
  recentCommands: string[];
  maxRecent: number;
}

export interface SlashCommandFilter {
  query: string;
  category?: SlashCommandCategory;
}

// ─── Command Registry ────────────────────────────────────────────────────────

const commandRegistry: Map<string, SlashCommand> = new Map();
const commandHistory: SlashCommandHistory = {
  recentCommands: [],
  maxRecent: 5,
};

export function registerCommand(command: SlashCommand): void {
  commandRegistry.set(command.name, command);
}

export function unregisterCommand(name: string): void {
  commandRegistry.delete(name);
}

export function getCommand(name: string): SlashCommand | undefined {
  return commandRegistry.get(name);
}

export function getAllCommands(): SlashCommand[] {
  return Array.from(commandRegistry.values());
}

export function getCommandsByCategory(
  category: SlashCommandCategory
): SlashCommand[] {
  return getAllCommands().filter((cmd) => cmd.category === category);
}

export function searchCommands(query: string): SlashCommand[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return getRecentAndAll();

  const results: { command: SlashCommand; score: number }[] = [];

  for (const cmd of commandRegistry.values()) {
    let score = 0;

    if (cmd.name.toLowerCase().includes(lower)) score += 100;
    if (cmd.label.toLowerCase().includes(lower)) score += 80;
    if (cmd.description.toLowerCase().includes(lower)) score += 40;
    if (cmd.aliases?.some((a) => a.toLowerCase().includes(lower))) score += 60;
    if (cmd.group?.toLowerCase().includes(lower)) score += 30;

    if (score > 0) {
      results.push({ command: cmd, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .map((r) => r.command);
}

function getRecentAndAll(): SlashCommand[] {
  const recent = commandHistory.recentCommands
    .map((name) => commandRegistry.get(name))
    .filter((cmd): cmd is SlashCommand => cmd !== undefined);

  const others = getAllCommands().filter(
    (cmd) => !commandHistory.recentCommands.includes(cmd.name)
  );

  return [...recent, ...others];
}

export function trackCommandUsage(name: string): void {
  commandHistory.recentCommands = [
    name,
    ...commandHistory.recentCommands.filter((n) => n !== name),
  ].slice(0, commandHistory.maxRecent);
}

// ─── Command Categories ──────────────────────────────────────────────────────

export function getCommandGroups(): SlashCommandGroup[] {
  const categories: SlashCommandCategory[] = [
    "basic",
    "media",
    "advanced",
    "layout",
    "ai",
    "actions",
    "templates",
  ];

  const labels: Record<SlashCommandCategory, string> = {
    basic: "Basic Blocks",
    media: "Media",
    advanced: "Advanced",
    layout: "Layout",
    ai: "AI",
    actions: "Actions",
    templates: "Templates",
  };

  return categories
    .map((category) => ({
      category,
      label: labels[category],
      commands: getCommandsByCategory(category),
    }))
    .filter((group) => group.commands.length > 0);
}

// ─── Keyboard Navigation ─────────────────────────────────────────────────────

export interface SlashCommandNavigationState {
  isOpen: boolean;
  selectedIndex: number;
  filteredCommands: SlashCommand[];
  query: string;
  category?: SlashCommandCategory;
}

export function createNavigationState(): SlashCommandNavigationState {
  return {
    isOpen: false,
    selectedIndex: 0,
    filteredCommands: [],
    query: "",
  };
}

export function navigateUp(state: SlashCommandNavigationState): SlashCommandNavigationState {
  const newIndex = state.selectedIndex > 0
    ? state.selectedIndex - 1
    : state.filteredCommands.length - 1;

  return { ...state, selectedIndex: newIndex };
}

export function navigateDown(state: SlashCommandNavigationState): SlashCommandNavigationState {
  const newIndex = state.selectedIndex < state.filteredCommands.length - 1
    ? state.selectedIndex + 1
    : 0;

  return { ...state, selectedIndex: newIndex };
}

export function selectCommand(state: SlashCommandNavigationState): SlashCommand | null {
  if (state.filteredCommands.length === 0) return null;
  return state.filteredCommands[state.selectedIndex] || null;
}

export function filterCommands(
  state: SlashCommandNavigationState,
  query: string
): SlashCommandNavigationState {
  let commands = searchCommands(query);

  if (state.category) {
    commands = commands.filter((cmd) => cmd.category === state.category);
  }

  return {
    ...state,
    query,
    filteredCommands: commands,
    selectedIndex: 0,
  };
}

// ─── Default Commands ────────────────────────────────────────────────────────

export function registerDefaultCommands(): void {
  // ── Basic Blocks ─────────────────────────────────────────────────────────
  registerCommand({
    name: "paragraph",
    label: "Text",
    aliases: ["text", "p", "paragraph"],
    description: "Plain text paragraph",
    icon: "Type",
    category: "basic",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "paragraph" });
    },
  });

  registerCommand({
    name: "heading-1",
    label: "Heading 1",
    aliases: ["h1", "title"],
    description: "Large section heading",
    icon: "Heading1",
    category: "basic",
    group: "Headings",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "1" } });
    },
  });

  registerCommand({
    name: "heading-2",
    label: "Heading 2",
    aliases: ["h2"],
    description: "Medium section heading",
    icon: "Heading2",
    category: "basic",
    group: "Headings",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "2" } });
    },
  });

  registerCommand({
    name: "heading-3",
    label: "Heading 3",
    aliases: ["h3"],
    description: "Small section heading",
    icon: "Heading3",
    category: "basic",
    group: "Headings",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "3" } });
    },
  });

  registerCommand({
    name: "heading-4",
    label: "Heading 4",
    aliases: ["h4"],
    description: "Small heading",
    icon: "Heading4",
    category: "basic",
    group: "Headings",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "4" } });
    },
  });

  registerCommand({
    name: "heading-5",
    label: "Heading 5",
    aliases: ["h5"],
    description: "Smaller heading",
    icon: "Heading5",
    category: "basic",
    group: "Headings",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "5" } });
    },
  });

  registerCommand({
    name: "heading-6",
    label: "Heading 6",
    aliases: ["h6"],
    description: "Smallest heading",
    icon: "Heading6",
    category: "basic",
    group: "Headings",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "6" } });
    },
  });

  registerCommand({
    name: "bullet-list",
    label: "Bullet List",
    aliases: ["ul", "unordered"],
    description: "Bulleted list item",
    icon: "List",
    category: "basic",
    group: "Lists",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "bulletListItem" });
    },
  });

  registerCommand({
    name: "numbered-list",
    label: "Numbered List",
    aliases: ["ol", "ordered"],
    description: "Numbered list item",
    icon: "ListOrdered",
    category: "basic",
    group: "Lists",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "numberedListItem" });
    },
  });

  registerCommand({
    name: "check-list",
    label: "Check List",
    aliases: ["checkbox", "todo"],
    description: "Task list with checkboxes",
    icon: "ListChecks",
    category: "basic",
    group: "Lists",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "checkListItem" });
    },
  });

  registerCommand({
    name: "toggle-list",
    label: "Toggle List",
    aliases: ["collapsible", "accordion"],
    description: "Collapsible toggle block",
    icon: "ChevronRight",
    category: "basic",
    group: "Lists",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "toggle" });
    },
  });

  registerCommand({
    name: "callout",
    label: "Callout",
    aliases: ["alert", "info", "warning", "note"],
    description: "Highlighted information block",
    icon: "Info",
    category: "basic",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        type: "callout",
        props: { type: "info", emoji: "💡" },
      });
    },
  });

  registerCommand({
    name: "quote",
    label: "Quote",
    aliases: ["blockquote", "citation"],
    description: "Block quote",
    icon: "Quote",
    category: "basic",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "paragraph" });
    },
  });

  registerCommand({
    name: "divider",
    label: "Divider",
    aliases: ["hr", "horizontal-rule", "line"],
    description: "Horizontal separator line",
    icon: "Minus",
    category: "basic",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks([{ id: `div-${Date.now()}`, type: "divider", props: {}, content: [] }], block, "after");
    },
  });

  registerCommand({
    name: "code-block",
    label: "Code Block",
    aliases: ["code", "pre", "snippet"],
    description: "Code block with syntax highlighting",
    icon: "CodeSquare",
    category: "basic",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "codeBlock" });
    },
  });

  // ── Media ──────────────────────────────────────────────────────────────
  registerCommand({
    name: "image",
    label: "Image",
    aliases: ["img", "photo", "picture"],
    description: "Upload or embed an image",
    icon: "Image",
    category: "media",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `img-${Date.now()}`,
          type: "image",
          props: { url: "", caption: "", alt: "", alignment: "center" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "video",
    label: "Video",
    aliases: ["movie", "clip", "youtube"],
    description: "Embed a video",
    icon: "Video",
    category: "media",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `vid-${Date.now()}`,
          type: "video",
          props: { url: "", caption: "", showControls: true },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "audio",
    label: "Audio",
    aliases: ["sound", "music", "podcast"],
    description: "Embed an audio file",
    icon: "Music",
    category: "media",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `aud-${Date.now()}`,
          type: "audio",
          props: { url: "", caption: "", showControls: true },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "file",
    label: "File",
    aliases: ["attachment", "upload"],
    description: "Attach a file",
    icon: "Paperclip",
    category: "media",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `file-${Date.now()}`,
          type: "file",
          props: { url: "", name: "", mimeType: "", size: 0 },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "embed",
    label: "Embed",
    aliases: ["oembed", "iframe-embed"],
    description: "Embed external content (Twitter, CodePen, etc.)",
    icon: "Globe",
    category: "media",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `emb-${Date.now()}`,
          type: "embed",
          props: { url: "", caption: "", height: "400", width: "100%" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "iframe",
    label: "Iframe",
    aliases: ["frame", "webframe"],
    description: "Embed a web page in an iframe",
    icon: "ExternalLink",
    category: "media",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `iframe-${Date.now()}`,
          type: "iframe",
          props: { url: "", height: "400", width: "100%", sandbox: "allow-scripts allow-same-origin" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "bookmark",
    label: "Bookmark",
    aliases: ["link-preview", "url-preview"],
    description: "Create a bookmark from URL",
    icon: "Bookmark",
    category: "media",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `bm-${Date.now()}`,
          type: "bookmark",
          props: { url: "", title: "", description: "", icon: "", image: "" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  // ── Advanced ──────────────────────────────────────────────────────────
  registerCommand({
    name: "table",
    label: "Table",
    aliases: ["spreadsheet", "grid"],
    description: "Insert a table",
    icon: "Table",
    category: "advanced",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `tbl-${Date.now()}`,
          type: "table",
          props: { headerRow: true, striped: false, bordered: true },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "math",
    label: "Math Equation",
    aliases: ["latex", "equation", "formula"],
    description: "Write a LaTeX equation",
    icon: "Sigma",
    category: "advanced",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `math-${Date.now()}`,
          type: "math",
          props: { latex: "", displayMode: true },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "diagram",
    label: "Diagram",
    aliases: ["mermaid", "flowchart", "chart"],
    description: "Create a diagram with Mermaid",
    icon: "Workflow",
    category: "advanced",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `diag-${Date.now()}`,
          type: "diagram",
          props: { code: "", diagramType: "flowchart", theme: "default" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "table-of-contents",
    label: "Table of Contents",
    aliases: ["toc", "outline"],
    description: "Auto-generated table of contents",
    icon: "ListTree",
    category: "advanced",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `toc-${Date.now()}`,
          type: "tableOfContents",
          props: { depth: "3", startLevel: "1", numbered: false },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "synced-block",
    label: "Synced Block",
    aliases: ["synced", "reusable"],
    description: "Reusable content synced across pages",
    icon: "RefreshCw",
    category: "advanced",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `sync-${Date.now()}`,
          type: "syncedBlock",
          props: { syncSourceId: "", syncSourceTitle: "" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "template-variable",
    label: "Template Variable",
    aliases: ["variable", "placeholder", "dynamic"],
    description: "Insert a dynamic template variable",
    icon: "Braces",
    category: "advanced",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `var-${Date.now()}`,
          type: "templateVariable",
          props: { variableName: "", variableType: "text", defaultValue: "", required: false },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  // ── Layout ────────────────────────────────────────────────────────────
  registerCommand({
    name: "columns-2",
    label: "2 Columns",
    aliases: ["two-columns", "split", "grid-2"],
    description: "Two-column layout",
    icon: "Columns2",
    category: "layout",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `col-${Date.now()}`,
          type: "columns",
          props: { layout: "1-1", gap: "16" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "columns-3",
    label: "3 Columns",
    aliases: ["three-columns", "grid-3"],
    description: "Three-column layout",
    icon: "Columns3",
    category: "layout",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `col-${Date.now()}`,
          type: "columns",
          props: { layout: "1-1-1", gap: "16" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "columns-1-2",
    label: "1:2 Columns",
    aliases: ["sidebar-left", "wide-right"],
    description: "Wide right column layout",
    icon: "PanelRight",
    category: "layout",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `col-${Date.now()}`,
          type: "columns",
          props: { layout: "1-2", gap: "16" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  registerCommand({
    name: "columns-2-1",
    label: "2:1 Columns",
    aliases: ["sidebar-right", "wide-left"],
    description: "Wide left column layout",
    icon: "PanelLeft",
    category: "layout",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{
          id: `col-${Date.now()}`,
          type: "columns",
          props: { layout: "2-1", gap: "16" },
          content: [],
        }],
        block,
        "after"
      );
    },
  });

  // ── AI Commands ───────────────────────────────────────────────────────
  registerCommand({
    name: "ai-write",
    label: "AI: Write",
    aliases: ["generate", "ai-generate"],
    description: "Generate content with AI",
    icon: "Sparkles",
    category: "ai",
    badge: "AI",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        type: "paragraph",
        content: [{ type: "text", text: "[AI writing...]", styles: { italic: true } }],
      } as any);
    },
  });

  registerCommand({
    name: "ai-rewrite",
    label: "AI: Rewrite",
    aliases: ["ai-rephrase"],
    description: "Rewrite selected content with AI",
    icon: "RefreshCcw",
    category: "ai",
    badge: "AI",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        type: "paragraph",
        content: [{ type: "text", text: "[AI rewriting...]", styles: { italic: true } }],
      } as any);
    },
  });

  registerCommand({
    name: "ai-summarize",
    label: "AI: Summarize",
    aliases: ["ai-summary"],
    description: "Summarize content with AI",
    icon: "FileText",
    category: "ai",
    badge: "AI",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        type: "paragraph",
        content: [{ type: "text", text: "[AI summarizing...]", styles: { italic: true } }],
      } as any);
    },
  });

  registerCommand({
    name: "ai-translate",
    label: "AI: Translate",
    aliases: ["ai-translation"],
    description: "Translate content with AI",
    icon: "Languages",
    category: "ai",
    badge: "AI",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        type: "paragraph",
        content: [{ type: "text", text: "[AI translating...]", styles: { italic: true } }],
      } as any);
    },
  });

  registerCommand({
    name: "ai-expand",
    label: "AI: Expand",
    aliases: ["ai-elaborate"],
    description: "Expand content with AI",
    icon: "Maximize",
    category: "ai",
    badge: "AI",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        type: "paragraph",
        content: [{ type: "text", text: "[AI expanding...]", styles: { italic: true } }],
      } as any);
    },
  });

  registerCommand({
    name: "ai-fix",
    label: "AI: Fix Grammar",
    aliases: ["ai-grammar", "ai-proofread"],
    description: "Fix grammar and spelling with AI",
    icon: "CheckCircle",
    category: "ai",
    badge: "AI",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        type: "paragraph",
        content: [{ type: "text", text: "[AI fixing grammar...]", styles: { italic: true } }],
      } as any);
    },
  });

  // ── Actions ───────────────────────────────────────────────────────────
  registerCommand({
    name: "delete-block",
    label: "Delete Block",
    aliases: ["remove", "trash"],
    description: "Delete the current block",
    icon: "Trash2",
    category: "actions",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.removeBlocks([block.id]);
    },
  });

  registerCommand({
    name: "duplicate-block",
    label: "Duplicate Block",
    aliases: ["copy", "clone"],
    description: "Duplicate the current block",
    icon: "Copy",
    category: "actions",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks([{ ...block, id: `dup-${Date.now()}` }], block, "after");
    },
  });

  registerCommand({
    name: "move-up",
    label: "Move Up",
    aliases: ["up"],
    description: "Move block up",
    icon: "ArrowUp",
    category: "actions",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      const blocks = editor.topLevelBlocks;
      const idx = blocks.findIndex((b) => b.id === block.id);
      if (idx > 0) {
        editor.moveBlocks([block], blocks[idx - 1], "before");
      }
    },
  });

  registerCommand({
    name: "move-down",
    label: "Move Down",
    aliases: ["down"],
    description: "Move block down",
    icon: "ArrowDown",
    category: "actions",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      const blocks = editor.topLevelBlocks;
      const idx = blocks.findIndex((b) => => b.id === block.id);
      if (idx < blocks.length - 1) {
        editor.moveBlocks([block], blocks[idx + 1], "after");
      }
    },
  });

  registerCommand({
    name: "clear-formatting",
    label: "Clear Formatting",
    aliases: ["strip-styles"],
    description: "Remove all formatting from block",
    icon: "RemoveFormatting",
    category: "actions",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      if (Array.isArray(block.content)) {
        const plainContent = block.content.map((item: any) => ({
          type: "text",
          text: item.text || "",
          styles: {},
        }));
        editor.updateBlock(block, { content: plainContent } as any);
      }
    },
  });
}

// ─── Slash Command Trigger Detection ─────────────────────────────────────────

export function detectSlashCommandTrigger(text: string): {
  isTrigger: boolean;
  query: string;
  startIndex: number;
} | null {
  const slashIndex = text.lastIndexOf("/");
  if (slashIndex === -1) return null;

  const beforeSlash = text.slice(0, slashIndex);
  if (beforeSlash.length > 0 && !beforeSlash.endsWith(" ")) return null;

  const afterSlash = text.slice(slashIndex + 1);
  if (afterSlash.includes(" ")) return null;

  return {
    isTrigger: true,
    query: afterSlash,
    startIndex: slashIndex,
  };
}

// ─── Execute Command ─────────────────────────────────────────────────────────

export function executeCommand(
  editor: BlockNoteEditor,
  commandName: string
): boolean {
  const command = getCommand(commandName);
  if (!command) return false;

  if (command.enabled === false) return false;

  command.command(editor);
  trackCommandUsage(commandName);
  return true;
}

export function executeSlashCommand(
  editor: BlockNoteEditor,
  command: SlashCommand
): void {
  command.command(editor);
  trackCommandUsage(command.name);
}
