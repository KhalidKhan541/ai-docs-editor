import type { BlockNoteEditor } from "@blocknote/core";
import { customBlockSchema } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KeyBinding {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  command: (editor: BlockNoteEditor) => void;
  category: KeyBindingCategory;
  enabled?: boolean;
  priority?: number;
}

export type KeyBindingCategory =
  | "formatting"
  | "block"
  | "list"
  | "table"
  | "navigation"
  | "editing"
  | "custom";

export interface KeyBindingConflict {
  keyCombo: string;
  bindings: KeyBinding[];
}

export interface KeyBindingMap {
  bindings: KeyBinding[];
  customBindings: KeyBinding[];
}

// ─── Key Binding Registry ────────────────────────────────────────────────────

const keyBindings: KeyBinding[] = [];
const customKeyBindings: KeyBinding[] = [];

export function registerKeyBinding(binding: KeyBinding): void {
  const existing = keyBindings.findIndex(
    (b) => b.key === binding.key &&
      b.ctrlKey === binding.ctrlKey &&
      b.shiftKey === binding.shiftKey &&
      b.altKey === binding.altKey
  );

  if (existing >= 0) {
    keyBindings[existing] = binding;
  } else {
    keyBindings.push(binding);
  }
}

export function registerCustomKeyBinding(binding: KeyBinding): void {
  customKeyBindings.push(binding);
}

export function removeKeyBinding(key: string, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean): void {
  const idx = keyBindings.findIndex(
    (b) => b.key === key &&
      b.ctrlKey === ctrlKey &&
      b.shiftKey === shiftKey &&
      b.altKey === altKey
  );
  if (idx >= 0) keyBindings.splice(idx, 1);

  const customIdx = customKeyBindings.findIndex(
    (b) => b.key === key &&
      b.ctrlKey === ctrlKey &&
      b.shiftKey === shiftKey &&
      b.altKey === altKey
  );
  if (customIdx >= 0) customKeyBindings.splice(customIdx, 1);
}

export function getAllKeyBindings(): KeyBinding[] {
  return [...keyBindings, ...customKeyBindings].sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );
}

export function getKeyBindingsByCategory(
  category: KeyBindingCategory
): KeyBinding[] {
  return getAllKeyBindings().filter((b) => b.category === category);
}

// ─── Conflict Detection ──────────────────────────────────────────────────────

export function detectConflicts(): KeyBindingConflict[] {
  const allBindings = getAllKeyBindings();
  const conflictMap = new Map<string, KeyBinding[]>();

  for (const binding of allBindings) {
    const combo = formatKeyCombo(binding);
    const existing = conflictMap.get(combo) || [];
    existing.push(binding);
    conflictMap.set(combo, existing);
  }

  const conflicts: KeyBindingConflict[] = [];
  for (const [combo, bindings] of conflictMap) {
    if (bindings.length > 1) {
      conflicts.push({ keyCombo: combo, bindings });
    }
  }

  return conflicts;
}

function formatKeyCombo(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrlKey) parts.push("Ctrl");
  if (binding.metaKey) parts.push("Cmd");
  if (binding.altKey) parts.push("Alt");
  if (binding.shiftKey) parts.push("Shift");
  parts.push(binding.key.toUpperCase());
  return parts.join("+");
}

// ─── Keyboard Event Handler ──────────────────────────────────────────────────

export function handleKeyDown(
  event: KeyboardEvent,
  editor: BlockNoteEditor
): boolean {
  const allBindings = getAllKeyBindings();

  for (const binding of allBindings) {
    if (binding.enabled === false) continue;

    if (matchesKeyBinding(event, binding)) {
      event.preventDefault();
      event.stopPropagation();
      binding.command(editor);
      return true;
    }
  }

  return false;
}

function matchesKeyBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
  const keyMatch = event.key.toLowerCase() === binding.key.toLowerCase() ||
    event.code.toLowerCase() === binding.key.toLowerCase();

  const ctrlMatch = binding.ctrlKey === true
    ? event.ctrlKey || event.metaKey
    : binding.ctrlKey === false
      ? !event.ctrlKey && !event.metaKey
      : true;

  const shiftMatch = binding.shiftKey === true
    ? event.shiftKey
    : binding.shiftKey === false
      ? !event.shiftKey
      : true;

  const altMatch = binding.altKey === true
    ? event.altKey
    : binding.altKey === false
      ? !event.altKey
      : true;

  return keyMatch && ctrlMatch && shiftMatch && altMatch;
}

// ─── Default Key Bindings ────────────────────────────────────────────────────

export function registerDefaultKeyBindings(): void {
  // ── Formatting ────────────────────────────────────────────────────────
  registerKeyBinding({
    key: "b",
    ctrlKey: true,
    description: "Bold",
    category: "formatting",
    command: (editor) => editor.toggleStyles({ bold: true }),
    priority: 100,
  });

  registerKeyBinding({
    key: "i",
    ctrlKey: true,
    description: "Italic",
    category: "formatting",
    command: (editor) => editor.toggleStyles({ italic: true }),
    priority: 100,
  });

  registerKeyBinding({
    key: "u",
    ctrlKey: true,
    description: "Underline",
    category: "formatting",
    command: (editor) => editor.toggleStyles({ underline: true }),
    priority: 100,
  });

  registerKeyBinding({
    key: "e",
    ctrlKey: true,
    description: "Inline Code",
    category: "formatting",
    command: (editor) => editor.toggleStyles({ code: true }),
    priority: 100,
  });

  registerKeyBinding({
    key: "x",
    ctrlKey: true,
    shiftKey: true,
    description: "Strikethrough",
    category: "formatting",
    command: (editor) => editor.toggleStyles({ strike: true }),
    priority: 90,
  });

  registerKeyBinding({
    key: "h",
    ctrlKey: true,
    shiftKey: true,
    description: "Highlight",
    category: "formatting",
    command: (editor) => editor.toggleStyles({ highlight: true }),
    priority: 90,
  });

  registerKeyBinding({
    key: "d",
    ctrlKey: true,
    shiftKey: true,
    description: "Superscript",
    category: "formatting",
    command: (editor) => editor.toggleStyles({ superscript: true } as any),
    priority: 80,
  });

  // ── Block Headings ────────────────────────────────────────────────────
  registerKeyBinding({
    key: "1",
    ctrlKey: true,
    shiftKey: true,
    description: "Heading 1",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "1" } });
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "2",
    ctrlKey: true,
    shiftKey: true,
    description: "Heading 2",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "2" } });
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "3",
    ctrlKey: true,
    shiftKey: true,
    description: "Heading 3",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "3" } });
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "4",
    ctrlKey: true,
    shiftKey: true,
    description: "Heading 4",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "4" } });
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "5",
    ctrlKey: true,
    shiftKey: true,
    description: "Heading 5",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "5" } });
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "6",
    ctrlKey: true,
    shiftKey: true,
    description: "Heading 6",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "heading", props: { level: "6" } });
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "0",
    ctrlKey: true,
    shiftKey: true,
    description: "Paragraph",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "paragraph" });
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "q",
    ctrlKey: true,
    shiftKey: true,
    description: "Blockquote",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "paragraph" });
    },
    priority: 90,
  });

  registerKeyBinding({
    key: "c",
    ctrlKey: true,
    shiftKey: true,
    description: "Code Block",
    category: "block",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "codeBlock" });
    },
    priority: 90,
  });

  // ── List Shortcuts ────────────────────────────────────────────────────
  registerKeyBinding({
    key: "8",
    ctrlKey: true,
    shiftKey: true,
    description: "Bullet List",
    category: "list",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "bulletListItem" });
    },
    priority: 90,
  });

  registerKeyBinding({
    key: "7",
    ctrlKey: true,
    shiftKey: true,
    description: "Numbered List",
    category: "list",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "numberedListItem" });
    },
    priority: 90,
  });

  registerKeyBinding({
    key: "9",
    ctrlKey: true,
    shiftKey: true,
    description: "Check List",
    category: "list",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { type: "checkListItem" });
    },
    priority: 90,
  });

  registerKeyBinding({
    key: "Tab",
    description: "Indent",
    category: "list",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      if (block.parentId) {
        const parent = editor.getBlock(block.parentId);
        if (parent) {
          editor.moveBlocks([block], parent);
        }
      }
    },
    priority: 85,
  });

  registerKeyBinding({
    key: "Tab",
    shiftKey: true,
    description: "Outdent",
    category: "list",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      if (block.parentId) {
        const parent = editor.getBlock(block.parentId);
        if (parent?.parentId) {
          const grandparent = editor.getBlock(parent.parentId);
          if (grandparent) {
            editor.moveBlocks([block], grandparent, "after");
          }
        }
      }
    },
    priority: 85,
  });

  // ── Table Shortcuts ───────────────────────────────────────────────────
  registerKeyBinding({
    key: "Tab",
    description: "Next Cell",
    category: "table",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      if (block.type === "table") {
        editor.focus();
      }
    },
    priority: 70,
  });

  registerKeyBinding({
    key: "Tab",
    shiftKey: true,
    description: "Previous Cell",
    category: "table",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      if (block.type === "table") {
        editor.focus();
      }
    },
    priority: 70,
  });

  // ── Navigation ────────────────────────────────────────────────────────
  registerKeyBinding({
    key: "Home",
    description: "Go to start of line",
    category: "navigation",
    command: (editor) => {
      editor.focus();
    },
    priority: 60,
  });

  registerKeyBinding({
    key: "End",
    description: "Go to end of line",
    category: "navigation",
    command: (editor) => {
      editor.focus();
    },
    priority: 60,
  });

  registerKeyBinding({
    key: "Home",
    ctrlKey: true,
    description: "Go to start of document",
    category: "navigation",
    command: (editor) => {
      const blocks = editor.topLevelBlocks;
      if (blocks.length > 0) {
        editor.setTextCursorPosition(blocks[0], "start");
      }
    },
    priority: 60,
  });

  registerKeyBinding({
    key: "End",
    ctrlKey: true,
    description: "Go to end of document",
    category: "navigation",
    command: (editor) => {
      const blocks = editor.topLevelBlocks;
      if (blocks.length > 0) {
        editor.setTextCursorPosition(blocks[blocks.length - 1], "end");
      }
    },
    priority: 60,
  });

  // ── Editing ───────────────────────────────────────────────────────────
  registerKeyBinding({
    key: "Backspace",
    ctrlKey: true,
    description: "Delete word backward",
    category: "editing",
    command: (editor) => {
      editor.focus();
    },
    priority: 80,
  });

  registerKeyBinding({
    key: "Delete",
    ctrlKey: true,
    description: "Delete word forward",
    category: "editing",
    command: (editor) => {
      editor.focus();
    },
    priority: 80,
  });

  registerKeyBinding({
    key: "z",
    ctrlKey: true,
    shiftKey: true,
    description: "Redo",
    category: "editing",
    command: (editor) => {
      editor.undo();
    },
    priority: 100,
  });

  registerKeyBinding({
    key: "y",
    ctrlKey: true,
    description: "Redo",
    category: "editing",
    command: (editor) => {
      editor.undo();
    },
    priority: 100,
  });

  registerKeyBinding({
    key: "z",
    ctrlKey: true,
    description: "Undo",
    category: "editing",
    command: (editor) => {
      editor.undo();
    },
    priority: 100,
  });

  registerKeyBinding({
    key: "a",
    ctrlKey: true,
    description: "Select All",
    category: "editing",
    command: (editor) => {
      editor.focus();
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "c",
    ctrlKey: true,
    description: "Copy",
    category: "editing",
    command: (editor) => {
      document.execCommand("copy");
    },
    priority: 100,
  });

  registerKeyBinding({
    key: "x",
    ctrlKey: true,
    description: "Cut",
    category: "editing",
    command: (editor) => {
      document.execCommand("cut");
    },
    priority: 100,
  });

  registerKeyBinding({
    key: "v",
    ctrlKey: true,
    description: "Paste",
    category: "editing",
    command: (editor) => {
      document.execCommand("paste");
    },
    priority: 100,
  });

  registerKeyBinding({
    key: "s",
    ctrlKey: true,
    description: "Save",
    category: "editing",
    command: () => {
      // Handled by app-level save
    },
    priority: 100,
  });

  registerKeyBinding({
    key: "f",
    ctrlKey: true,
    description: "Find",
    category: "editing",
    command: () => {
      // Handled by app-level find
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "h",
    ctrlKey: true,
    description: "Find and Replace",
    category: "editing",
    command: () => {
      // Handled by app-level find/replace
    },
    priority: 95,
  });

  registerKeyBinding({
    key: "/",
    ctrlKey: true,
    description: "Slash Commands",
    category: "editing",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, {
        content: [
          ...(Array.isArray(block.content) ? block.content : []),
          { type: "text", text: "/", styles: {} },
        ],
      } as any);
    },
    priority: 90,
  });

  registerKeyBinding({
    key: "Enter",
    description: "New block",
    category: "editing",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.insertBlocks(
        [{ id: `new-${Date.now()}`, type: "paragraph", props: {}, content: [] }],
        block,
        "after"
      );
    },
    priority: 85,
  });

  registerKeyBinding({
    key: "Backspace",
    description: "Delete block if empty",
    category: "editing",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      if (Array.isArray(block.content) && block.content.length === 0 && block.type !== "paragraph") {
        editor.updateBlock(block, { type: "paragraph" });
      }
    },
    priority: 80,
  });

  // ── Alignment ─────────────────────────────────────────────────────────
  registerKeyBinding({
    key: "l",
    ctrlKey: true,
    shiftKey: true,
    description: "Align Left",
    category: "formatting",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { props: { textAlignment: "left" } as any });
    },
    priority: 80,
  });

  registerKeyBinding({
    key: "e",
    ctrlKey: true,
    shiftKey: true,
    description: "Align Center",
    category: "formatting",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { props: { textAlignment: "center" } as any });
    },
    priority: 80,
  });

  registerKeyBinding({
    key: "r",
    ctrlKey: true,
    shiftKey: true,
    description: "Align Right",
    category: "formatting",
    command: (editor) => {
      const block = editor.getTextCursorPosition().block;
      editor.updateBlock(block, { props: { textAlignment: "right" } as any });
    },
    priority: 80,
  });
}

// ─── Export Utilities ────────────────────────────────────────────────────────

export function getKeyBindingHelpText(): string {
  const bindings = getAllKeyBindings();
  const lines: string[] = [];

  const categories: KeyBindingCategory[] = [
    "formatting", "block", "list", "table", "navigation", "editing", "custom",
  ];

  const categoryLabels: Record<KeyBindingCategory, string> = {
    formatting: "Formatting",
    block: "Block",
    list: "List",
    table: "Table",
    navigation: "Navigation",
    editing: "Editing",
    custom: "Custom",
  };

  for (const category of categories) {
    const categoryBindings = bindings.filter((b) => b.category === category);
    if (categoryBindings.length === 0) continue;

    lines.push(`\n${categoryLabels[category]}:`);
    for (const binding of categoryBindings) {
      const combo = formatKeyCombo(binding);
      lines.push(`  ${combo.padEnd(20)} ${binding.description}`);
    }
  }

  return lines.join("\n");
}

export function exportKeyBindings(): Record<string, string> {
  const bindings = getAllKeyBindings();
  const exported: Record<string, string> = {};

  for (const binding of bindings) {
    const combo = formatKeyCombo(binding);
    exported[combo] = binding.description;
  }

  return exported;
}
