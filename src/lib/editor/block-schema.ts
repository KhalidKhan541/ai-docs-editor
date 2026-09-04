import {
  BlockNoteSchema,
  defaultBlockSpecs,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  InlineContentSchema,
  StyleSchema,
  BlockNoteEditor,
} from "@blocknote/core";
import type { Block, BlockSpec, PropSchema, Props } from "@blocknote/core";

// ─── Inline Content Types ────────────────────────────────────────────────────

export type MentionInlineContent = {
  type: "mention";
  props: {
    userId: string;
    userName: string;
    userAvatar?: string;
  };
};

export type DateInlineContent = {
  type: "date";
  props: {
    date: string;
    format?: "short" | "long" | "relative";
  };
};

export type ReferenceInlineContent = {
  type: "reference";
  props: {
    docId: string;
    docTitle: string;
    docType?: "document" | "page" | "note";
  };
};

// ─── Block Prop Schemas ──────────────────────────────────────────────────────

const headingPropsSchema = {
  level: {
    default: "1" as const,
    values: ["1", "2", "3", "4", "5", "6"] as const,
  },
} as const;

const calloutPropsSchema = {
  type: {
    default: "info" as const,
    values: ["info", "warning", "error", "success", "note"] as const,
  },
  emoji: {
    default: "💡" as string,
  },
} as const;

const codeBlockPropsSchema = {
  language: {
    default: "typescript" as string,
    values: [
      "typescript", "javascript", "tsx", "jsx", "python", "java", "c", "cpp",
      "csharp", "go", "rust", "ruby", "php", "swift", "kotlin", "scala",
      "html", "css", "scss", "sql", "json", "yaml", "toml", "bash",
      "shell", "powershell", "dockerfile", "markdown", "plaintext",
      "graphql", "protobuf", "r", "matlab", "haskell", "elixir", "lua",
    ] as const,
  },
  theme: {
    default: "dark" as const,
    values: ["dark", "light"] as const,
  },
  showLineNumbers: {
    default: false,
  },
  readOnly: {
    default: false,
  },
} as const;

const imagePropsSchema = {
  url: { default: "" as string },
  caption: { default: "" as string },
  previewWidth: { default: "100%" as string },
  previewHeight: { default: "auto" as string },
  alt: { default: "" as string },
  alignment: {
    default: "left" as const,
    values: ["left", "center", "right"] as const,
  },
} as const;

const videoPropsSchema = {
  url: { default: "" as string },
  caption: { default: "" as string },
  showControls: { default: true },
  autoPlay: { default: false },
  loop: { default: false },
  muted: { default: false },
  poster: { default: "" as string },
} as const;

const audioPropsSchema = {
  url: { default: "" as string },
  caption: { default: "" as string },
  showControls: { default: true },
  autoPlay: { default: false },
  loop: { default: false },
} as const;

const filePropsSchema = {
  url: { default: "" as string },
  name: { default: "" as string },
  mimeType: { default: "" as string },
  size: { default: 0 as number },
} as const;

const embedPropsSchema = {
  url: { default: "" as string },
  caption: { default: "" as string },
  height: { default: "400" as string },
  width: { default: "100%" as string },
} as const;

const iframePropsSchema = {
  url: { default: "" as string },
  height: { default: "400" as string },
  width: { default: "100%" as string },
  sandbox: { default: "allow-scripts allow-same-origin" as string },
} as const;

const tablePropsSchema = {
  headerRow: { default: true },
  headerColumn: { default: false },
  striped: { default: false },
  bordered: { default: true },
  columnWidths: { default: "" as string },
} as const;

const columnsPropsSchema = {
  layout: {
    default: "1-1" as const,
    values: ["1-1", "1-2", "2-1", "1-1-1", "2-1-1", "1-2-1", "1-1-2"] as const,
  },
  gap: { default: "16" as string },
} as const;

const mathPropsSchema = {
  latex: { default: "" as string },
  displayMode: { default: true },
} as const;

const diagramPropsSchema = {
  code: { default: "" as string },
  diagramType: {
    default: "flowchart" as const,
    values: ["flowchart", "sequence", "class", "state", "gantt", "pie", "gitGraph"] as const,
  },
  theme: {
    default: "default" as const,
    values: ["default", "dark", "forest", "neutral"] as const,
  },
} as const;

const bookmarkPropsSchema = {
  url: { default: "" as string },
  title: { default: "" as string },
  description: { default: "" as string },
  icon: { default: "" as string },
  image: { default: "" as string },
} as const;

const todoPropsSchema = {
  checked: { default: false },
} as const;

const togglePropsSchema = {
  open: { default: true },
} as const;

const syncedBlockPropsSchema = {
  syncSourceId: { default: "" as string },
  syncSourceTitle: { default: "" as string },
} as const;

const templateVariablePropsSchema = {
  variableName: { default: "" as string },
  variableType: {
    default: "text" as const,
    values: ["text", "number", "date", "select", "multiSelect"] as const,
  },
  defaultValue: { default: "" as string },
  options: { default: "" as string },
  required: { default: false },
} as const;

const tocPropsSchema = {
  depth: {
    default: "3" as const,
    values: ["1", "2", "3", "4", "5", "6"] as const,
  },
  startLevel: {
    default: "1" as const,
    values: ["1", "2", "3", "4", "5", "6"] as const,
  },
  numbered: { default: false },
} as const;

// ─── Block Schema Registration ───────────────────────────────────────────────

export const customBlockSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    paragraph: defaultBlockSpecs.paragraph,
    heading: defaultBlockSpecs.heading,
    bulletListItem: defaultBlockSpecs.bulletListItem,
    numberedListItem: defaultBlockSpecs.numberedListItem,
    checkListItem: defaultBlockSpecs.checkListItem,
    image: defaultBlockSpecs.image,
    table: defaultBlockSpecs.table,
    codeBlock: defaultBlockSpecs.codeBlock,
    divider: defaultBlockSpecs.divider,
    callout: defaultBlockSpecs.callout,
    todo: { propSchema: todoPropsSchema, content: "inline" as const },
    toggle: { propSchema: togglePropsSchema, content: "inline" as const },
    video: { propSchema: videoPropsSchema, content: "none" as const },
    audio: { propSchema: audioPropsSchema, content: "none" as const },
    file: { propSchema: filePropsSchema, content: "none" as const },
    embed: { propSchema: embedPropsSchema, content: "none" as const },
    iframe: { propSchema: iframePropsSchema, content: "none" as const },
    columns: { propSchema: columnsPropsSchema, content: "table" as const },
    math: { propSchema: mathPropsSchema, content: "none" as const },
    diagram: { propSchema: diagramPropsSchema, content: "none" as const },
    bookmark: { propSchema: bookmarkPropsSchema, content: "none" as const },
    tableOfContents: { propSchema: tocPropsSchema, content: "none" as const },
    syncedBlock: { propSchema: syncedBlockPropsSchema, content: "table" as const },
    templateVariable: { propSchema: templateVariablePropsSchema, content: "none" as const },
  } as any,
});

export type CustomBlockSchema = typeof customBlockSchema.blockSchema;
export type CustomInlineContentSchema = typeof customBlockSchema.inlineContentSchema;
export type CustomStyleSchema = typeof customBlockSchema.styleSchema;
export type CustomBlock = Block<CustomBlockSchema, CustomInlineContentSchema, CustomStyleSchema>;
export type CustomBlockProps<T extends keyof CustomBlockSchema> = Props<
  CustomBlockSchema[T]["propSchema"],
  CustomBlockSchema
>;

// ─── Block Type Guards ───────────────────────────────────────────────────────

export function isHeadingBlock(block: CustomBlock): block is CustomBlock & { type: "heading" } {
  return block.type === "heading";
}

export function isCalloutBlock(block: CustomBlock): block is CustomBlock & { type: "callout" } {
  return block.type === "callout";
}

export function isCodeBlock(block: CustomBlock): block is CustomBlock & { type: "codeBlock" } {
  return block.type === "codeBlock";
}

export function isImageBlock(block: CustomBlock): block is CustomBlock & { type: "image" } {
  return block.type === "image";
}

export function isVideoBlock(block: CustomBlock): block is CustomBlock & { type: "video" } {
  return block.type === "video";
}

export function isAudioBlock(block: CustomBlock): block is CustomBlock & { type: "audio" } {
  return block.type === "audio";
}

export function isFileBlock(block: CustomBlock): block is CustomBlock & { type: "file" } {
  return block.type === "file";
}

export function isEmbedBlock(block: CustomBlock): block is CustomBlock & { type: "embed" } {
  return block.type === "embed";
}

export function isIframeBlock(block: CustomBlock): block is CustomBlock & { type: "iframe" } {
  return block.type === "iframe";
}

export function isTableBlock(block: CustomBlock): block is CustomBlock & { type: "table" } {
  return block.type === "table";
}

export function isColumnsBlock(block: CustomBlock): block is CustomBlock & { type: "columns" } {
  return block.type === "columns";
}

export function isMathBlock(block: CustomBlock): block is CustomBlock & { type: "math" } {
  return block.type === "math";
}

export function isDiagramBlock(block: CustomBlock): block is CustomBlock & { type: "diagram" } {
  return block.type === "diagram";
}

export function isBookmarkBlock(block: CustomBlock): block is CustomBlock & { type: "bookmark" } {
  return block.type === "bookmark";
}

export function isTodoBlock(block: CustomBlock): block is CustomBlock & { type: "todo" } {
  return block.type === "todo";
}

export function isToggleBlock(block: CustomBlock): block is CustomBlock & { type: "toggle" } {
  return block.type === "toggle";
}

export function isSyncedBlock(block: CustomBlock): block is CustomBlock & { type: "syncedBlock" } {
  return block.type === "syncedBlock";
}

export function isTemplateVariableBlock(block: CustomBlock): block is CustomBlock & { type: "templateVariable" } {
  return block.type === "templateVariable";
}

export function isTableOfContentsBlock(block: CustomBlock): block is CustomBlock & { type: "tableOfContents" } {
  return block.type === "tableOfContents";
}

// ─── Block Metadata ──────────────────────────────────────────────────────────

export interface BlockMetadata {
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string;
  tags: string[];
  isStarred: boolean;
  isLocked: boolean;
  comments: BlockComment[];
}

export interface BlockComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  resolved: boolean;
  replies: BlockCommentReply[];
}

export interface BlockCommentReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

// ─── Block Validation ────────────────────────────────────────────────────────

export interface BlockValidationRule {
  type: "required" | "max-length" | "min-length" | "pattern" | "custom";
  value?: number | string | ((block: CustomBlock) => boolean);
  message: string;
}

export const blockValidationRules: Record<string, BlockValidationRule[]> = {
  heading: [
    { type: "max-length", value: 200, message: "Heading cannot exceed 200 characters" },
  ],
  callout: [
    {
      type: "custom",
      value: (block) => {
        const content = block.content as any[];
        return content.length > 0;
      },
      message: "Callout must have content",
    },
  ],
  image: [
    {
      type: "custom",
      value: (block) => {
        const props = block.props as any;
        return props.url && props.url.length > 0;
      },
      message: "Image must have a URL",
    },
  ],
  video: [
    {
      type: "custom",
      value: (block) => {
        const props = block.props as any;
        return props.url && props.url.length > 0;
      },
      message: "Video must have a URL",
    },
  ],
  math: [
    {
      type: "custom",
      value: (block) => {
        const props = block.props as any;
        return props.latex && props.latex.length > 0;
      },
      message: "Math block must have LaTeX content",
    },
  ],
  diagram: [
    {
      type: "custom",
      value: (block) => {
        const props = block.props as any;
        return props.code && props.code.length > 0;
      },
      message: "Diagram must have code",
    },
  ],
  bookmark: [
    {
      type: "custom",
      value: (block) => {
        const props = block.props as any;
        try {
          new URL(props.url);
          return true;
        } catch {
          return false;
        }
      },
      message: "Bookmark must have a valid URL",
    },
  ],
  templateVariable: [
    {
      type: "custom",
      value: (block) => {
        const props = block.props as any;
        return props.variableName && props.variableName.length > 0;
      },
      message: "Template variable must have a name",
    },
  ],
};

export function validateBlock(block: CustomBlock): string[] {
  const rules = blockValidationRules[block.type];
  if (!rules) return [];

  const errors: string[] = [];
  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        if (!block.content || (Array.isArray(block.content) && block.content.length === 0)) {
          errors.push(rule.message);
        }
        break;
      case "max-length":
        if (Array.isArray(block.content) && block.content.length > (rule.value as number)) {
          errors.push(rule.message);
        }
        break;
      case "min-length":
        if (Array.isArray(block.content) && block.content.length < (rule.value as number)) {
          errors.push(rule.message);
        }
        break;
      case "pattern":
        if (typeof block.content === "string" && !(rule.value as RegExp).test(block.content)) {
          errors.push(rule.message);
        }
        break;
      case "custom":
        if (rule.value && typeof rule.value === "function" && !rule.value(block)) {
          errors.push(rule.message);
        }
        break;
    }
  }
  return errors;
}

// ─── Block Defaults ──────────────────────────────────────────────────────────

export const blockDefaults: Record<string, Partial<any>> = {
  paragraph: { content: [] },
  heading: { props: { level: "1" }, content: [] },
  bulletListItem: { content: [] },
  numberedListItem: { content: [] },
  checkListItem: { props: { checked: false }, content: [] },
  todo: { props: { checked: false }, content: [] },
  toggle: { props: { open: true }, content: [] },
  callout: { props: { type: "info", emoji: "💡" }, content: [] },
  image: { props: { url: "", caption: "", alt: "", alignment: "center" } },
  video: { props: { url: "", caption: "", showControls: true } },
  audio: { props: { url: "", caption: "", showControls: true } },
  file: { props: { url: "", name: "", mimeType: "", size: 0 } },
  embed: { props: { url: "", caption: "", height: "400", width: "100%" } },
  iframe: { props: { url: "", height: "400", width: "100%" } },
  codeBlock: { props: { language: "typescript", theme: "dark", showLineNumbers: false }, content: [] },
  table: { props: { headerRow: true, striped: false, bordered: true } },
  divider: {},
  columns: { props: { layout: "1-1", gap: "16" } },
  math: { props: { latex: "", displayMode: true } },
  diagram: { props: { code: "", diagramType: "flowchart", theme: "default" } },
  bookmark: { props: { url: "", title: "", description: "" } },
  tableOfContents: { props: { depth: "3", startLevel: "1", numbered: false } },
  syncedBlock: { props: { syncSourceId: "", syncSourceTitle: "" } },
  templateVariable: { props: { variableName: "", variableType: "text", defaultValue: "", required: false } },
};

// ─── Block Category Map ──────────────────────────────────────────────────────

export type BlockCategory =
  | "basic"
  | "media"
  | "advanced"
  | "layout"
  | "interactive"
  | "document";

export const blockCategoryMap: Record<string, BlockCategory> = {
  paragraph: "basic",
  heading: "basic",
  bulletListItem: "basic",
  numberedListItem: "basic",
  checkListItem: "basic",
  todo: "interactive",
  toggle: "interactive",
  callout: "basic",
  quote: "basic",
  image: "media",
  video: "media",
  audio: "media",
  file: "media",
  embed: "media",
  iframe: "media",
  codeBlock: "advanced",
  table: "advanced",
  divider: "basic",
  columns: "layout",
  math: "advanced",
  diagram: "advanced",
  bookmark: "advanced",
  tableOfContents: "document",
  syncedBlock: "advanced",
  templateVariable: "interactive",
};

// ─── Serialization Helpers ───────────────────────────────────────────────────

export function serializeBlockProps(props: Record<string, any>): string {
  try {
    return JSON.stringify(props);
  } catch {
    return "{}";
  }
}

export function deserializeBlockProps<T = Record<string, any>>(serialized: string): T {
  try {
    return JSON.parse(serialized) as T;
  } catch {
    return {} as T;
  }
}

export function cloneBlock(block: CustomBlock): CustomBlock {
  return {
    ...block,
    id: `${block.id}-copy-${Date.now()}`,
    props: { ...block.props },
    content: Array.isArray(block.content)
      ? block.content.map((item) => ({ ...item }))
      : block.content,
    children: block.children.map(cloneBlock),
  } as CustomBlock;
}

export function flattenBlocks(blocks: CustomBlock[]): CustomBlock[] {
  const result: CustomBlock[] = [];
  function walk(blockList: CustomBlock[]) {
    for (const block of blockList) {
      result.push(block);
      if (block.children.length > 0) {
        walk(block.children);
      }
    }
  }
  walk(blocks);
  return result;
}

export function blocksToTree(blocks: CustomBlock[]): CustomBlock[] {
  if (blocks.length === 0) return [];
  const blockMap = new Map<string, CustomBlock>();
  const rootBlocks: CustomBlock[] = [];

  for (const block of blocks) {
    blockMap.set(block.id, { ...block, children: [] });
  }
  for (const block of blocks) {
    const node = blockMap.get(block.id)!;
    if (node.children.length === 0) {
      rootBlocks.push(node);
    }
  }
  return rootBlocks;
}
