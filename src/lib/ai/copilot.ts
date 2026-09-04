import {
  getAIClient,
  type AICompletionResponse,
  type ChatMessage,
  type StreamChunk,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CopilotMode =
  | "inline-complete"
  | "block-generate"
  | "code-complete"
  | "data-table"
  | "chart-suggest"
  | "multi-step";

export interface CopilotContext {
  documentTitle?: string;
  currentBlock: string;
  textBefore: string;
  textAfter: string;
  surroundingBlocks: Array<{ type: string; content: string }>;
  selectedText?: string;
  blockType: string;
}

export interface CopilotRequest {
  context: CopilotContext;
  mode: CopilotMode;
  prompt?: string;
  provider?: "openai" | "anthropic" | "gemini";
  maxTokens?: number;
  temperature?: number;
}

export interface CopilotSuggestion {
  id: string;
  text: string;
  confidence: number;
  mode: CopilotMode;
  metadata?: Record<string, unknown>;
}

export interface CodeCompletionResult {
  code: string;
  language: string;
  explanation?: string;
  cursorPosition: number;
}

export interface DataTableResult {
  headers: string[];
  rows: string[][];
  description: string;
}

export interface ChartSuggestion {
  type: "bar" | "line" | "pie" | "scatter" | "area" | "table";
  title: string;
  description: string;
  data: Record<string, unknown>;
  rationale: string;
}

export interface MultiStepResult {
  steps: Array<{
    description: string;
    content: string;
    blockType: string;
  }>;
  response: AICompletionResponse;
}

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

function buildContextString(context: CopilotContext): string {
  const parts: string[] = [];

  if (context.documentTitle) {
    parts.push("Document: " + context.documentTitle);
  }

  parts.push("Block type: " + context.blockType);
  parts.push("Text before cursor: " + context.textBefore);
  parts.push("Text after cursor: " + context.textAfter);

  if (context.surroundingBlocks.length > 0) {
    const blocksStr = context.surroundingBlocks
      .map((b) => "[" + b.type + "] " + b.content.slice(0, 200))
      .join("\n");
    parts.push("Surrounding blocks:\n" + blocksStr);
  }

  if (context.selectedText) {
    parts.push("Selected text: " + context.selectedText);
  }

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Inline completion (ghost text)
// ---------------------------------------------------------------------------

export async function getInlineCompletion(
  request: CopilotRequest
): Promise<CopilotSuggestion> {
  const client = getAIClient();
  const contextStr = buildContextString(request.context);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are an intelligent code and text completion engine.",
        "Generate a short completion for what the user is currently typing.",
        "The completion should be a natural continuation.",
        "Keep completions concise (1-3 sentences for text, 1-10 lines for code).",
        "Output ONLY the completion text. No explanations.",
      ].join(" "),
    },
    {
      role: "user",
      content: "Context:\n" + contextStr + "\n\nComplete the text at the cursor position:",
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: request.maxTokens ?? 128,
    temperature: request.temperature ?? 0.3,
    provider: request.provider,
  });

  return {
    id: "copilot-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    text: response.content.trim(),
    confidence: 0.8,
    mode: "inline-complete",
  };
}

export async function* streamInlineCompletion(
  request: CopilotRequest
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();
  const contextStr = buildContextString(request.context);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are an intelligent completion engine. Generate a short completion for what the user is currently typing. Output ONLY the completion text.",
    },
    {
      role: "user",
      content: "Context:\n" + contextStr + "\n\nComplete the text at the cursor position:",
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: request.maxTokens ?? 128,
    temperature: request.temperature ?? 0.3,
    provider: request.provider,
    stream: true,
  });
}

// ---------------------------------------------------------------------------
// Block-level generation
// ---------------------------------------------------------------------------

export async function generateBlockContent(
  request: CopilotRequest & { blockType: string }
): Promise<CopilotSuggestion> {
  const client = getAIClient();
  const contextStr = buildContextString(request.context);

  const guidance: Record<string, string> = {
    paragraph: "Write a well-crafted paragraph.",
    heading: "Write a clear, descriptive heading.",
    bulletList: "Write a bulleted list (3-7 items).",
    numberedList: "Write a numbered list (3-7 items).",
    checkList: "Write a task list (3-5 items).",
    codeBlock: "Write a code block with appropriate language.",
    quote: "Write an impactful quote or blockquote.",
    callout: "Write a callout note with appropriate icon.",
    table: "Write a Markdown table.",
  };

  const instruction = guidance[request.blockType] ?? "Generate appropriate content for this block type.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are an AI content generator for a document editor. " + instruction + " Use the surrounding context for relevance. Output ONLY the block content.",
    },
    {
      role: "user",
      content: "Context:\n" + contextStr + "\n\n" + (request.prompt ? "Instructions: " + request.prompt + "\n\n" : "") + "Generate content for a " + request.blockType + " block:",
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: request.maxTokens ?? 1024,
    temperature: request.temperature ?? 0.6,
    provider: request.provider,
  });

  return {
    id: "block-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    text: response.content.trim(),
    confidence: 0.85,
    mode: "block-generate",
    metadata: { blockType: request.blockType },
  };
}

// ---------------------------------------------------------------------------
// Code completion in code blocks
// ---------------------------------------------------------------------------

export async function completeCode(
  context: CopilotContext,
  options?: {
    language?: string;
    maxLines?: number;
    provider?: "openai" | "anthropic" | "gemini";
  }
): Promise<CodeCompletionResult> {
  const client = getAIClient();
  const contextStr = buildContextString(context);
  const language = options?.language ?? "auto-detect";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are an expert code completion engine.",
        "Complete the code at the cursor position.",
        "- Maintain consistent coding style",
        "- Use appropriate variable names",
        "- Include proper error handling when relevant",
        "- Follow language idioms and best practices",
        "Output ONLY the code to insert. No comments or explanations.",
      ].join("\n"),
    },
    {
      role: "user",
      content: "Language: " + language + "\n\nContext:\n" + contextStr,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options?.maxLines ? options.maxLines * 8 : 512,
    temperature: 0.2,
    provider: options?.provider,
  });

  const code = response.content.trim();

  // Detect language if auto
  let detectedLang = language;
  if (language === "auto-detect") {
    const langMatch = code.match(
      /^(import |const |let |var |function |class |def |pub |fn |func |#include)/m
    );
    if (langMatch) {
      const langMap: Record<string, string> = {
        import: "typescript",
        const: "typescript",
        let: "typescript",
        var: "javascript",
        function: "javascript",
        class: "typescript",
        def: "python",
        pub: "rust",
        fn: "rust",
        func: "go",
        "#include": "c",
      };
      detectedLang = langMap[langMatch[1]?.trim() ?? ""] ?? "plaintext";
    }
  }

  return {
    code,
    language: detectedLang,
    cursorPosition: code.length,
  };
}

// ---------------------------------------------------------------------------
// Data table generation
// ---------------------------------------------------------------------------

export async function generateDataTable(
  context: CopilotContext,
  options?: {
    description?: string;
    numColumns?: number;
    numRows?: number;
    provider?: "openai" | "anthropic" | "gemini";
  }
): Promise<DataTableResult> {
  const client = getAIClient();
  const contextStr = buildContextString(context);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are a data table generator.",
        "Generate a well-structured data table based on the context.",
        "- Create meaningful column headers",
        "- Populate with realistic sample data",
        "- Use consistent formatting within columns",
        "Output JSON: {\"headers\": [...], \"rows\": [[...], ...], \"description\": \"...\"}",
        "Output ONLY the JSON, no fences.",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "Context:\n" + contextStr,
        options?.description ? "Description: " + options.description : "",
        "Columns: " + String(options?.numColumns ?? 4),
        "Rows: " + String(options?.numRows ?? 5),
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 2048,
    temperature: 0.5,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as DataTableResult;
  } catch {
    return {
      headers: ["Column 1", "Column 2", "Column 3"],
      rows: [
        ["Data 1", "Data 2", "Data 3"],
        ["Data 4", "Data 5", "Data 6"],
      ],
      description: "Generated table",
    };
  }
}

// ---------------------------------------------------------------------------
// Chart/diagram suggestions
// ---------------------------------------------------------------------------

export async function suggestChart(
  context: CopilotContext,
  options?: {
    provider?: "openai" | "anthropic" | "gemini";
  }
): Promise<ChartSuggestion> {
  const client = getAIClient();
  const contextStr = buildContextString(context);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are a data visualization expert.",
        "Analyze the content and suggest the best chart type to visualize the data.",
        "Consider: data type, number of dimensions, comparison vs trend vs composition.",
        "Output JSON:",
        "{",
        '  "type": "bar|line|pie|scatter|area|table",',
        '  "title": "chart title",',
        '  "description": "what the chart shows",',
        '  "data": { ... },',
        '  "rationale": "why this chart type"',
        "}",
        "Output ONLY the JSON, no fences.",
      ].join("\n"),
    },
    {
      role: "user",
      content: "Analyze this content and suggest a visualization:\n\n" + contextStr,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 1024,
    temperature: 0.3,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as ChartSuggestion;
  } catch {
    return {
      type: "table",
      title: "Data Table",
      description: "Tabular representation of the data",
      data: {},
      rationale: "Best default for unstructured data",
    };
  }
}

// ---------------------------------------------------------------------------
// Multi-step completions
// ---------------------------------------------------------------------------

export async function multiStepComplete(
  request: CopilotRequest & { steps: number }
): Promise<MultiStepResult> {
  const client = getAIClient();
  const contextStr = buildContextString(request.context);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are a document content planner and writer.",
        "Break the task into " + String(request.steps) + " logical steps.",
        "For each step, generate the content and specify the block type.",
        "Output JSON array:",
        '[{"description": "what this step does", "content": "generated content", "blockType": "paragraph|heading|bulletList|codeBlock|..."}]',
        "Output ONLY the JSON array, no fences.",
      ].join("\n"),
    },
    {
      role: "user",
      content: "Context:\n" + contextStr + "\n\n" + (request.prompt ?? "Generate content in " + String(request.steps) + " steps:"),
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: request.maxTokens ?? 4096,
    temperature: request.temperature ?? 0.6,
    provider: request.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    const steps = JSON.parse(cleaned) as MultiStepResult["steps"];
    return { steps, response };
  } catch {
    return {
      steps: [
        {
          description: "Generated content",
          content: response.content.trim(),
          blockType: "paragraph",
        },
      ],
      response,
    };
  }
}

// ---------------------------------------------------------------------------
// Context-aware suggestions (high-level copilot)
// ---------------------------------------------------------------------------

export async function getContextualSuggestion(
  request: CopilotRequest
): Promise<CopilotSuggestion> {
  switch (request.mode) {
    case "inline-complete":
      return getInlineCompletion(request);
    case "block-generate":
      return generateBlockContent({
        ...request,
        blockType: request.context.blockType,
      });
    case "code-complete": {
      const result = await completeCode(request.context, {
        provider: request.provider,
      });
      return {
        id: "code-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        text: result.code,
        confidence: 0.85,
        mode: "code-complete",
        metadata: { language: result.language },
      };
    }
    case "data-table": {
      const table = await generateDataTable(request.context, {
        description: request.prompt,
        provider: request.provider,
      });
      return {
        id: "table-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        text: formatTableAsMarkdown(table),
        confidence: 0.8,
        mode: "data-table",
        metadata: { headers: table.headers, rowCount: table.rows.length },
      };
    }
    case "chart-suggest": {
      const chart = await suggestChart(request.context, {
        provider: request.provider,
      });
      return {
        id: "chart-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        text: chart.description,
        confidence: 0.75,
        mode: "chart-suggest",
        metadata: chart,
      };
    }
    case "multi-step": {
      const result = await multiStepComplete({
        ...request,
        steps: 5,
      });
      return {
        id: "multi-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        text: result.steps.map((s) => s.content).join("\n\n"),
        confidence: 0.8,
        mode: "multi-step",
        metadata: { steps: result.steps },
      };
    }
    default: {
      const _exhaustive: never = request.mode;
      throw new Error("Unknown copilot mode: " + String(_exhaustive));
    }
  }
}

function formatTableAsMarkdown(table: DataTableResult): string {
  const header = "| " + table.headers.join(" | ") + " |";
  const sep = "| " + table.headers.map(() => "---").join(" | ") + " |";
  const rows = table.rows.map((r) => "| " + r.join(" | ") + " |").join("\n");
  return header + "\n" + sep + "\n" + rows;
}

// ---------------------------------------------------------------------------
// Streaming copilot
// ---------------------------------------------------------------------------

export async function* streamCopilot(
  request: CopilotRequest
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();
  const contextStr = buildContextString(request.context);

  const modeInstructions: Record<CopilotMode, string> = {
    "inline-complete": "Complete what the user is currently typing. Output ONLY the completion.",
    "block-generate": "Generate content for a " + request.context.blockType + " block.",
    "code-complete": "Complete the code at the cursor position. Output ONLY the code.",
    "data-table": "Generate a data table as Markdown.",
    "chart-suggest": "Describe what chart would best visualize this data.",
    "multi-step": "Generate comprehensive content covering all aspects of the topic.",
  };

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are an AI copilot in a document editor. " + modeInstructions[request.mode] + " Use context for relevance. Output ONLY content.",
    },
    {
      role: "user",
      content: "Context:\n" + contextStr + (request.prompt ? "\n\nPrompt: " + request.prompt : ""),
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: request.maxTokens ?? 1024,
    temperature: request.temperature ?? 0.5,
    provider: request.provider,
    stream: true,
  });
}
