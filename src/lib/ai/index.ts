// Provider
export {
  AIClient,
  AIProviderError,
  AIRateLimitError,
  AITimeoutError,
  initAIClient,
  getAIClient,
  createClientFromEnv,
} from "./provider";

export type {
  AIProvider,
  MessageRole,
  ChatMessage,
  StreamChunk,
  TokenUsage,
  AICompletionRequest,
  AICompletionResponse,
  ProviderConfig,
  EmbeddingRequest,
  EmbeddingResponse,
} from "./provider";

// Writing Assistant
export {
  continueWriting,
  rewriteSelection,
  summarize,
  expandSelection,
  simplify,
  fixGrammar,
  translate,
  changeTone,
  adjustLength,
  bulletsToParagraph,
  paragraphToBullets,
  streamRewrite,
  streamContinue,
  batchProcess,
} from "./writing-assistant";

export type {
  Tone,
  Length,
  RewriteOptions,
  WritingContext,
  ContinueResult,
  RewriteResult,
  GenerateResult,
  BatchOperation,
  BatchResult,
} from "./writing-assistant";

// Content Generator
export {
  generateFromOutline,
  generateFromPrompt,
  generateBlogPost,
  generateDocumentation,
  generateMeetingNotes,
  generateTechSpec,
  generateFAQ,
  generateEmailDraft,
  streamGenerate,
  streamBlogPost,
  generateFromTemplate,
  BUILT_IN_TEMPLATES,
} from "./content-generator";

export type {
  ContentFormat,
  GenerationOptions,
  OutlineItem,
  GeneratedContent,
  BlogPostOptions,
  DocumentationOptions,
  MeetingNotesOptions,
  TechSpecOptions,
  FAQOptions,
  EmailOptions,
  ContentTemplate,
} from "./content-generator";

// Editor Commands
export {
  getInlineSuggestion,
  getContinuationSuggestion,
  streamInlineSuggestion,
  generateBlock,
  generateBlockSequence,
  processSelection,
  streamProcessSelection,
  processDocumentRequest,
  streamDocumentRequest,
  executeCustomPrompt,
  streamCustomPrompt,
  BUILT_IN_PROMPTS,
} from "./editor-commands";

export type {
  BlockType,
  Block,
  DocumentContext,
  InlineSuggestionRequest,
  InlineSuggestion,
  BlockGenerationRequest,
  BlockGenerationResult,
  SelectionContextRequest,
  DocumentContextRequest,
  CustomPrompt,
} from "./editor-commands";

// Smart Formatting
export {
  suggestHeadings,
  fixHeadingHierarchy,
  suggestTableStructure,
  toMarkdownTable,
  detectCodeLanguage,
  generateAltText,
  generateLinkTitle,
  generateTOC,
  renderTOCMarkdown,
  renderTOCHTML,
  formatDocument,
  streamFormatSuggestion,
} from "./smart-formatting";

export type {
  HeadingSuggestion,
  TableStructure,
  CodeLanguageDetection,
  AltTextSuggestion,
  LinkTitleSuggestion,
  TOCEntry,
  FormattingOptions,
  FormatPassResult,
} from "./smart-formatting";

// Search
export {
  chunkDocument,
  cosineSimilarity,
  semanticSearch,
  keywordSearch,
  hybridSearch,
  naturalLanguageSearch,
  findSimilarContent,
  crossDocumentSearch,
  clusterResults,
} from "./search";

export type {
  SearchResult,
  SearchOptions,
  CrossDocumentSearchOptions,
  SimilarContentRequest,
  DocumentForSearch,
  SearchResultCluster,
} from "./search";

// Copilot
export {
  getInlineCompletion,
  streamInlineCompletion,
  generateBlockContent,
  completeCode,
  generateDataTable,
  suggestChart,
  multiStepComplete,
  getContextualSuggestion,
  streamCopilot,
} from "./copilot";

export type {
  CopilotMode,
  CopilotContext,
  CopilotRequest,
  CopilotSuggestion,
  CodeCompletionResult,
  DataTableResult,
  ChartSuggestion,
  MultiStepResult,
} from "./copilot";

// Quality
export {
  calculateReadability,
  checkToneConsistency,
  checkGrammarAndStyle,
  checkPlagiarism,
  analyzeSEO,
  generateQualityReport,
  streamQualitySuggestions,
} from "./quality";

export type {
  ReadabilityScore,
  ToneConsistencyResult,
  GrammarIssue,
  GrammarCheckResult,
  PlagiarismCheckResult,
  SEOSuggestion,
  SEOAnalysisResult,
  QualityOptions,
  QualityReport,
} from "./quality";
