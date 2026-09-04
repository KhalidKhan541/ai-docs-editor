// ─── Core Enums ──────────────────────────────────────────────────────────────

export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

export enum BlockType {
  PARAGRAPH = "paragraph",
  HEADING = "heading",
  BULLET_LIST = "bulletList",
  NUMBERED_LIST = "numberedList",
  CHECKLIST = "checklist",
  TOGGLE = "toggle",
  QUOTE = "quote",
  CODE_BLOCK = "codeBlock",
  DIVIDER = "divider",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  TABLE = "table",
  CALLOUT = "callout",
  BOOKMARK = "bookmark",
  EQUATION = "equation",
  TABLE_OF_CONTENTS = "tableOfContents",
  COLUMN = "column",
  COLUMN_LIST = "columnList",
  SYNC_BLOCK = "syncBlock",
  MENTION = "mention",
  AI_GENERATED = "aiGenerated",
}

export enum CommentStatus {
  OPEN = "OPEN",
  RESOLVED = "RESOLVED",
  ARCHIVED = "ARCHIVED",
}

export enum SuggestionStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  DISMISSED = "DISMISSED",
}

export enum PermissionLevel {
  OWNER = "OWNER",
  EDITOR = "EDITOR",
  COMMENTER = "COMMENTER",
  VIEWER = "VIEWER",
}

export enum PublishStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  SCHEDULED = "SCHEDULED",
  UNPUBLISHED = "UNPUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum DocumentStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  TRASHED = "TRASHED",
  DELETED = "DELETED",
}

export enum NotificationType {
  COMMENT = "COMMENT",
  MENTION = "MENTION",
  SUGGESTION = "SUGGESTION",
  INVITE = "INVITE",
  SHARE = "SHARE",
  UPDATE = "UPDATE",
  SYSTEM = "SYSTEM",
}

export enum SubscriptionTier {
  FREE = "FREE",
  PRO = "PRO",
  TEAM = "TEAM",
  ENTERPRISE = "ENTERPRISE",
}

export enum FileType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  DOCUMENT = "DOCUMENT",
  OTHER = "OTHER",
}

export enum CollaboratorRole {
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
  COMMENTER = "COMMENTER",
}

// ─── User Types ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  bio: string | null;
  locale: string;
  timezone: string;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
}

export interface UserProfile extends User {
  organizations: OrgMemberWithOrg[];
  _count: {
    ownedDocuments: number;
    comments: number;
    suggestions: number;
  };
}

export interface UpdateUserInput {
  name?: string;
  bio?: string;
  image?: string;
  locale?: string;
  timezone?: string;
}

export interface UserSession {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
  expires: Date;
}

// ─── Organization Types ──────────────────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  plan: SubscriptionTier;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrgMember {
  id: string;
  role: UserRole;
  userId: string;
  organizationId: string;
  joinedAt: Date;
  invitedBy: string | null;
}

export interface OrgMemberWithOrg extends OrgMember {
  organization: Organization;
}

export interface OrgMemberWithUser extends OrgMember {
  user: UserPublic;
}

export interface OrganizationWithMembers extends Organization {
  members: OrgMemberWithUser[];
  _count: {
    members: number;
    documents: number;
  };
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  website?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  website?: string;
  logo?: string;
}

// ─── Document Types ──────────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  content: Record<string, unknown> | null;
  status: DocumentStatus;
  isTemplate: boolean;
  isStarred: boolean;
  isPinned: boolean;
  wordCount: number;
  readTimeMinutes: number;
  coverImage: string | null;
  icon: string | null;
  metadata: Record<string, unknown> | null;
  deletedAt: Date | null;
  lastEditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  creatorId: string;
  organizationId: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  coverImage: string | null;
  wordCount: number;
  readTimeMinutes: number;
  isStarred: boolean;
  isPinned: boolean;
  lastEditedAt: Date;
  createdAt: Date;
  owner: UserPublic;
  tags: DocumentTagWithTag[];
  _count: {
    comments: number;
    blocks: number;
    versions: number;
  };
}

export interface DocumentDetail extends Document {
  owner: UserPublic;
  creator: UserPublic;
  organization: Pick<Organization, "id" | "name" | "slug">;
  permissions: DocumentPermissionWithUser[];
  tags: DocumentTagWithTag[];
  publishes: Publish[];
  _count: {
    blocks: number;
    comments: number;
    versions: number;
    suggestions: number;
  };
}

export interface DocumentWithPermission extends DocumentListItem {
  userPermission: PermissionLevel | null;
  isOwner: boolean;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  organizationId?: string;
  templateId?: string;
  folderId?: string;
  icon?: string;
  coverImage?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  icon?: string;
  coverImage?: string;
  isStarred?: boolean;
  isPinned?: boolean;
  status?: DocumentStatus;
}

export interface DocumentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: DocumentStatus;
  sort?: "title" | "createdAt" | "updatedAt" | "wordCount";
  order?: "asc" | "desc";
  tag?: string;
  folder?: string;
}

export interface DocumentStats {
  blocks: number;
  comments: number;
  versions: number;
  pendingSuggestions: number;
  activeCollaborators: number;
  wordCount: number;
  readTimeMinutes: number;
}

export interface DocumentPermission {
  id: string;
  level: PermissionLevel;
  userId: string;
  documentId: string;
  grantedBy: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentPermissionWithUser extends DocumentPermission {
  user: UserPublic;
}

// ─── Block Types ─────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
  properties: Record<string, unknown> | null;
  children: string[] | null;
  parentId: string | null;
  order: number;
  depth: number;
  isLocked: boolean;
  createdByAI: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  documentId: string;
}

export type BlockContent = TextBlockContent | HeadingBlockContent | ListBlockContent | MediaBlockContent | TableBlockContent | CodeBlockContent | EquationBlockContent | BookmarkBlockContent | CalloutBlockContent | DividerBlockContent | ToggleBlockContent | SyncBlockContent | MentionBlockContent;

export interface TextBlockContent {
  type: "text";
  text: string;
  formatting?: BlockFormatting;
}

export interface HeadingBlockContent {
  type: "heading";
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  formatting?: BlockFormatting;
}

export interface ListBlockContent {
  type: "list";
  items: ListItem[];
  ordered?: boolean;
}

export interface ListItem {
  text: string;
  checked?: boolean;
  children?: ListItem[];
}

export interface MediaBlockContent {
  type: "media";
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface TableBlockContent {
  type: "table";
  rows: TableRow[];
  columns: number;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableCell {
  content: BlockContent;
  colspan?: number;
  rowspan?: number;
}

export interface CodeBlockContent {
  type: "code";
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export interface EquationBlockContent {
  type: "equation";
  expression: string;
}

export interface BookmarkBlockContent {
  type: "bookmark";
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface CalloutBlockContent {
  type: "callout";
  variant: "info" | "warning" | "error" | "success" | "tip";
  content: string;
}

export interface DividerBlockContent {
  type: "divider";
}

export interface ToggleBlockContent {
  type: "toggle";
  title: string;
  children: Block[];
  isOpen?: boolean;
}

export interface SyncBlockContent {
  type: "syncBlock";
  sourceBlockId: string;
  sourceDocumentId: string;
}

export interface MentionBlockContent {
  type: "mention";
  userId: string;
  userName: string;
}

export interface BlockFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  highlight?: string;
  link?: string;
  color?: string;
  fontSize?: "small" | "normal" | "large" | "huge";
}

export interface CreateBlockInput {
  type: BlockType;
  content: BlockContent;
  properties?: Record<string, unknown>;
  parentId?: string;
  order: number;
  depth?: number;
}

export interface UpdateBlockInput {
  content?: BlockContent;
  properties?: Record<string, unknown>;
  order?: number;
}

export interface BlockTreeNode extends Block {
  children: BlockTreeNode[];
}

export interface ReorderBlockInput {
  id: string;
  order: number;
}

// ─── Comment Types ───────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  content: string;
  status: CommentStatus;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  documentId: string;
  blockId: string | null;
}

export interface CommentWithUser extends Comment {
  user: UserPublic;
  replies: CommentWithUser[];
  reactions: CommentReaction[];
  thread?: CommentThread;
}

export interface CommentThread {
  id: string;
  commentId: string;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReaction {
  id: string;
  emoji: string;
  userId: string;
  commentId: string;
  createdAt: Date;
  user?: UserPublic;
}

export interface CreateCommentInput {
  content: string;
  blockId?: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface CommentQuery {
  status?: CommentStatus;
  blockId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

// ─── Suggestion Types ────────────────────────────────────────────────────────

export interface Suggestion {
  id: string;
  content: BlockContent;
  originalContent: BlockContent | null;
  status: SuggestionStatus;
  reason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  reviewerId: string | null;
  documentId: string;
  blockId: string | null;
}

export interface SuggestionWithUser extends Suggestion {
  author: UserPublic;
  reviewer: UserPublic | null;
}

export interface CreateSuggestionInput {
  content: BlockContent;
  originalContent?: BlockContent;
  blockId?: string;
  reason?: string;
}

export interface ReviewSuggestionInput {
  status: SuggestionStatus;
  reason?: string;
}

// ─── Template Types ──────────────────────────────────────────────────────────

export interface Template {
  id: string;
  name: string;
  description: string | null;
  content: Record<string, unknown>;
  icon: string | null;
  isPublic: boolean;
  useCount: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string | null;
  creatorId: string;
  orgId: string | null;
}

export interface TemplateWithCategory extends Template {
  category: TemplateCategory | null;
  creator: UserPublic;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateWithTemplates extends TemplateCategory {
  templates: Template[];
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  content: Record<string, unknown>;
  categoryId?: string;
  isPublic?: boolean;
  icon?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  content?: Record<string, unknown>;
  categoryId?: string;
  isPublic?: boolean;
  icon?: string;
}

// ─── Publish Types ───────────────────────────────────────────────────────────

export interface Publish {
  id: string;
  status: PublishStatus;
  slug: string;
  customDomain: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImage: string | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  unpublishAt: Date | null;
  password: string | null;
  allowComments: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  documentId: string;
  userId: string;
}

export interface PublishSettings extends Publish {
  document: Pick<Document, "id" | "title" | "description" | "coverImage">;
}

export interface CreatePublishInput {
  slug: string;
  customDomain?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  password?: string;
  allowComments?: boolean;
  scheduledAt?: Date;
}

export interface UpdatePublishInput {
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  password?: string | null;
  allowComments?: boolean;
}

// ─── Collaboration Types ─────────────────────────────────────────────────────

export interface CollaborationSession {
  id: string;
  cursorPos: Record<string, unknown> | null;
  isActive: boolean;
  lastPing: Date;
  startedAt: Date;
  documentId: string;
  userId: string;
}

export interface CollaboratorPresence {
  id: string;
  color: string;
  cursorPos: Record<string, unknown> | null;
  selection: Record<string, unknown> | null;
  isActive: boolean;
  lastSeenAt: Date;
  connectedAt: Date;
  documentId: string;
  userId: string;
}

export interface CollaboratorWithUser extends CollaboratorPresence {
  user: UserPublic;
}

export interface CursorPosition {
  blockId: string;
  offset: number;
}

export interface SelectionRange {
  startBlockId: string;
  startOffset: number;
  endBlockId: string;
  endOffset: number;
}

export interface PresenceData {
  userId: string;
  name: string;
  image: string | null;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  isActive: boolean;
  lastSeenAt: Date;
}

export interface CollaborationEvent {
  type: "cursor" | "selection" | "presence" | "edit" | "awareness";
  userId: string;
  data: unknown;
  timestamp: number;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt: Date | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userId: string;
  documentId: string | null;
}

export interface NotificationWithDocument extends Notification {
  document: Pick<Document, "id" | "title" | "icon"> | null;
}

export interface NotificationQuery {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  cursor?: string;
}

// ─── Tag Types ───────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTag {
  id: string;
  documentId: string;
  tagId: string;
  createdAt: Date;
}

export interface DocumentTagWithTag extends DocumentTag {
  tag: Tag;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

// ─── Folder Types ────────────────────────────────────────────────────────────

export interface Folder {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  organizationId: string;
}

export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
  _count: {
    children: number;
  };
}

export interface FolderWithDocuments extends Folder {
  documents: DocumentListItem[];
  permissions: FolderPermissionWithUser[];
  _count: {
    documents: number;
    children: number;
  };
}

export interface FolderPermission {
  id: string;
  level: PermissionLevel;
  userId: string;
  folderId: string;
  grantedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderPermissionWithUser extends FolderPermission {
  user: UserPublic;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string | null;
  icon?: string;
  color?: string;
}

export interface UpdateFolderInput {
  name?: string;
  icon?: string;
  color?: string;
}

// ─── Subscription Types ──────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  stripeId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface SubscriptionWithOrg extends Subscription {
  organization: Pick<Organization, "id" | "name" | "slug">;
}

export interface UsageMetric {
  id: string;
  metric: string;
  value: number;
  period: string;
  metadata: Record<string, unknown> | null;
  recordedAt: Date;
  userId: string;
  organizationId: string;
}

export interface UsageSummary {
  documents: number;
  storageBytes: number;
  aiRequests: number;
  collaborators: number;
  apiCalls: number;
}

// ─── Attachment Types ────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: FileType;
  size: number;
  mimeType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  userId: string;
  documentId: string;
}

export interface AttachmentWithUser extends Attachment {
  user: UserPublic;
}

// ─── Activity Log Types ──────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  userId: string;
}

export interface ActivityLogWithUser extends ActivityLog {
  user: UserPublic;
}

// ─── API Key Types ───────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: Record<string, boolean> | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  userId: string;
}

export interface CreateApiKeyInput {
  name: string;
  expiresAt?: Date;
  permissions?: {
    documents?: boolean;
    comments?: boolean;
    blocks?: boolean;
    admin?: boolean;
  };
}

// ─── Pagination Types ────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    nextCursor: string | null;
    hasMore: boolean;
    count: number;
  };
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  fieldErrors?: Record<string, string[]>;
}

// ─── WebSocket Event Types ───────────────────────────────────────────────────

export interface WSEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  userId: string;
  documentId: string;
}

export interface WSCursorEvent {
  type: "cursor";
  payload: CursorPosition;
  userId: string;
  documentId: string;
}

export interface WSSelectionEvent {
  type: "selection";
  payload: SelectionRange;
  userId: string;
  documentId: string;
}

export interface WSPresenceEvent {
  type: "presence";
  payload: {
    userId: string;
    name: string;
    image: string | null;
    color: string;
    isActive: boolean;
  };
  documentId: string;
}

export interface WSEditEvent {
  type: "edit";
  payload: {
    blockId: string;
    content: BlockContent;
    operations: unknown[];
  };
  userId: string;
  documentId: string;
}

// ─── Store Types ─────────────────────────────────────────────────────────────

export interface DocumentStore {
  document: DocumentDetail | null;
  blocks: Block[];
  collaborators: CollaboratorWithUser[];
  comments: CommentWithUser[];
  suggestions: SuggestionWithUser[];
  isLoading: boolean;
  error: string | null;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

export interface EditorStore {
  focusedBlockId: string | null;
  selectedBlockIds: string[];
  isToolbarVisible: boolean;
  isSidebarOpen: boolean;
  sidebarTab: "comments" | "suggestions" | "versions" | "permissions";
  isCommandPaletteOpen: boolean;
  isAIAssistantOpen: boolean;
}

export interface UIStore {
  theme: "light" | "dark" | "system";
  isFocusMode: boolean;
  isZenMode: boolean;
  zoom: number;
  fontSize: number;
  fontFamily: string;
  showWordCount: boolean;
  showReadTime: boolean;
  showLineNumbers: boolean;
}

// ─── Search Types ────────────────────────────────────────────────────────────

export interface SearchQuery {
  q: string;
  type?: "documents" | "blocks" | "comments" | "all";
  limit?: number;
  page?: number;
}

export interface SearchResult {
  id: string;
  type: "document" | "block" | "comment";
  title: string;
  excerpt: string;
  highlight: string;
  documentId: string;
  documentTitle: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  duration: number;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalDocuments: number;
  ownedDocuments: number;
  sharedDocuments: number;
  starredDocuments: number;
  recentDocuments: RecentDocument[];
  unreadNotifications: number;
}

export interface RecentDocument {
  id: string;
  accessedAt: Date;
  document: {
    id: string;
    title: string;
    icon: string | null;
    updatedAt: Date;
    owner: UserPublic;
  };
}

// ─── AI Types ────────────────────────────────────────────────────────────────

export interface AIGenerationRequest {
  prompt: string;
  context?: string;
  documentId?: string;
  blockId?: string;
  type: "continue" | "rewrite" | "summarize" | "expand" | "fix" | "translate" | "brainstorm";
  language?: string;
  tone?: "formal" | "casual" | "professional" | "creative";
}

export interface AIGenerationResponse {
  content: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  suggestions?: string[];
}

export interface AIBlockSuggestion {
  blockId: string;
  originalContent: BlockContent;
  suggestedContent: BlockContent;
  reason: string;
  confidence: number;
}

// ─── Export Types ────────────────────────────────────────────────────────────

export type ExportFormat = "markdown" | "html" | "pdf" | "docx" | "txt" | "json";

export interface ExportOptions {
  format: ExportFormat;
  includeComments?: boolean;
  includeMetadata?: boolean;
  pageSize?: "A4" | "Letter" | "Legal";
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ImportResult {
  documentId: string;
  blocksImported: number;
  warnings: string[];
  duration: number;
}

// ─── Utility Types ───────────────────────────────────────────────────────────

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type PickByValue<T, V> = { [K in keyof T as T[K] extends V ? K : never]: T[K] };

export type OmitByValue<T, V> = { [K in keyof T as T[K] extends V ? never : K]: T[K] };

export type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// ─── BlockNote Editor Types ──────────────────────────────────────────────────

export interface BlockNoteEditorConfig {
  initialContent?: Block[];
  onChange?: (blocks: Block[]) => void;
  onCursorPositionChange?: (position: CursorPosition | null) => void;
  editable?: boolean;
  theme?: "light" | "dark";
  collaboration?: {
    roomId: string;
    userId: string;
    userName: string;
    userColor: string;
  };
  uploadFile?: (file: File) => Promise<string>;
  dictionary?: Record<string, string>;
}

export interface BlockNoteSelection {
  anchor: BlockSelectionAnchor;
  head: BlockSelectionAnchor;
}

export interface BlockSelectionAnchor {
  blockId: string;
  offset: number;
}

export interface EditorCommand {
  name: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
  isActive?: () => boolean;
  canExecute?: () => boolean;
}

// ─── Version Types ───────────────────────────────────────────────────────────

export interface DocumentVersion {
  id: string;
  version: number;
  title: string;
  content: Record<string, unknown>;
  changeSummary: string | null;
  createdAt: Date;
  documentId: string;
}

export interface VersionDiff {
  added: number;
  removed: number;
  modified: number;
  blocks: {
    id: string;
    type: "added" | "removed" | "modified";
    content?: BlockContent;
  }[];
}

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { NextApiRequest, NextApiResponse } from "next";
export type { Session } from "next-auth";
