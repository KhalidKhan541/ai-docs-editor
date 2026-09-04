export type BlockType =
  | "paragraph"
  | "heading"
  | "bulletList"
  | "numberedList"
  | "todoList"
  | "quote"
  | "codeBlock"
  | "image"
  | "table"
  | "divider"
  | "callout"
  | "toggle"
  | "embed"
  | "file";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TextAlign = "left" | "center" | "right" | "justify";

export interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  highlight?: boolean;
  link?: string;
  color?: string;
}

export interface TextSegment {
  text: string;
  styles?: InlineStyle;
}

export interface Block {
  id: string;
  type: BlockType;
  content: TextSegment[];
  props: Record<string, unknown>;
  children?: string[];
  parent?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface HeadingBlock extends Block {
  type: "heading";
  props: {
    level: HeadingLevel;
    textAlign?: TextAlign;
  };
}

export interface CodeBlock extends Block {
  type: "codeBlock";
  props: {
    language: string;
    textAlign?: TextAlign;
  };
}

export interface ImageBlock extends Block {
  type: "image";
  props: {
    src: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
    textAlign?: TextAlign;
  };
}

export interface TodoBlock extends Block {
  type: "todoList";
  props: {
    checked: boolean;
    textAlign?: TextAlign;
  };
}

export interface TableBlock extends Block {
  type: "table";
  props: {
    rows: number;
    cols: number;
    cellContent: string[][];
    columnWidths?: number[];
  };
}

export interface CalloutBlock extends Block {
  type: "callout";
  props: {
    variant: "info" | "warning" | "error" | "success";
    icon?: string;
    textAlign?: TextAlign;
  };
}

export interface EmbedBlock extends Block {
  type: "embed";
  props: {
    url: string;
    provider?: string;
    title?: string;
    caption?: string;
  };
}

export type DocumentStatus = "draft" | "published" | "archived";

export type DocumentVisibility = "private" | "team" | "public";

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  blocks: Block[];
  title: string;
  createdAt: string;
  createdBy: string;
  changeDescription?: string;
  checksum: string;
}

export interface DocumentPermission {
  userId: string;
  role: "owner" | "editor" | "commenter" | "viewer";
  grantedAt: string;
  grantedBy: string;
}

export interface Document {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  blocks: Block[];
  status: DocumentStatus;
  visibility: DocumentVisibility;
  permissions: DocumentPermission[];
  tags: string[];
  coverImage?: string;
  icon?: string;
  folderId?: string;
  version: number;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy: string;
  lastEditedBy: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: Block[];
  previewImage?: string;
  tags: string[];
  usageCount: number;
  isOfficial: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SearchResult {
  documentId: string;
  title: string;
  excerpt: string;
  matchScore: number;
  matchedFields: string[];
  highlightRanges: Array<{
    field: string;
    start: number;
    end: number;
  }>;
}

export interface DocumentListParams {
  folderId?: string;
  status?: DocumentStatus;
  visibility?: DocumentVisibility;
  tags?: string[];
  search?: string;
  sortBy?: "title" | "updatedAt" | "createdAt" | "wordCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
