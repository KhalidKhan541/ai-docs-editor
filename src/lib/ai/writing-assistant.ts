import {
  getAIClient,
  type AICompletionRequest,
  type AICompletionResponse,
  type StreamChunk,
  type ChatMessage,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tone =
  | "formal"
  | "casual"
  | "professional"
  | "friendly"
  | "academic"
  | "technical"
  | "persuasive"
  | "neutral";

export type Length = "shorter" | "same" | "longer";

export interface RewriteOptions {
  tone?: Tone;
  style?: string;
  length?: Length;
  language?: string;
  provider?: "openai" | "anthropic" | "gemini";
}

export interface WritingContext {
  /** The full document content (plain text). */
  documentContent: string;
  /** Current selection text, if any. */
  selection?: string;
  /** Cursor offset within the document (0-indexed). */
  cursorOffset: number;
  /** Document title for context. */
  documentTitle?: string;
}

export interface ContinueResult {
  text: string;
  response: AICompletionResponse;
}

export interface RewriteResult {
  originalText: string;
  rewrittenText: string;
  changes: string;
  response: AICompletionResponse;
}

export interface GenerateResult {
  content: string;
  response: AICompletionResponse;
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const SYSTEM_BASE = `You are an expert AI writing assistant integrated into a collaborative document editor. 
You help users write, edit, and improve their documents.
Always output ONLY the rewritten/generated text without any explanations, prefixes, or markdown fences.
Match the surrounding context and maintain consistent formatting.`;

function systemPrompt(additions: string): ChatMessage {
  return { role: "system", content: `${SYSTEM_BASE}\n${additions}` };
}

function contextMessages(ctx: WritingContext): ChatMessage[] {
  const msgs: ChatMessage[] = [];

  if (ctx.documentTitle) {
    msgs.push({
      role: "user",
      content: `Document title: "${ctx.documentTitle}"`,
    });
    msgs.push({ role: "assistant", content: "Understood." });
  }

  // Provide a truncated document excerpt for context
  const maxContextLen = 3000;
  const start = Math.max(0, ctx.cursorOffset - 1000);
  const end = Math.min(ctx.documentContent.length, ctx.cursorOffset + 2000);
  const excerpt = ctx.documentContent.slice(start, end);

  if (excerpt.trim().length > 0) {
    msgs.push({
      role: "user",
      content: `Context around cursor:\n---\n${excerpt}\n---`,
    });
    msgs.push({ role: "assistant", content: "I see the context." });
  }

  return msgs;
}

// ---------------------------------------------------------------------------
// Continue writing
// ---------------------------------------------------------------------------

/**
 * Generate text to continue writing from the cursor position.
 */
export async function continueWriting(
  ctx: WritingContext,
  options?: { maxTokens?: number; provider?: "openai" | "anthropic" | "gemini" }
): Promise<ContinueResult> {
  const client = getAIClient();

  // Extract text before and after cursor
  const beforeCursor = ctx.documentContent.slice(0, ctx.cursorOffset);
  const afterCursor = ctx.documentContent.slice(ctx.cursorOffset);

  const messages: ChatMessage[] = [
    systemPrompt(
      `Continue the text naturally from where the cursor is placed.
Do NOT repeat any text that appears before the cursor.
Output ONLY the continuation text that should be inserted at the cursor position.
Stop at a natural paragraph or sentence boundary.`
    ),
    ...contextMessages(ctx),
    {
      role: "user",
      content: `Continue writing from this point. The text before the cursor is:\n---\n${beforeCursor.slice(-800)}\n---\n\nDo NOT repeat any of the above text. Write ONLY what comes next:`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options?.maxTokens ?? 512,
    temperature: 0.7,
    provider: options?.provider,
  });

  // Clean up: remove leading/trailing newlines that duplicate existing whitespace
  let continuation = response.content.trim();

  // If the document ends with whitespace, don't add more
  if (beforeCursor.endsWith("\n\n") && continuation.startsWith("\n")) {
    continuation = continuation.replace(/^\n+/, "");
  } else if (beforeCursor.endsWith("\n") && continuation.startsWith("\n\n")) {
    continuation = continuation.replace(/^\n+/, "\n");
  }

  return { text: continuation, response };
}

// ---------------------------------------------------------------------------
// Rewrite selection
// ---------------------------------------------------------------------------

/**
 * Rewrite the selected text with different tone, style, or length.
 */
export async function rewriteSelection(
  text: string,
  ctx: WritingContext,
  options: RewriteOptions = {}
): Promise<RewriteResult> {
  const client = getAIClient();

  const toneLine = options.tone
    ? `Tone: ${options.tone}.`
    : "";
  const styleLine = options.style
    ? `Style: ${options.style}.`
    : "";
  const lengthLine = options.length
    ? `Make the text ${options.length} than the original.`
    : "Keep approximately the same length.";

  const messages: ChatMessage[] = [
    systemPrompt(
      `Rewrite the user's text while preserving its core meaning.
${toneLine} ${styleLine} ${lengthLine}
Maintain the same language unless instructed otherwise.
Output ONLY the rewritten text.`
    ),
    {
      role: "user",
      content: `Rewrite this text:\n\n"""${text}"""`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 2, 1024),
    temperature: 0.7,
    provider: options.provider,
  });

  return {
    originalText: text,
    rewrittenText: response.content.trim(),
    changes: `Rewritten with ${options.tone ?? "default"} tone, ${options.length ?? "same"} length.`,
    response,
  };
}

// ---------------------------------------------------------------------------
// Summarize
// ---------------------------------------------------------------------------

/**
 * Summarize the selected text or the entire document.
 */
export async function summarize(
  text: string,
  options?: {
    maxLength?: "short" | "medium" | "long";
    provider?: "openai" | "anthropic" | "gemini";
  }
): Promise<GenerateResult> {
  const client = getAIClient();

  const lengthMap = {
    short: "1-2 sentences",
    medium: "1 paragraph (3-5 sentences)",
    long: "2-3 paragraphs",
  };

  const targetLength = lengthMap[options?.maxLength ?? "medium"];

  const messages: ChatMessage[] = [
    systemPrompt(
      `Summarize the following text in ${targetLength}.
Output ONLY the summary without any preamble, labels, or formatting.
Preserve the key information and main points.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 1024,
    temperature: 0.3,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Expand selection
// ---------------------------------------------------------------------------

/**
 * Expand the selected text with additional detail and context.
 */
export async function expandSelection(
  text: string,
  ctx: WritingContext,
  options?: { detail?: "some" | "moderate" | "extensive"; provider?: "openai" | "anthropic" | "gemini" }
): Promise<GenerateResult> {
  const client = getAIClient();

  const detailMap = {
    some: "Add a moderate amount of supporting detail.",
    moderate: "Add significant detail, examples, and explanations.",
    extensive: "Add extensive detail, examples, evidence, and thorough explanations.",
  };

  const messages: ChatMessage[] = [
    systemPrompt(
      `Expand the following text by adding more detail and depth.
${detailMap[options?.detail ?? "moderate"]}
Maintain the original tone and style.
Output ONLY the expanded text without any meta-commentary.`
    ),
    ...contextMessages(ctx),
    {
      role: "user",
      content: `Expand this text:\n\n"""${text}"""`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 3, 2048),
    temperature: 0.7,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Simplify
// ---------------------------------------------------------------------------

/**
 * Simplify the text to make it easier to read and understand.
 */
export async function simplify(
  text: string,
  options?: {
    readingLevel?: "elementary" | "middle-school" | "high-school" | "general";
    provider?: "openai" | "anthropic" | "gemini";
  }
): Promise<GenerateResult> {
  const client = getAIClient();

  const levelDescriptions = {
    elementary: "a 5th-grade reading level with very simple words and short sentences",
    "middle-school": "an 8th-grade reading level with accessible language",
    "high-school": "a 10th-grade reading level with clear, straightforward language",
    general: "a general audience, removing jargon and complex phrasing",
  };

  const targetLevel = levelDescriptions[options?.readingLevel ?? "general"];

  const messages: ChatMessage[] = [
    systemPrompt(
      `Simplify the following text to be readable at ${targetLevel}.
Replace complex words with simpler alternatives.
Break long sentences into shorter ones.
Remove unnecessary jargon.
Output ONLY the simplified text.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 2, 1024),
    temperature: 0.3,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Fix grammar and spelling
// ---------------------------------------------------------------------------

/**
 * Fix grammar, spelling, and punctuation errors.
 */
export async function fixGrammar(
  text: string,
  options?: { provider?: "openai" | "anthropic" | "gemini" }
): Promise<RewriteResult> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    systemPrompt(
      `Fix all grammar, spelling, punctuation, and typographical errors in the following text.
Do NOT change the meaning, style, or tone of the text.
Do NOT add or remove content.
Output ONLY the corrected text.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 2, 1024),
    temperature: 0.1,
    provider: options?.provider,
  });

  return {
    originalText: text,
    rewrittenText: response.content.trim(),
    changes: "Fixed grammar, spelling, and punctuation.",
    response,
  };
}

// ---------------------------------------------------------------------------
// Translate
// ---------------------------------------------------------------------------

/**
 * Translate text to another language.
 */
export async function translate(
  text: string,
  targetLanguage: string,
  options?: { provider?: "openai" | "anthropic" | "gemini" }
): Promise<GenerateResult> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    systemPrompt(
      `Translate the following text to ${targetLanguage}.
Preserve the original tone and formatting.
Output ONLY the translated text without any explanations.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 2, 2048),
    temperature: 0.3,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Change tone
// ---------------------------------------------------------------------------

/**
 * Change the tone of the text.
 */
export async function changeTone(
  text: string,
  targetTone: Tone,
  options?: { provider?: "openai" | "anthropic" | "gemini" }
): Promise<GenerateResult> {
  const client = getAIClient();

  const toneDescriptions: Record<Tone, string> = {
    formal: "professional and authoritative, suitable for official documents",
    casual: "relaxed and conversational, as if talking to a friend",
    professional: "polished and business-appropriate, suitable for workplace communication",
    friendly: "warm, approachable, and personable",
    academic: "scholarly and rigorous, suitable for research papers",
    technical: "precise and detailed, suitable for technical documentation",
    persuasive: "compelling and convincing, using rhetorical techniques",
    neutral: "balanced and objective, without strong emotional language",
  };

  const messages: ChatMessage[] = [
    systemPrompt(
      `Change the tone of the following text to ${targetTone}: ${toneDescriptions[targetTone]}.
Preserve the core meaning and information.
Output ONLY the rewritten text.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 2, 1024),
    temperature: 0.7,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Make longer / shorter
// ---------------------------------------------------------------------------

/**
 * Make the text longer or shorter.
 */
export async function adjustLength(
  text: string,
  direction: "longer" | "shorter",
  options?: {
    factor?: number; // 0.5 = half, 2.0 = double
    provider?: "openai" | "anthropic" | "gemini";
  }
): Promise<GenerateResult> {
  const client = getAIClient();

  const factor = options?.factor ?? (direction === "longer" ? 1.5 : 0.5);
  const targetWords = Math.round(
    text.split(/\s+/).length * factor
  );

  const messages: ChatMessage[] = [
    systemPrompt(
      `Make the following text ${direction}. 
Target approximately ${targetWords} words (the original is ~${text.split(/\s+/).length} words).
Preserve all key information and the original tone.
Output ONLY the adjusted text.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(targetWords * 2, 1024),
    temperature: 0.5,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Bullet points ↔ paragraph
// ---------------------------------------------------------------------------

/**
 * Convert bullet points into a flowing paragraph.
 */
export async function bulletsToParagraph(
  text: string,
  options?: { provider?: "openai" | "anthropic" | "gemini" }
): Promise<GenerateResult> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    systemPrompt(
      `Convert the following bullet points into a cohesive, flowing paragraph.
Connect the points naturally using transitional phrases.
Do NOT use bullet points, dashes, or numbered lists in the output.
Output ONLY the paragraph.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 2, 1024),
    temperature: 0.5,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

/**
 * Convert a paragraph into bullet points.
 */
export async function paragraphToBullets(
  text: string,
  options?: { provider?: "openai" | "anthropic" | "gemini" }
): Promise<GenerateResult> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    systemPrompt(
      `Convert the following paragraph into clear, concise bullet points.
Each bullet should capture one key idea.
Start each line with "- ".
Output ONLY the bullet points.`
    ),
    {
      role: "user",
      content: text,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(text.length * 2, 1024),
    temperature: 0.3,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Streaming rewrite (for real-time UI feedback)
// ---------------------------------------------------------------------------

/**
 * Stream a rewrite so the UI can display tokens as they arrive.
 */
export async function* streamRewrite(
  text: string,
  options: RewriteOptions = {}
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const toneLine = options.tone ? `Tone: ${options.tone}.` : "";
  const lengthLine = options.length
    ? `Make the text ${options.length} than the original.`
    : "Keep approximately the same length.";

  const messages: ChatMessage[] = [
    systemPrompt(
      `Rewrite the user's text while preserving its core meaning.
${toneLine} ${lengthLine}
Output ONLY the rewritten text.`
    ),
    {
      role: "user",
      content: `Rewrite this text:\n\n"""${text}"""`,
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: Math.max(text.length * 2, 1024),
    temperature: 0.7,
    provider: options.provider,
    stream: true,
  });
}

/**
 * Stream a continuation from the cursor position.
 */
export async function* streamContinue(
  ctx: WritingContext
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const beforeCursor = ctx.documentContent.slice(0, ctx.cursorOffset);

  const messages: ChatMessage[] = [
    systemPrompt(
      `Continue the text naturally from where the cursor is placed.
Do NOT repeat any text before the cursor.
Output ONLY the continuation.`
    ),
    ...contextMessages(ctx),
    {
      role: "user",
      content: `Continue writing from this point. The text before the cursor:\n---\n${beforeCursor.slice(-800)}\n---\n\nWrite ONLY what comes next:`,
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: 512,
    temperature: 0.7,
    stream: true,
  });
}

// ---------------------------------------------------------------------------
// Batch operations
// ---------------------------------------------------------------------------

export interface BatchOperation {
  id: string;
  text: string;
  operation:
    | "rewrite"
    | "summarize"
    | "expand"
    | "simplify"
    | "fixGrammar"
    | "translate";
  options?: RewriteOptions & { targetLanguage?: string; maxLength?: "short" | "medium" | "long" };
}

export interface BatchResult {
  id: string;
  originalText: string;
  resultText: string;
  response: AICompletionResponse;
}

/**
 * Process multiple writing operations concurrently.
 */
export async function batchProcess(
  operations: BatchOperation[],
  concurrency = 3
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (op) => {
        let result: GenerateResult | RewriteResult;

        switch (op.operation) {
          case "rewrite":
            result = await rewriteSelection(op.text, {
              documentContent: "",
              cursorOffset: 0,
            }, op.options);
            break;
          case "summarize":
            result = await summarize(op.text, op.options);
            break;
          case "expand":
            result = await expandSelection(op.text, {
              documentContent: "",
              cursorOffset: 0,
            }, op.options);
            break;
          case "simplify":
            result = await simplify(op.text, op.options);
            break;
          case "fixGrammar":
            result = await fixGrammar(op.text, op.options);
            break;
          case "translate":
            result = await translate(
              op.text,
              op.options?.targetLanguage ?? "English",
              op.options
            );
            break;
          default:
            throw new Error(`Unknown operation: ${op.operation}`);
        }

        return {
          id: op.id,
          originalText: op.text,
          resultText:
            "rewrittenText" in result ? result.rewrittenText : result.content,
          response: result.response,
        };
      })
    );

    results.push(...batchResults);
  }

  return results;
}
