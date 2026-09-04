import {
  getAIClient,
  type AICompletionResponse,
  type ChatMessage,
  type StreamChunk,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeadingSuggestion {
  /** The proposed heading text. */
  text: string;
  /** Heading level (1-6). */
  level: number;
  /** Confidence score 0-1. */
  confidence: number;
}

export interface TableStructure {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface CodeLanguageDetection {
  language: string;
  confidence: number;
  alternatives: Array<{ language: string; confidence: number }>;
}

export interface AltTextSuggestion {
  altText: string;
  description: string;
}

export interface LinkTitleSuggestion {
  title: string;
  description: string;
}

export interface TOCEntry {
  level: number;
  title: string;
  anchor: string;
}

export interface FormattingOptions {
  provider?: "openai" | "anthropic" | "gemini";
  temperature?: number;
}

// ---------------------------------------------------------------------------
// Auto-format headings
// ---------------------------------------------------------------------------

/**
 * Suggest proper heading hierarchy for a document.
 */
export async function suggestHeadings(
  content: string,
  options?: FormattingOptions
): Promise<HeadingSuggestion[]> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a document formatting expert. Analyze the content and suggest a heading hierarchy.

Rules:
- H1 is used only once for the document title
- H2 for main sections
- H3 for subsections
- Headings should be concise and descriptive
- Maintain logical hierarchy (no skipping levels)

Output a JSON array of headings. Each entry: {"text": "...", "level": N, "confidence": 0.0-1.0}
Output ONLY the JSON array, no markdown fences or explanations.`,
    },
    {
      role: "user",
      content: `Analyze this content and suggest where headings should be placed:

${content.slice(0, 6000)}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 2048,
    temperature: 0.2,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as HeadingSuggestion[];
  } catch {
    return [
      {
        text: "Untitled Section",
        level: 2,
        confidence: 0.5,
      },
    ];
  }
}

/**
 * Fix heading levels in a document to ensure proper hierarchy.
 */
export async function fixHeadingHierarchy(
  content: string,
  options?: FormattingOptions
): Promise<{ content: string; response: AICompletionResponse }> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Fix the heading hierarchy in the following document.
Rules:
- Only one H1 (# title)
- Never skip heading levels (e.g., H2 -> H4 is not allowed)
- Ensure headings are descriptive and parallel in structure
- Preserve all non-heading content exactly as-is
Output ONLY the corrected document.`,
    },
    {
      role: "user",
      content,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 8192,
    temperature: 0.1,
    provider: options?.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Suggest table structure
// ---------------------------------------------------------------------------

/**
 * Analyze content and suggest a table structure.
 */
export async function suggestTableStructure(
  content: string,
  options?: FormattingOptions
): Promise<TableStructure> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Analyze the content and determine if it would benefit from a table.
If yes, propose a table structure with headers and rows populated from the data in the text.

Output JSON: {"headers": ["col1", "col2"], "rows": [["val1", "val2"]], "caption": "optional caption"}
Output ONLY the JSON, no markdown fences.`,
    },
    {
      role: "user",
      content: `Analyze this content and suggest a table if appropriate:

${content.slice(0, 4000)}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 2048,
    temperature: 0.2,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as TableStructure;
  } catch {
    return { headers: ["Column 1", "Column 2"], rows: [["", ""]] };
  }
}

/**
 * Convert structured data into a Markdown table.
 */
export function toMarkdownTable(structure: TableStructure): string {
  const headerLine = `| ${structure.headers.join(" | ")} |`;
  const separator = `| ${structure.headers.map(() => "---").join(" | ")} |`;
  const dataLines = structure.rows
    .map((row) => `| ${row.join(" | ")} |`)
    .join("\n");

  const parts = [headerLine, separator, dataLines];

  if (structure.caption) {
    parts.unshift(`*${structure.caption}*`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Code block language detection
// ---------------------------------------------------------------------------

/**
 * Detect the programming language of a code snippet.
 */
export async function detectCodeLanguage(
  code: string,
  options?: FormattingOptions
): Promise<CodeLanguageDetection> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Detect the programming language of the following code snippet.
Consider: syntax, keywords, imports, file structure conventions.

Output JSON: {"language": "...", "confidence": 0.0-1.0, "alternatives": [{"language": "...", "confidence": 0.0-1.0}]}
Output ONLY the JSON, no fences.`,
    },
    {
      role: "user",
      content: code.slice(0, 3000),
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 256,
    temperature: 0.1,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as CodeLanguageDetection;
  } catch {
    return {
      language: "plaintext",
      confidence: 0.5,
      alternatives: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Image alt text generation
// ---------------------------------------------------------------------------

/**
 * Generate descriptive alt text for an image based on context.
 */
export async function generateAltText(
  imageDescription: string,
  context?: {
    surroundingText?: string;
    documentTitle?: string;
    imagePosition?: string;
  },
  options?: FormattingOptions
): Promise<AltTextSuggestion> {
  const client = getAIClient();

  const parts: string[] = [
    `Generate descriptive alt text for an image.`,
    `Image description/context: ${imageDescription}`,
  ];

  if (context?.surroundingText) {
    parts.push(`Surrounding text: ${context.surroundingText.slice(0, 500)}`);
  }
  if (context?.documentTitle) {
    parts.push(`Document: ${context.documentTitle}`);
  }
  if (context?.imagePosition) {
    parts.push(`Position: ${context.imagePosition}`);
  }

  parts.push("Alt text should be concise (under 125 characters) but descriptive.");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Generate accessibility-compliant alt text for images.
The alt text should:
- Be concise (under 125 characters when possible)
- Describe the content and purpose of the image
- Not start with "Image of" or "Picture of"
- Be useful for screen reader users

Output JSON: {"altText": "...", "description": "longer description"}
Output ONLY the JSON, no fences.`,
    },
    { role: "user", content: parts.join("\n") },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 256,
    temperature: 0.3,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as AltTextSuggestion;
  } catch {
    return {
      altText: imageDescription.slice(0, 120),
      description: imageDescription,
    };
  }
}

// ---------------------------------------------------------------------------
// Link title generation
// ---------------------------------------------------------------------------

/**
 * Generate descriptive link titles for better UX and SEO.
 */
export async function generateLinkTitle(
  url: string,
  surroundingText: string,
  options?: FormattingOptions
): Promise<LinkTitleSuggestion> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Generate a descriptive title for a hyperlink.
The title should:
- Describe the destination or purpose of the link
- Be concise (under 60 characters)
- Be helpful for accessibility and SEO
- Not be generic like "click here" or "link"

Output JSON: {"title": "...", "description": "brief description of the link destination"}
Output ONLY the JSON, no fences.`,
    },
    {
      role: "user",
      content: `URL: ${url}
Surrounding text: ${surroundingText.slice(0, 500)}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 256,
    temperature: 0.3,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as LinkTitleSuggestion;
  } catch {
    return {
      title: "Link",
      description: `Link to ${new URL(url).hostname}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Table of contents generation
// ---------------------------------------------------------------------------

/**
 * Generate a table of contents from document content.
 */
export async function generateTOC(
  content: string,
  options?: FormattingOptions
): Promise<TOCEntry[]> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Generate a table of contents for the document.
Extract or infer headings and their levels.
Create GitHub-style anchor links (lowercase, spaces to hyphens, remove special chars).

Output JSON array: [{"level": 2, "title": "Section Name", "anchor": "section-name"}]
Output ONLY the JSON array, no fences.`,
    },
    {
      role: "user",
      content: content.slice(0, 8000),
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 4096,
    temperature: 0.2,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    return JSON.parse(cleaned) as TOCEntry[];
  } catch {
    return [];
  }
}

/**
 * Render a TOC as Markdown.
 */
export function renderTOCMarkdown(entries: TOCEntry[]): string {
  return entries
    .map((entry) => {
      const indent = "  ".repeat(entry.level - 1);
      return `${indent}- [${entry.title}](#${entry.anchor})`;
    })
    .join("\n");
}

/**
 * Render a TOC as HTML.
 */
export function renderTOCHTML(entries: TOCEntry[]): string {
  if (entries.length === 0) return "";

  let html = '<nav class="table-of-contents">\n';
  let currentLevel = entries[0]?.level ?? 1;

  for (const entry of entries) {
    while (currentLevel < entry.level) {
      html += "  ".repeat(currentLevel) + "<ul>\n";
      currentLevel++;
    }
    while (currentLevel > entry.level) {
      currentLevel--;
      html += "  ".repeat(currentLevel) + "</ul>\n";
    }
    html += `${"  ".repeat(currentLevel)}<li><a href="#${entry.anchor}">${entry.title}</a></li>\n`;
  }

  while (currentLevel > 1) {
    currentLevel--;
    html += "  ".repeat(currentLevel) + "</ul>\n";
  }

  html += "</nav>";
  return html;
}

// ---------------------------------------------------------------------------
// Full document formatting pass
// ---------------------------------------------------------------------------

export interface FormatPassResult {
  headings: HeadingSuggestion[];
  toc: TOCEntry[];
  codeBlocks: Array<{ index: number; detection: CodeLanguageDetection }>;
  aiFormattedContent: string;
  response: AICompletionResponse;
}

/**
 * Run a complete AI formatting pass on a document.
 */
export async function formatDocument(
  content: string,
  options?: FormattingOptions & {
    fixHeadings?: boolean;
    addToc?: boolean;
    detectCode?: boolean;
    generalCleanup?: boolean;
  }
): Promise<FormatPassResult> {
  const client = getAIClient();
  const opts = {
    fixHeadings: true,
    addToc: true,
    detectCode: true,
    generalCleanup: true,
    ...options,
  };

  // Run independent operations in parallel
  const [headings, toc] = await Promise.all([
    opts.fixHeadings ? suggestHeadings(content, options) : Promise.resolve([]),
    opts.addToc ? generateTOC(content, options) : Promise.resolve([]),
  ]);

  // Detect code block languages
  const codeBlocks: Array<{ index: number; detection: CodeLanguageDetection }> = [];
  if (opts.detectCode) {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    let idx = 0;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (!match[1] && match[2]?.trim()) {
        const detection = await detectCodeLanguage(match[2], options);
        codeBlocks.push({ index: idx, detection });
      }
      idx++;
    }
  }

  // General formatting cleanup
  let aiFormattedContent = content;
  let response: AICompletionResponse;

  if (opts.generalCleanup) {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Clean up and format this document:
- Fix inconsistent spacing
- Remove trailing whitespace
- Ensure proper blank lines between sections
- Fix list formatting
- Normalize punctuation
- Ensure code blocks have language identifiers
Output ONLY the cleaned document.`,
      },
      { role: "user", content: content.slice(0, 12_000) },
    ];

    response = await client.complete({
      messages,
      maxTokens: 12_288,
      temperature: 0.1,
      provider: options?.provider,
    });

    aiFormattedContent = response.content.trim();
  } else {
    response = {
      content: "",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: "stop",
      model: "",
      provider: options?.provider ?? "openai",
    };
  }

  return {
    headings,
    toc,
    codeBlocks,
    aiFormattedContent,
    response,
  };
}

// ---------------------------------------------------------------------------
// Streaming formatting
// ---------------------------------------------------------------------------

/**
 * Stream a formatting suggestion for real-time feedback.
 */
export async function* streamFormatSuggestion(
  content: string,
  instruction: string,
  options?: FormattingOptions
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a document formatting expert.
Apply the user's formatting instruction to the document.
Output ONLY the formatted content.`,
    },
    {
      role: "user",
      content: `Instruction: ${instruction}

Document:
${content.slice(0, 8000)}`,
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: 8192,
    temperature: 0.2,
    provider: options?.provider,
    stream: true,
  });
}
