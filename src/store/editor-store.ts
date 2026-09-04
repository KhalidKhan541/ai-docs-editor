import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Block, InlineStyle } from "@/types";

interface SelectionRange {
  blockId: string;
  anchorOffset: number;
  focusOffset: number;
  anchorBlockId: string;
  focusBlockId: string;
}

interface FormattingState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  highlight: boolean;
  link: string | null;
  heading: 1 | 2 | 3 | 4 | 5 | 6 | null;
  textAlign: "left" | "center" | "right" | "justify";
  listType: "bullet" | "numbered" | "todo" | null;
}

interface DragState {
  isDragging: boolean;
  draggedBlockId: string | null;
  dropTargetId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

interface EditorState {
  documentId: string | null;
  blocks: Block[];
  selectedBlockIds: string[];
  selection: SelectionRange | null;
  formatting: FormattingState;
  drag: DragState;
  undoStack: Block[][];
  redoStack: Block[][];
  isEditing: boolean;
  isReadOnly: boolean;
  focusedBlockId: string | null;
  slashMenuOpen: boolean;
  slashMenuPosition: { x: number; y: number } | null;

  setDocumentId: (id: string | null) => void;
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block, afterId?: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, toIndex: number) => void;
  duplicateBlock: (id: string) => void;
  selectBlock: (id: string, multi?: boolean) => void;
  selectAllBlocks: () => void;
  clearSelection: () => void;
  setSelection: (range: SelectionRange | null) => void;
  updateFormatting: (formatting: Partial<FormattingState>) => void;
  toggleFormatting: (key: keyof FormattingState) => void;
  applyFormattingToSelection: (styles: InlineStyle) => void;
  setDragState: (state: Partial<DragState>) => void;
  undo: () => void;
  redo: () => void;
  setEditing: (editing: boolean) => void;
  setReadOnly: (readOnly: boolean) => void;
  setFocusedBlock: (id: string | null) => void;
  setSlashMenu: (open: boolean, position?: { x: number; y: number } | null) => void;
}

function pushUndoStack(blocks: Block[], stack: Block[][]): Block[][] {
  const newStack = [...stack, blocks.map((b) => ({ ...b }))];
  if (newStack.length > 100) newStack.shift();
  return newStack;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    documentId: null,
    blocks: [],
    selectedBlockIds: [],
    selection: null,
    formatting: {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      code: false,
      highlight: false,
      link: null,
      heading: null,
      textAlign: "left",
      listType: null,
    },
    drag: {
      isDragging: false,
      draggedBlockId: null,
      dropTargetId: null,
      dropPosition: null,
    },
    undoStack: [],
    redoStack: [],
    isEditing: true,
    isReadOnly: false,
    focusedBlockId: null,
    slashMenuOpen: false,
    slashMenuPosition: null,

    setDocumentId: (id) =>
      set((state) => {
        state.documentId = id;
        state.undoStack = [];
        state.redoStack = [];
      }),

    setBlocks: (blocks) =>
      set((state) => {
        state.blocks = blocks.map((b) => ({ ...b }));
      }),

    addBlock: (block, afterId) =>
      set((state) => {
        state.undoStack = pushUndoStack(state.blocks, state.undoStack);
        state.redoStack = [];

        if (afterId) {
          const index = state.blocks.findIndex((b) => b.id === afterId);
          if (index !== -1) {
            state.blocks.splice(index + 1, 0, block);
          } else {
            state.blocks.push(block);
          }
        } else {
          state.blocks.push(block);
        }
      }),

    updateBlock: (id, updates) =>
      set((state) => {
        const block = state.blocks.find((b) => b.id === id);
        if (block) {
          Object.assign(block, updates);
          block.updatedAt = new Date().toISOString();
        }
      }),

    deleteBlock: (id) =>
      set((state) => {
        state.undoStack = pushUndoStack(state.blocks, state.undoStack);
        state.redoStack = [];

        state.blocks = state.blocks.filter((b) => b.id !== id);
        state.selectedBlockIds = state.selectedBlockIds.filter(
          (sid) => sid !== id
        );

        if (state.blocks.length === 0) {
          state.blocks.push({
            id: `block_${Date.now()}`,
            type: "paragraph",
            content: [],
            props: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "current-user",
          });
        }
      }),

    moveBlock: (id, toIndex) =>
      set((state) => {
        state.undoStack = pushUndoStack(state.blocks, state.undoStack);
        state.redoStack = [];

        const fromIndex = state.blocks.findIndex((b) => b.id === id);
        if (fromIndex === -1) return;

        const [block] = state.blocks.splice(fromIndex, 1);
        if (block) {
          state.blocks.splice(toIndex, 0, block);
        }
      }),

    duplicateBlock: (id) =>
      set((state) => {
        const block = state.blocks.find((b) => b.id === id);
        if (!block) return;

        state.undoStack = pushUndoStack(state.blocks, state.undoStack);
        state.redoStack = [];

        const newBlock: Block = {
          ...block,
          id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          content: block.content.map((seg) => ({ ...seg })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const index = state.blocks.findIndex((b) => b.id === id);
        state.blocks.splice(index + 1, 0, newBlock);
      }),

    selectBlock: (id, multi = false) =>
      set((state) => {
        if (multi) {
          const idx = state.selectedBlockIds.indexOf(id);
          if (idx !== -1) {
            state.selectedBlockIds.splice(idx, 1);
          } else {
            state.selectedBlockIds.push(id);
          }
        } else {
          state.selectedBlockIds = [id];
        }
      }),

    selectAllBlocks: () =>
      set((state) => {
        state.selectedBlockIds = state.blocks.map((b) => b.id);
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedBlockIds = [];
        state.selection = null;
      }),

    setSelection: (range) =>
      set((state) => {
        state.selection = range;
      }),

    updateFormatting: (formatting) =>
      set((state) => {
        Object.assign(state.formatting, formatting);
      }),

    toggleFormatting: (key) =>
      set((state) => {
        const current = state.formatting[key];
        if (typeof current === "boolean") {
          (state.formatting as Record<string, unknown>)[key] = !current;
        }
      }),

    applyFormattingToSelection: (styles) =>
      set((state) => {
        const { selection, blocks } = state;
        if (!selection) return;

        const startBlockIdx = blocks.findIndex(
          (b) => b.id === selection.anchorBlockId
        );
        const endBlockIdx = blocks.findIndex(
          (b) => b.id === selection.focusBlockId
        );
        if (startBlockIdx === -1 || endBlockIdx === -1) return;

        const minIdx = Math.min(startBlockIdx, endBlockIdx);
        const maxIdx = Math.max(startBlockIdx, endBlockIdx);

        for (let i = minIdx; i <= maxIdx; i++) {
          const block = state.blocks[i];
          if (!block) continue;

          block.content = block.content.map((seg) => ({
            ...seg,
            styles: { ...seg.styles, ...styles },
          }));
        }
      }),

    setDragState: (dragState) =>
      set((state) => {
        Object.assign(state.drag, dragState);
      }),

    undo: () =>
      set((state) => {
        if (state.undoStack.length === 0) return;

        state.redoStack = pushUndoStack(state.blocks, state.redoStack);
        const prevBlocks = state.undoStack.pop();
        if (prevBlocks) {
          state.blocks = prevBlocks;
        }
      }),

    redo: () =>
      set((state) => {
        if (state.redoStack.length === 0) return;

        state.undoStack = pushUndoStack(state.blocks, state.undoStack);
        const nextBlocks = state.redoStack.pop();
        if (nextBlocks) {
          state.blocks = nextBlocks;
        }
      }),

    setEditing: (isEditing) =>
      set((state) => {
        state.isEditing = isEditing;
      }),

    setReadOnly: (isReadOnly) =>
      set((state) => {
        state.isReadOnly = isReadOnly;
      }),

    setFocusedBlock: (id) =>
      set((state) => {
        state.focusedBlockId = id;
      }),

    setSlashMenu: (open, position = null) =>
      set((state) => {
        state.slashMenuOpen = open;
        state.slashMenuPosition = position;
      }),
  }))
);
