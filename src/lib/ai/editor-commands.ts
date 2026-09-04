import {
  getAIClient,
  type AICompletionResponse,
  type ChatMessage,
  type StreamChunk,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlockType =
  | "paragraph"
  | "heading"
  | "bulletList"
  | "numberedList"
  | "checkList"
  | "codeBlock"
  | "quote"
  | "callout"
  | "table"
  | "divider"
  | "image";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  props?: Record<string, unknown>;
}

export interface DocumentContext {
  blocks: Block[];
  title?: string;
  /** Currently selected block IDs. */
  selectedBlockIds?: string[];
  /** Cursor block index. */
  cursorBlockIndex?: number;
}

export interface InlineSuggestionRequest {
  /** Text before the cursor in the current block. */
  textBefore: string;
  /** Text after the cursor in the current block. */
  textAfter: string;
  /** The block type of the current block. */
  blockType: BlockType;
  /** Full document context. */
  document: DocumentContext;
}

export interface InlineSuggestion {
  id: string;
  text: string;
  confidence: number; // 0-1
  source: "ai-continue" | "ai-suggest" | "ai-autocomplete";
}

export interface BlockGenerationRequest {
  blockType: BlockType;
  prompt: string;
  precedingBlocks: Block[];
  followingBlocks: Block[];
  document: DocumentContext;
}

export interface BlockGenerationResult {
  blocks: Block[];
  response: AICompletionResponse;
}

export interface SelectionContextRequest {
  selectedText: string;
  prompt: string;
  document: DocumentContext;
}

export interface DocumentContextRequest {
  prompt: string;
  document: DocumentContext;
  /** Optional focus area to constrain context. */
  focusBlockIds?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializeBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      const prefix = b.type === "heading" ? `## ` : "";
      return `${prefix}[${b.type}] ${b.content}`;
    })
    .join("\n");
}

function systemPromptWithContext(
  document: DocumentContext,
  instruction: string
): string {
  const parts = [
    "You are an AI assistant integrated into a collaborative document editor.",
    instruction,
    "Output ONLY the requested content. No meta-commentary, no markdown fences.",
  ];

  if (document.title) {
    parts.push(`Document title: "${document.title}"`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Inline AI suggestions (ghost text)
// ---------------------------------------------------------------------------

/**
 * Generate inline ghost-text suggestions as the user types.
 */
export async function getInlineSuggestion(
  request: InlineSuggestionRequest
): Promise<InlineSuggestion> {
  const client = getAIClient();

  const docSummary = serializeBlocks(request.document.blocks.slice(0, 10));

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Generate a short inline text suggestion to complete what the user is typing.
The suggestion should be a natural continuation of the text before the cursor.
Keep it to 1-3 sentences maximum.
Output ONLY the suggested text, nothing else.`
      ),
    },
    {
      role: "user",
      content: `Block type: ${request.blockType}
Text before cursor: """${request.textBefore}"""
Text after cursor: """${request.textAfter}"""
Document context:\n${docSummary}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 128,
    temperature: 0.4,
  });

  const suggestionText = response.content.trim();

  return {
    id: `inline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: suggestionText,
    confidence: 0.85,
    source: "ai-suggest",
  };
}

/**
 * Continue typing from the cursor position (longer continuation).
 */
export async function getContinuationSuggestion(
  request: InlineSuggestionRequest
): Promise<InlineSuggestion> {
  const client = getAIClient();

  const docSummary = serializeBlocks(request.document.blocks.slice(0, 15));
  const recentBlocks = request.document.blocks
    .slice(Math.max(0, (request.document.cursorBlockIndex ?? 0) - 3))
    .map((b) => b.content)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Continue writing from the cursor position.
Generate 2-5 sentences of natural continuation.
Do NOT repeat text before the cursor.
Match the writing style of the surrounding text.
Output ONLY the continuation text.`
      ),
    },
    {
      role: "user",
      content: `Text before cursor: """${request.textBefore}"""
Text after cursor: """${request.textAfter}"""
Recent content:\n${recentBlocks}
Full document:\n${docSummary}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 256,
    temperature: 0.6,
  });

  return {
    id: `continue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: response.content.trim(),
    confidence: 0.8,
    source: "ai-continue",
  };
}

/**
 * Stream inline suggestions token by token.
 */
export async function* streamInlineSuggestion(
  request: InlineSuggestionRequest
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const docSummary = serializeBlocks(request.document.blocks.slice(0, 10));

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Generate a short inline text suggestion to complete what the user is typing.
Output ONLY the suggested text.`
      ),
    },
    {
      role: "user",
      content: `Block type: ${request.blockType}
Text before cursor: """${request.textBefore}"""
Text after cursor: """${request.textAfter}"""
Document context:\n${docSummary}`,
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: 128,
    temperature: 0.4,
    stream: true,
  });
}

// ---------------------------------------------------------------------------
// Block-level AI (generate content for a block)
// ---------------------------------------------------------------------------

/**
 * Generate content for a specific block type.
 */
export async function generateBlock(
  request: BlockGenerationRequest
): Promise<BlockGenerationResult> {
  const client = getAIClient();

  const blockTypeInstructions: Record<BlockType, string> = {
    paragraph: "Write a well-crafted paragraph.",
    heading: "Write a clear, descriptive heading.",
    bulletList: "Write a bulleted list with 3-7 items, each starting with '- '.",
    numberedList: "Write a numbered list with 3-7 items.",
    checkList: "Write a task list with items starting with '- [ ] '.",
    codeBlock: "Write a code block with syntax highlighting. Include language identifier.",
    quote: "Write an impactful blockquote.",
    callout: "Write a callout or note with ⚠️ or 💡 or ℹ️ prefix.",
    table: "Write a Markdown table with headers and 3-5 rows of example data.",
    divider: "---",
    image: "Write a descriptive alt text for an image.",
  };

  const preceding = serializeBlocks(request.precedingBlocks.slice(-5));
  const following = serializeBlocks(request.followingBlocks.slice(0, 5));

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Generate content for a ${request.blockType} block.
${blockTypeInstructions[request.blockType]}
Output ONLY the block content, nothing else.`
      ),
    },
    {
      role: "user",
      content: `User request: ${request.prompt}

Preceding blocks:
${preceding || "(none)"}

Following blocks:
${following || "(none)"}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 1024,
    temperature: 0.6,
  });

  const content = response.content.trim();

  const newBlock: Block = {
    id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: request.blockType,
    content,
  };

  return {
    blocks: [newBlock],
    response,
  };
}

/**
 * Generate multiple blocks in sequence from a prompt.
 */
export async function generateBlockSequence(
  prompt: string,
  blockTypes: BlockType[],
  document: DocumentContext
): Promise<BlockGenerationResult> {
  const client = getAIClient();

  const typeList = blockTypes.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        document,
        `Generate a sequence of ${blockTypes.length} blocks.
Block types (in order):\n${typeList}

For each block, output on a separate line:
[TYPE] content

Where TYPE is one of: ${blockTypes.join(", ")}
Do not skip any block type.`
      ),
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 2048,
    temperature: 0.6,
  });

  const blocks = parseGeneratedBlocks(response.content, blockTypes);

  return { blocks, response };
}

function parseGeneratedBlocks(
  content: string,
  expectedTypes: BlockType[]
): Block[] {
  const lines = content.split("\n").filter((l) => l.trim());
  const blocks: Block[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Try to parse [TYPE] content format
    const match = line.match(/^\[(\w+)\]\s*(.*)$/);
    if (match?.[1]) {
      const type = match[1].toLowerCase() as BlockType;
      const validTypes: BlockType[] = [
        "paragraph", "heading", "bulletList", "numberedList",
        "checkList", "codeBlock", "quote", "callout", "table",
        "divider", "image",
      ];

      if (validTypes.includes(type)) {
        blocks.push({
          id: `gen-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          type,
          content: match[2] ?? "",
        });
        continue;
      }
    }

    // Fallback: use expected type or paragraph
    blocks.push({
      id: `gen-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      type: expectedTypes[i] ?? "paragraph",
      content: line,
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Selection-aware AI
// ---------------------------------------------------------------------------

/**
 * Process a prompt with context from the user's selection.
 */
export async function processSelection(
  request: SelectionContextRequest
): Promise<BlockGenerationResult> {
  const client = getAIClient();

  const docSummary = serializeBlocks(request.document.blocks.slice(0, 15));

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Process the user's request regarding the selected text.
Output ONLY the result content, no explanations.`
      ),
    },
    {
      role: "user",
      content: `Selected text:
"""${request.selectedText}"""

Request: ${request.prompt}

Document context:
${docSummary}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 2048,
    temperature: 0.6,
  });

  return {
    blocks: [
      {
        id: `sel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "paragraph",
        content: response.content.trim(),
      },
    ],
    response,
  };
}

/**
 * Stream selection processing for real-time feedback.
 */
export async function* streamProcessSelection(
  request: SelectionContextRequest
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const docSummary = serializeBlocks(request.document.blocks.slice(0, 15));

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Process the user's request regarding the selected text.
Output ONLY the result content.`
      ),
    },
    {
      role: "user",
      content: `Selected text:
"""${request.selectedText}"""

Request: ${request.prompt}

Document context:
${docSummary}`,
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: 2048,
    temperature: 0.6,
    stream: true,
  });
}

// ---------------------------------------------------------------------------
// Document-aware AI
// ---------------------------------------------------------------------------

/**
 * Process a prompt with full document context.
 */
export async function processDocumentRequest(
  request: DocumentContextRequest
): Promise<BlockGenerationResult> {
  const client = getAIClient();

  let docContent: string;

  if (request.focusBlockIds?.length) {
    const focused = request.document.blocks.filter((b) =>
      request.focusBlockIds!.includes(b.id)
    );
    docContent = serializeBlocks(focused);
  } else {
    docContent = serializeBlocks(request.document.blocks.slice(0, 30));
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Process the user's request with awareness of the full document.
Output ONLY the result content.`
      ),
    },
    {
      role: "user",
      content: `Full document:
--- 
${docContent}
---

Request: ${request.prompt}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 4096,
    temperature: 0.6,
  });

  return {
    blocks: [
      {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "paragraph",
        content: response.content.trim(),
      },
    ],
    response,
  };
}

/**
 * Stream document-aware processing.
 */
export async function* streamDocumentRequest(
  request: DocumentContextRequest
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const docContent = serializeBlocks(request.document.blocks.slice(0, 30));

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPromptWithContext(
        request.document,
        `Process the user's request with full document awareness.
Output ONLY the result content.`
      ),
    },
    {
      role: "user",
      content: `Document:
---
${docContent}
---

Request: ${request.prompt}`,
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: 4096,
    temperature: 0.6,
    stream: true,
  });
}

// ---------------------------------------------------------------------------
// Custom AI prompts
// ---------------------------------------------------------------------------

export interface CustomPrompt {
  id: string;
  name: string;
  systemMessage: string;
  userMessageTemplate: string;
  /** Placeholders in userMessageTemplate like {selection}, {document}, {cursor}. */
  placeholders: string[];
}

export const BUILT_IN_PROMPTS: CustomPrompt[] = [
  {
    id: "improve",
    name: "Improve Writing",
    systemMessage: "Improve the quality, clarity, and flow of the text. Fix any awkward phrasing.",
    userMessageTemplate: "Improve this text:\n"""{selection}"""",
    placeholders: ["selection"],
  },
  {
    id: "formalize",
    name: "Make Formal",
    systemMessage: "Rewrite the text in a formal, professional tone suitable for business documents.",
    userMessageTemplate: "Make this text formal:\n"""{selection}"""",
    placeholders: ["selection"],
  },
  {
    id: "simplify",
    name: "Simplify",
    systemMessage: "Simplify the text so anyone can understand it. Use short sentences and common words.",
    userMessageTemplate: "Simplify this text:\n"""{selection}"""",
    placeholders: ["selection"],
  },
  {
    id: "explain",
    name: "Explain Further",
    systemMessage: "Add a clear explanation of the concept, with examples if helpful.",
    userMessageTemplate: "Explain this in more detail:\n"""{selection}"""",
    placeholders: ["selection"],
  },
  {
    id: "proofread",
    name: "Proofread",
    systemMessage: "Check for grammar, spelling, punctuation, and style issues. Fix them without changing meaning.",
    userMessageTemplate: "Proofread this text:\n"""{selection}"""",
    placeholders: ["selection"],
  },
  {
    id: "translate-es",
    name: "Translate to Spanish",
    systemMessage: "Translate the text to Spanish accurately while preserving tone.",
    userMessageTemplate: "Translate to Spanish:\n"""{selection}"""",
    placeholders: ["selection"],
  },
  {
    id: "translate-fr",
    name: "Translate to French",
    systemMessage: "Translate the text to French accurately while preserving tone.",
    userMessageTemplate: "Translate to French:\n"""{selection}"""",
    placeholders: ["selection"],
  },
  {
    id: "translate-zh",
    name: "Translate to Chinese",
    systemMessage: "Translate the text to Simplified Chinese accurately while preserving tone.",
    userMessageTemplate: "Translate to Chinese:\n"""{selection}"""",
    placeholders: ["selection"],
  },
];

/**
 * Execute a custom AI prompt against the document.
 */
export async function executeCustomPrompt(
  prompt: CustomPrompt,
  variables: Record<string, string>,
  document: DocumentContext
): Promise<BlockGenerationResult> {
  const client = getAIClient();

  let userMessage = prompt.userMessageTemplate;

  // Replace placeholders
  for (const [key, value] of Object.entries(variables)) {
    userMessage = userMessage.replace(
      new RegExp(`\\{${key}\\}`, "g"),
      value
    );
  }

  // Inject document context if {document} is a placeholder
  if (prompt.placeholders.includes("document")) {
    const docContent = serializeBlocks(document.blocks.slice(0, 20));
    userMessage = userMessage.replace(
      /\{document\}/g,
      docContent
    );
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${prompt.systemMessage}\nOutput ONLY the result content, no meta-commentary.`,
    },
    { role: "user", content: userMessage },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 2048,
    temperature: 0.6,
  });

  return {
    blocks: [
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "paragraph",
        content: response.content.trim(),
      },
    ],
    response,
  };
}

/**
 * Stream a custom prompt.
 */
export async function* streamCustomPrompt(
  prompt: CustomPrompt,
  variables: Record<string, string>,
  document: DocumentContext
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  let userMessage = prompt.userMessageTemplate;
  for (const [key, value] of Object.entries(variables)) {
    userMessage = userMessage.replace(
      new RegExp(`\\{${key}\\}`, "g"),
      value
    );
  }

  if (prompt.placeholders.includes("document")) {
    const docContent = serializeBlocks(document.blocks.slice(0, 20));
    userMessage = userMessage.replace(/\{document\}/g, docContent);
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${prompt.systemMessage}\nOutput ONLY the result content.`,
    },
    { role: "user", content: userMessage },
  ];

  yield* client.stream({
    messages,
    maxTokens: 2048,
    temperature: 0.6,
    stream: true,
  });
}
