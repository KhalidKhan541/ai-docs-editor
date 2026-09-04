import type { Block } from "./document";

export type AIModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-3.5-sonnet"
  | "claude-3-haiku"
  | "gemini-2.0-flash";

export type AITask =
  | "continue-writing"
  | "summarize"
  | "expand"
  | "rewrite"
  | "translate"
  | "simplify"
  | "formalize"
  | "brainstorm"
  | "outline"
  | "fix-grammar"
  | "improve-style"
  | "generate-heading"
  | "extract-keywords"
  | "sentiment-analysis";

export type AIProvider = "openai" | "anthropic" | "google" | "local";

export interface AIPrompt {
  system?: string;
  user: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
}

export interface AITaskRequest {
  task: AITask;
  model: AIModel;
  prompt: AIPrompt;
  context: {
    documentId: string;
    title: string;
    blocks: Block[];
    selectedBlockIds?: string[];
    selectionRange?: {
      blockId: string;
      startOffset: number;
      endOffset: number;
    };
    language?: string;
    tone?: string;
  };
  options: {
    maxTokens: number;
    temperature: number;
    stream: boolean;
    stopSequences?: string[];
  };
}

export interface AITaskResponse {
  id: string;
  task: AITask;
  model: AIModel;
  result: {
    text: string;
    blocks?: Block[];
    suggestions?: string[];
    metadata?: Record<string, unknown>;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  latencyMs: number;
  createdAt: string;
}

export interface AIStreamChunk {
  id: string;
  delta: string;
  finished: boolean;
  usage?: AITaskResponse["usage"];
}

export interface AIFeature {
  id: string;
  name: string;
  description: string;
  task: AITask;
  icon: string;
  shortcut?: string;
  isEnabled: boolean;
  requiresSelection: boolean;
  maxInputTokens: number;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byTask: Record<AITask, { requests: number; tokens: number; cost: number }>;
  byModel: Record<AIModel, { requests: number; tokens: number; cost: number }>;
  period: {
    start: string;
    end: string;
  };
}

export interface AIQuota {
  plan: "free" | "pro" | "team" | "enterprise";
  monthlyLimit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  overageAllowed: boolean;
  overageRate: number;
}

export interface AIHistoryEntry {
  id: string;
  task: AITask;
  model: AIModel;
  input: string;
  output: string;
  documentId: string;
  blockId?: string;
  tokens: number;
  cost: number;
  rating?: number;
  feedback?: string;
  createdAt: string;
}

export interface AIWritingConfig {
  defaultModel: AIModel;
  defaultTemperature: number;
  defaultMaxTokens: number;
  autoSuggest: boolean;
  autoSuggestDelay: number;
  languages: string[];
  customPrompts: Array<{
    id: string;
    name: string;
    prompt: string;
    task: AITask;
  }>;
}
