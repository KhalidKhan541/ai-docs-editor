import type { BlockNoteEditor, Block } from "@blocknote/core";
import { customBlockSchema, type CustomBlock } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BlockOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BlockPosition {
  blockId: string;
  parentId?: string;
  index: number;
}

export interface DragDropResult {
  movedBlockId: string;
  from: BlockPosition;
  to: BlockPosition;
}

export interface MultiBlockSelection {
  blockIds: string[];
  startBlockId: string;
  endBlockId: string;
}

export interface BlockClipboardData {
  blocks: CustomBlock[];
  html: string;
  markdown: string;
  timestamp: number;
  source: "editor" | "external";
}

export interface BlockHistoryEntry {
  blockId: string;
  timestamp: number;
  action: "create" | "update" | "delete" | "move" | "convert";
  previousState?: Partial<CustomBlock>;
  newState?: Partial<CustomBlock>;
  userId: string;
}

// ─── Block CRUD Operations ───────────────────────────────────────────────────

export function createBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  type: string,
  props?: Record<string, any>,
  content?: any[],
  afterBlockId?: string
): BlockOperationResult<CustomBlock> {
  try {
    const resolvedProps = { ...getDefaultProps(type), ...props };
    const targetBlock = afterBlockId ? editor.getBlock(afterBlockId) : editor.topLevelBlocks[0];
    const block = editor.insertBlocks(
      [{ id: generateBlockId(), type, props: resolvedProps, content: content || [] }],
      targetBlock
    )[0];

    if (!block) {
      return { success: false, error: "Failed to insert block" };
    }
    return { success: true, data: block as CustomBlock };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error creating block" };
  }
}

export function readBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<CustomBlock> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: `Block ${blockId} not found` };
    return { success: true, data: block as CustomBlock };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error reading block" };
  }
}

export function updateBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string,
  updates: Partial<CustomBlock>
): BlockOperationResult<CustomBlock> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: `Block ${blockId} not found` };
    editor.updateBlock(block, updates as any);
    const updated = editor.getBlock(blockId);
    if (!updated) return { success: false, error: "Failed to retrieve updated block" };
    return { success: true, data: updated as CustomBlock };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error updating block" };
  }
}

export function deleteBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<void> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: `Block ${blockId} not found` };
    editor.removeBlocks([blockId]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error deleting block" };
  }
}

// ─── Block Movement ──────────────────────────────────────────────────────────

export function moveBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string,
  targetIndex: number,
  targetParentId?: string
): BlockOperationResult<DragDropResult> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: `Block ${blockId} not found` };

    const fromPosition = findBlockPosition(editor, blockId);
    const targetParent = targetParentId ? editor.getBlock(targetParentId) : undefined;
    editor.moveBlocks([block], targetParent || undefined, targetIndex);

    return {
      success: true,
      data: { movedBlockId: blockId, from: fromPosition, to: { blockId, parentId: targetParentId, index: targetIndex } },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error moving block" };
  }
}

export function moveBlockUp(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<void> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: "Block not found" };
    const parentBlocks = editor.topLevelBlocks;
    const currentIndex = parentBlocks.findIndex((b) => b.id === blockId);
    if (currentIndex <= 0) return { success: false, error: "Block is already at the top" };
    return moveBlock(editor, blockId, currentIndex - 1);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function moveBlockDown(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<void> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: "Block not found" };
    const parentBlocks = editor.topLevelBlocks;
    const currentIndex = parentBlocks.findIndex((b) => b.id === blockId);
    if (currentIndex >= parentBlocks.length - 1) return { success: false, error: "Block is already at the bottom" };
    return moveBlock(editor, blockId, currentIndex + 1);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── Duplicate ───────────────────────────────────────────────────────────────

export function duplicateBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<CustomBlock> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: `Block ${blockId} not found` };

    const cloned: CustomBlock = {
      ...block,
      id: generateBlockId(),
      props: { ...block.props },
      content: Array.isArray(block.content) ? block.content.map((item: any) => ({ ...item })) : block.content,
      children: [],
    } as CustomBlock;

    const inserted = editor.insertBlocks([cloned], block, "after")[0];
    if (!inserted) return { success: false, error: "Failed to insert duplicated block" };
    return { success: true, data: inserted as CustomBlock };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error duplicating block" };
  }
}

export function duplicateBlocks(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockIds: string[]
): BlockOperationResult<CustomBlock[]> {
  try {
    const blocks: CustomBlock[] = [];
    for (const id of blockIds) {
      const result = duplicateBlock(editor, id);
      if (result.success && result.data) blocks.push(result.data);
    }
    return { success: true, data: blocks };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── Nesting (Indentation) ──────────────────────────────────────────────────

export function nestBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<void> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: "Block not found" };
    const parentBlocks = editor.topLevelBlocks;
    const blockIndex = parentBlocks.findIndex((b) => b.id === blockId);
    if (blockIndex <= 0) return { success: false, error: "Cannot nest block: no previous sibling" };
    const previousSibling = parentBlocks[blockIndex - 1];
    if (!previousSibling) return { success: false, error: "No previous block to nest under" };

    const nestableTypes = ["paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "todo", "toggle", "callout"];
    if (!nestableTypes.includes(previousSibling.type)) return { success: false, error: `Cannot nest under ${previousSibling.type} block` };

    editor.moveBlocks([block], previousSibling);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error nesting block" };
  }
}

export function unnestBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<void> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: "Block not found" };
    if (!block.parentId) return { success: false, error: "Block is already at the top level" };
    const parent = editor.getBlock(block.parentId);
    if (!parent) return { success: false, error: "Parent block not found" };
    const parentIndex = editor.topLevelBlocks.findIndex((b) => b.id === parent.id);
    editor.moveBlocks([block], undefined, parentIndex + 1);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error unnesting block" };
  }
}

// ─── Block Type Conversion ───────────────────────────────────────────────────

export function convertBlockType(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string,
  newType: string
): BlockOperationResult<CustomBlock> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: `Block ${blockId} not found` };
    if (block.type === newType) return { success: true, data: block as CustomBlock };

    const validConversions: Record<string, string[]> = {
      paragraph: ["heading", "bulletListItem", "numberedListItem", "checkListItem", "todo", "callout", "toggle", "quote"],
      heading: ["paragraph", "bulletListItem", "numberedListItem"],
      bulletListItem: ["paragraph", "numberedListItem", "checkListItem", "todo"],
      numberedListItem: ["paragraph", "bulletListItem", "checkListItem", "todo"],
      checkListItem: ["paragraph", "bulletListItem", "numberedListItem", "todo"],
      todo: ["paragraph", "bulletListItem", "numberedListItem", "checkListItem"],
      callout: ["paragraph", "quote"],
      quote: ["paragraph", "callout"],
      toggle: ["paragraph", "bulletListItem"],
    };

    const allowed = validConversions[block.type];
    if (allowed && !allowed.includes(newType)) {
      return { success: false, error: `Cannot convert from ${block.type} to ${newType}` };
    }

    const defaultProps = getDefaultProps(newType);
    editor.updateBlock(block, { type: newType, props: defaultProps } as any);
    const updated = editor.getBlock(blockId);
    if (!updated) return { success: false, error: "Failed to retrieve converted block" };
    return { success: true, data: updated as CustomBlock };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error converting block" };
  }
}

// ─── Split / Merge ──────────────────────────────────────────────────────────

export function splitBlock(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string,
  atContentIndex?: number
): BlockOperationResult<{ topBlock: CustomBlock; bottomBlock: CustomBlock }> {
  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: "Block not found" };

    if (!Array.isArray(block.content) || block.content.length === 0) {
      const newBlock = createBlock(editor, block.type, block.props as any, [], blockId);
      if (!newBlock.success) return { success: false, error: "Failed to create split block" };
      return { success: true, data: { topBlock: block as CustomBlock, bottomBlock: newBlock.data! } };
    }

    const splitIndex = atContentIndex ?? Math.ceil(block.content.length / 2);
    const topContent = block.content.slice(0, splitIndex);
    const bottomContent = block.content.slice(splitIndex);

    editor.updateBlock(block, { content: topContent } as any);
    const newBlock = createBlock(editor, block.type, block.props as any, bottomContent, blockId);
    if (!newBlock.success) return { success: false, error: "Failed to create bottom block" };

    return { success: true, data: { topBlock: block as CustomBlock, bottomBlock: newBlock.data! } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error splitting block" };
  }
}

export function mergeBlocks(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId1: string,
  blockId2: string
): BlockOperationResult<CustomBlock> {
  try {
    const block1 = editor.getBlock(blockId1);
    const block2 = editor.getBlock(blockId2);
    if (!block1) return { success: false, error: `Block ${blockId1} not found` };
    if (!block2) return { success: false, error: `Block ${blockId2} not found` };
    if (block1.type !== block2.type) return { success: false, error: "Cannot merge blocks of different types" };
    if (!Array.isArray(block1.content) || !Array.isArray(block2.content)) return { success: false, error: "Cannot merge non-content blocks" };

    const mergedContent = [...block1.content, ...block2.content];
    editor.updateBlock(block1, { content: mergedContent } as any);
    editor.removeBlocks([blockId2]);
    const updated = editor.getBlock(blockId1);
    return { success: true, data: (updated || block1) as CustomBlock };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error merging blocks" };
  }
}

// ─── Multi-Block Selection ──────────────────────────────────────────────────

export function getMultiBlockSelection(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  startBlockId: string,
  endBlockId: string
): MultiBlockSelection {
  const blocks = editor.topLevelBlocks;
  const startIdx = blocks.findIndex((b) => b.id === startBlockId);
  const endIdx = blocks.findIndex((b) => b.id === endBlockId);
  if (startIdx === -1 || endIdx === -1) return { blockIds: [], startBlockId, endBlockId };
  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  return { blockIds: blocks.slice(from, to + 1).map((b) => b.id), startBlockId, endBlockId };
}

export function deleteMultiBlocks(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockIds: string[]
): BlockOperationResult<void> {
  try {
    const existingIds = blockIds.filter((id) => editor.getBlock(id));
    if (existingIds.length === 0) return { success: false, error: "No valid blocks to delete" };
    editor.removeBlocks(existingIds);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function moveMultiBlocks(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockIds: string[],
  targetIndex: number,
  targetParentId?: string
): BlockOperationResult<void> {
  try {
    const blocks = blockIds
      .map((id) => editor.getBlock(id))
      .filter((b): b is Block<typeof customBlockSchema.blockSchema> => b !== undefined);
    if (blocks.length === 0) return { success: false, error: "No valid blocks to move" };
    const targetParent = targetParentId ? editor.getBlock(targetParentId) : undefined;
    editor.moveBlocks(blocks, targetParent || undefined, targetIndex);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── Copy / Paste ────────────────────────────────────────────────────────────

export function copyBlocks(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockIds: string[]
): BlockClipboardData {
  const blocks = blockIds
    .map((id) => editor.getBlock(id))
    .filter((b): b is Block<typeof customBlockSchema.blockSchema> => b !== undefined);

  return {
    blocks: blocks.map((b) => ({
      ...b,
      props: { ...b.props },
      content: Array.isArray(b.content) ? b.content.map((c: any) => ({ ...c })) : b.content,
      children: [],
    })) as CustomBlock[],
    html: blocksToHtml(blocks),
    markdown: blocksToMarkdown(blocks),
    timestamp: Date.now(),
    source: "editor",
  };
}

export function pasteBlocks(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  data: BlockClipboardData,
  targetBlockId?: string
): BlockOperationResult<CustomBlock[]> {
  try {
    const targetBlock = targetBlockId ? editor.getBlock(targetBlockId) : undefined;
    const insertedBlocks = editor.insertBlocks(
      data.blocks.map((b) => ({
        id: generateBlockId(),
        type: b.type,
        props: b.props,
        content: b.content,
      })) as any,
      targetBlock,
      "after"
    );
    return { success: true, data: insertedBlocks as CustomBlock[] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error pasting blocks" };
  }
}

// ─── Block History ───────────────────────────────────────────────────────────

const blockHistory: Map<string, BlockHistoryEntry[]> = new Map();
const MAX_HISTORY_PER_BLOCK = 100;

export function recordBlockHistory(entry: BlockHistoryEntry): void {
  const entries = blockHistory.get(entry.blockId) || [];
  entries.push(entry);
  if (entries.length > MAX_HISTORY_PER_BLOCK) entries.shift();
  blockHistory.set(entry.blockId, entries);
}

export function getBlockHistory(blockId: string, limit?: number): BlockHistoryEntry[] {
  const entries = blockHistory.get(blockId) || [];
  return limit ? entries.slice(-limit) : entries;
}

export function clearBlockHistory(blockId: string): void {
  blockHistory.delete(blockId);
}

export function undoBlockHistory(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockOperationResult<void> {
  const entries = blockHistory.get(blockId);
  if (!entries || entries.length === 0) return { success: false, error: "No history to undo" };
  const lastEntry = entries[entries.length - 1];
  if (!lastEntry.previousState) return { success: false, error: "No previous state available" };

  try {
    const block = editor.getBlock(blockId);
    if (!block) return { success: false, error: "Block not found" };
    editor.updateBlock(block, lastEntry.previousState as any);
    entries.pop();
    blockHistory.set(blockId, entries);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function generateBlockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultProps(type: string): Record<string, any> {
  const defaults: Record<string, any> = {
    paragraph: {},
    heading: { level: "1" },
    bulletListItem: {},
    numberedListItem: {},
    checkListItem: { checked: false },
    todo: { checked: false },
    toggle: { open: true },
    callout: { type: "info", emoji: "💡" },
    image: { url: "", caption: "", alt: "", alignment: "center" },
    video: { url: "", caption: "", showControls: true },
    audio: { url: "", caption: "", showControls: true },
    file: { url: "", name: "", mimeType: "", size: 0 },
    embed: { url: "", caption: "", height: "400", width: "100%" },
    iframe: { url: "", height: "400", width: "100%" },
    codeBlock: { language: "typescript", theme: "dark", showLineNumbers: false },
    table: { headerRow: true, striped: false, bordered: true },
    divider: {},
    columns: { layout: "1-1", gap: "16" },
    math: { latex: "", displayMode: true },
    diagram: { code: "", diagramType: "flowchart", theme: "default" },
    bookmark: { url: "", title: "", description: "" },
    tableOfContents: { depth: "3", startLevel: "1", numbered: false },
    syncedBlock: { syncSourceId: "", syncSourceTitle: "" },
    templateVariable: { variableName: "", variableType: "text", defaultValue: "", required: false },
  };
  return defaults[type] || {};
}

function findBlockPosition(
  editor: BlockNoteEditor<typeof customBlockSchema.blockSchema>,
  blockId: string
): BlockPosition {
  const blocks = editor.topLevelBlocks;
  const index = blocks.findIndex((b) => b.id === blockId);
  const block = blocks[index];
  return { blockId, parentId: block?.parentId, index: index >= 0 ? index : 0 };
}

function blocksToHtml(blocks: Block[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    const tag = getHtmlTag(block.type);
    const content = extractTextContent(block.content);
    parts.push(`<${tag}>${content}</${tag}>`);
  }
  return parts.join("\n");
}

function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(blockToMarkdown).join("\n\n");
}

function blockToMarkdown(block: Block): string {
  const content = extractTextContent(block.content);
  switch (block.type) {
    case "heading": {
      const level = parseInt((block.props as any)?.level || "1");
      return `${"#".repeat(level)} ${content}`;
    }
    case "bulletListItem": return `- ${content}`;
    case "numberedListItem": return `1. ${content}`;
    case "checkListItem": return (block.props as any)?.checked ? `- [x] ${content}` : `- [ ] ${content}`;
    case "codeBlock": return `\`\`\`${(block.props as any)?.language || ""}\n${content}\n\`\`\``;
    case "quote": return `> ${content}`;
    case "divider": return "---";
    case "image": return `![${(block.props as any)?.caption || "image"}](${(block.props as any)?.url || ""})`;
    default: return content;
  }
}

function getHtmlTag(type: string): string {
  const tags: Record<string, string> = {
    paragraph: "p", heading: "h1", bulletListItem: "li", numberedListItem: "li",
    checkListItem: "li", quote: "blockquote", codeBlock: "pre", divider: "hr",
  };
  return tags[type] || "p";
}

function extractTextContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (item.type === "text") return item.text || "";
        if (item.type === "link") return item.content?.map((c: any) => c.text || "").join("") || "";
        return "";
      })
      .join("");
  }
  return "";
}
