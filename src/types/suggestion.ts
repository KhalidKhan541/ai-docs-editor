export type SuggestionType =
  | "grammar"
  | "spelling"
  | "style"
  | "clarity"
  | "conciseness"
  | "tone"
  | "vocabulary"
  | "structure"
  | "fact-check"
  | "ai-complete";

export type SuggestionSeverity = "low" | "medium" | "high";

export type SuggestionStatus = "pending" | "accepted" | "rejected" | "dismissed";

export interface SuggestionRange {
  blockId: string;
  startOffset: number;
  endOffset: number;
  originalText: string;
}

export interface SuggestionReplacement {
  text: string;
  styles?: Record<string, unknown>;
}

export interface AISuggestion {
  id: string;
  documentId: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  status: SuggestionStatus;
  range: SuggestionRange;
  originalText: string;
  suggestedText: string;
  replacements: SuggestionReplacement[];
  explanation: string;
  confidence: number;
  source: "ai" | "rule" | "user";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface SuggestionFilter {
  type?: SuggestionType[];
  severity?: SuggestionSeverity[];
  status?: SuggestionStatus[];
  blockId?: string;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SuggestionBatchAction {
  suggestionIds: string[];
  action: "accept" | "reject" | "dismiss";
}

export interface SuggestionStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  byType: Record<SuggestionType, number>;
  bySeverity: Record<SuggestionSeverity, number>;
}

export interface WritingInsight {
  type: "readability" | "passive-voice" | "sentence-length" | "jargon" | "inclusive-language";
  message: string;
  severity: SuggestionSeverity;
  occurrences: number;
  examples?: string[];
}

export interface AICompletionRequest {
  documentId: string;
  blockId: string;
  prompt: string;
  context: {
    precedingBlocks: Array<{ id: string; content: string }>;
    followingBlocks: Array<{ id: string; content: string }>;
    documentTitle: string;
  };
  options: {
    maxTokens?: number;
    temperature?: number;
    style?: "formal" | "casual" | "academic" | "creative";
    language?: string;
  };
}

export interface AICompletionResponse {
  id: string;
  completions: Array<{
    text: string;
    confidence: number;
    tokens: number;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  latencyMs: number;
}
