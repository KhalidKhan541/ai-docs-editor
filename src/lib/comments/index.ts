export { CommentService, commentService } from "./comment-service";
export type {
  Comment,
  CommentStatus,
  CommentReaction,
  CommentMention,
  CommentFilter,
  CreateCommentPayload,
  UpdateCommentPayload,
  CommentEvent,
  CommentEventType,
  CommentEventListener,
} from "./comment-service";

export { CommentPositioningService, commentPositioningService } from "./comment-positioning";
export type {
  TextAnchor,
  SelectionAnchor,
  PositionShift,
  AnchorSnapshot,
} from "./comment-positioning";

export { NotificationService, notificationService } from "./notification-service";
export type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationPreferences,
  NotificationFilter,
  EmailNotification,
  NotificationEvent,
  NotificationEventType,
  NotificationEventListener,
} from "./notification-service";

export { SuggestionService, suggestionService } from "../suggestions/suggestion-service";
export type {
  Suggestion,
  SuggestionType,
  SuggestionStatus,
  SuggestionChange,
  SuggestionComment,
  SuggestionFilter,
  SuggestionSnapshot,
  SuggestionRange,
  VersionDiff,
  SuggestionEvent,
  SuggestionEventType,
  SuggestionEventListener,
} from "../suggestions/suggestion-service";

export {
  computeDiff,
  computeInlineDiff,
  computeBlockDiff,
  computeSideBySide,
  computeDiffStats,
  detectMergeConflicts,
  resolveConflict,
  threeWayMerge,
  applyMergeResolution,
} from "../suggestions/diff-engine";
export type {
  DiffOperation,
  InlineDiffSegment,
  BlockDiff,
  SideBySideSegment,
  MergeConflict,
  MergeResult,
  ThreeWayMergeInput,
  DiffStats,
} from "../suggestions/diff-engine";
