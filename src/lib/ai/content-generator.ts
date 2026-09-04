import {
  getAIClient,
  type AICompletionResponse,
  type ChatMessage,
  type StreamChunk,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContentFormat = "markdown" | "html" | "plain-text" | "json";

export interface GenerationOptions {
  format?: ContentFormat;
  maxLength?: number;
  tone?: string;
  audience?: string;
  provider?: "openai" | "anthropic" | "gemini";
  temperature?: number;
}

export interface OutlineItem {
  title: string;
  level: number;
  description?: string;
  subsections?: OutlineItem[];
}

export interface GeneratedContent {
  content: string;
  response: AICompletionResponse;
}

export interface BlogPostOptions extends GenerationOptions {
  title?: string;
  keywords?: string[];
  wordCount?: number;
  includeImages?: boolean;
  includeToc?: boolean;
  style?: "listicle" | "how-to" | "opinion" | "tutorial" | "news";
}

export interface DocumentationOptions extends GenerationOptions {
  projectName?: string;
  apiVersion?: string;
  includeExamples?: boolean;
  includeInstallation?: boolean;
  sections?: string[];
}

export interface MeetingNotesOptions extends GenerationOptions {
  includeActionItems?: boolean;
  includeDecisions?: boolean;
  includeFollowUps?: boolean;
  format?: "summary" | "detailed" | "minutes";
}

export interface TechSpecOptions extends GenerationOptions {
  projectName?: string;
  includeArchitecture?: boolean;
  includeDatabase?: boolean;
  includeApis?: boolean;
  includeNonFunctional?: boolean;
}

export interface FAQOptions extends GenerationOptions {
  topic?: string;
  numQuestions?: number;
  style?: "q&a" | "accordion" | "dl-list";
}

export interface EmailOptions extends GenerationOptions {
  purpose?:
    | "cold-outreach"
    | "follow-up"
    | "thank-you"
    | "apology"
    | "request"
    | "introduction";
  recipient?: string;
  sender?: string;
  context?: string;
  callToAction?: string;
}

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

function baseSystem(
  format: ContentFormat,
  tone?: string,
  audience?: string
): string {
  const formatInstructions: Record<ContentFormat, string> = {
    markdown: "Output well-structured Markdown.",
    html: "Output semantic HTML5.",
    "plain-text": "Output plain text with no formatting.",
    json: "Output valid JSON.",
  };

  const parts = [
    "You are an expert content writer and technical author.",
    formatInstructions[format ?? "markdown"],
  ];

  if (tone) parts.push("Write in a " + tone + " tone.");
  if (audience) parts.push("Target audience: " + audience + ".");
  parts.push("Output ONLY the content. No meta-commentary or explanations.");

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Generate from outline
// ---------------------------------------------------------------------------

export async function generateFromOutline(
  outline: OutlineItem[],
  options: GenerationOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  function renderOutline(items: OutlineItem[], depth: number): string {
    return items
      .map((item) => {
        const indent = "  ".repeat(depth);
        const heading = "#".repeat(item.level) + " " + item.title;
        const desc = item.description
          ? "\n" + indent + "  > " + item.description
          : "";
        const subs = item.subsections
          ? "\n" + renderOutline(item.subsections, depth + 1)
          : "";
        return indent + heading + desc + subs;
      })
      .join("\n\n");
  }

  const outlineText = renderOutline(outline, 0);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: baseSystem(
        options.format ?? "markdown",
        options.tone,
        options.audience
      ),
    },
    {
      role: "user",
      content:
        "Generate complete content following this outline:\n\n" +
        outlineText +
        "\n\nWrite full, detailed content for each section. Do not use placeholders. Output ONLY the document content.",
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options.maxLength ?? 8192,
    temperature: options.temperature ?? 0.7,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Generate from prompt
// ---------------------------------------------------------------------------

export async function generateFromPrompt(
  prompt: string,
  context?: { existingContent?: string; instructions?: string },
  options: GenerationOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: baseSystem(
        options.format ?? "markdown",
        options.tone,
        options.audience
      ),
    },
  ];

  if (context?.existingContent) {
    messages.push({
      role: "user",
      content:
        "Existing document content:\n---\n" +
        context.existingContent.slice(0, 4000) +
        "\n---",
    });
    messages.push({ role: "assistant", content: "I see the existing content." });
  }

  if (context?.instructions) {
    messages.push({
      role: "user",
      content: "Additional instructions: " + context.instructions,
    });
    messages.push({ role: "assistant", content: "Understood." });
  }

  messages.push({ role: "user", content: prompt });

  const response = await client.complete({
    messages,
    maxTokens: options.maxLength ?? 4096,
    temperature: options.temperature ?? 0.7,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Blog post generator
// ---------------------------------------------------------------------------

export async function generateBlogPost(
  title: string,
  options: BlogPostOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  const wordCount = options.wordCount ?? 1200;
  const styleInstructions: Record<string, string> = {
    listicle: "Write as a listicle with numbered items and engaging commentary.",
    "how-to": "Write as a step-by-step how-to guide with clear instructions.",
    opinion: "Write as an opinion piece with strong thesis and supporting arguments.",
    tutorial: "Write as an in-depth tutorial with examples and explanations.",
    news: "Write as a news article with inverted pyramid structure.",
  };

  const parts = [
    'Write a blog post titled "' + title + '".',
    "Target approximately " + String(wordCount) + " words.",
    styleInstructions[options.style ?? "how-to"] ?? styleInstructions["how-to"],
  ];

  if (options.keywords?.length) {
    parts.push(
      "Incorporate these keywords naturally: " + options.keywords.join(", ") + "."
    );
  }
  if (options.includeImages) {
    parts.push(
      "Include markdown image placeholders with descriptive alt text at relevant points."
    );
  }
  if (options.includeToc) {
    parts.push("Start with a table of contents.");
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: baseSystem(
        "markdown",
        options.tone ?? "professional",
        options.audience ?? "general readers"
      ),
    },
    { role: "user", content: parts.join(" ") },
  ];

  const response = await client.complete({
    messages,
    maxTokens: Math.max(wordCount * 2, options.maxLength ?? 8192),
    temperature: options.temperature ?? 0.7,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Documentation generator
// ---------------------------------------------------------------------------

export async function generateDocumentation(
  description: string,
  options: DocumentationOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  const sectionList = [
    "Introduction / Overview",
    "Installation",
    "Quick Start",
    "API Reference",
    "Configuration",
    "Examples",
    "Troubleshooting",
    "FAQ",
  ];

  const activeSections = options.sections ?? sectionList;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: baseSystem(
        options.format ?? "markdown",
        options.tone ?? "technical",
        options.audience ?? "developers"
      ),
    },
    {
      role: "user",
      content:
        "Generate comprehensive technical documentation.\n\n" +
        "Project: " + (options.projectName ?? "Untitled Project") + "\n" +
        "Version: " + (options.apiVersion ?? "1.0.0") + "\n\n" +
        "Description:\n" + description + "\n\n" +
        "Include these sections: " + activeSections.join(", ") + ".\n" +
        (options.includeExamples !== false
          ? "Include practical code examples in each section.\n"
          : "") +
        (options.includeInstallation !== false
          ? "Include installation instructions for npm, yarn, and pnpm.\n"
          : "") +
        "Output well-structured Markdown documentation.",
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options.maxLength ?? 12288,
    temperature: options.temperature ?? 0.3,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Meeting notes from transcript
// ---------------------------------------------------------------------------

export async function generateMeetingNotes(
  transcript: string,
  options: MeetingNotesOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  const formatInstructions: Record<string, string> = {
    summary: "Provide a brief executive summary with key points only.",
    detailed: "Provide detailed notes with full context for each topic discussed.",
    minutes:
      "Format as formal meeting minutes with agenda items, discussions, and outcomes.",
  };

  const parts = [
    formatInstructions[options.format ?? "summary"],
    "Include speaker attributions where possible.",
  ];

  if (options.includeActionItems !== false) {
    parts.push("List all action items with assigned owners and deadlines.");
  }
  if (options.includeDecisions !== false) {
    parts.push("Clearly list all decisions made during the meeting.");
  }
  if (options.includeFollowUps) {
    parts.push("Include follow-up items and next steps.");
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an expert meeting note-taker. Output well-structured meeting notes in Markdown. " +
        parts.join(" ") +
        " Output ONLY the formatted notes.",
    },
    {
      role: "user",
      content:
        "Generate meeting notes from this transcript:\n\n---\n" +
        transcript +
        "\n---",
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options.maxLength ?? 4096,
    temperature: options.temperature ?? 0.3,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Technical spec from description
// ---------------------------------------------------------------------------

export async function generateTechSpec(
  featureDescription: string,
  options: TechSpecOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  const sections = [
    "## Overview",
    "## Requirements",
    "## Architecture",
    "## Data Model",
    "## API Design",
    "## Implementation Plan",
    "## Non-Functional Requirements",
    "## Testing Strategy",
    "## Risks & Mitigations",
  ];

  const parts = [
    "Project: " + (options.projectName ?? "Project"),
    "Feature: " + featureDescription,
    "",
    "Write a comprehensive technical specification covering:",
  ];

  if (options.includeArchitecture !== false)
    parts.push("- System architecture and component design");
  if (options.includeDatabase !== false)
    parts.push("- Database schema and data model");
  if (options.includeApis !== false)
    parts.push("- API endpoints and contracts");
  if (options.includeNonFunctional !== false)
    parts.push(
      "- Performance, security, and scalability requirements"
    );

  parts.push("- Implementation timeline and milestones");
  parts.push("- Testing approach");
  parts.push("- Known risks and mitigation strategies");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a senior software architect. Write detailed technical specifications in Markdown. " +
        "Use the following section structure:\n" +
        sections.join("\n") +
        "\nInclude diagrams described in text or Mermaid syntax where appropriate. " +
        "Output ONLY the specification document.",
    },
    { role: "user", content: parts.join("\n") },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options.maxLength ?? 8192,
    temperature: options.temperature ?? 0.3,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// FAQ generator
// ---------------------------------------------------------------------------

export async function generateFAQ(
  topicDescription: string,
  options: FAQOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  const numQuestions = options.numQuestions ?? 10;

  const formatInstructions: Record<string, string> = {
    "q&a": "Format as Q: / A: pairs.",
    accordion: "Format as accordion-style headings with answers below.",
    "dl-list": "Format as an HTML-style definition list with <dt> and <dd>.",
  };

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a technical writer who creates clear, helpful FAQs. " +
        (formatInstructions[options.style ?? "q&a"]) +
        " Generate " +
        String(numQuestions) +
        " relevant questions that users commonly ask. Provide thorough, accurate answers. Output ONLY the FAQ content.",
    },
    {
      role: "user",
      content: "Generate a FAQ for: " + topicDescription,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options.maxLength ?? 4096,
    temperature: options.temperature ?? 0.5,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Email draft generator
// ---------------------------------------------------------------------------

export async function generateEmailDraft(
  subject: string,
  keyPoints: string[],
  options: EmailOptions = {}
): Promise<GeneratedContent> {
  const client = getAIClient();

  const purposeDescriptions: Record<string, string> = {
    "cold-outreach":
      "Write a cold outreach email that is concise, personalized, and value-driven.",
    "follow-up": "Write a polite follow-up email referencing previous contact.",
    "thank-you": "Write a warm thank-you email that feels genuine.",
    apology:
      "Write a professional apology email that takes responsibility and offers a solution.",
    request: "Write a clear request email that is polite and specific.",
    introduction:
      "Write a professional introduction email making a first connection.",
  };

  const parts = [
    purposeDescriptions[options.purpose ?? "request"],
    'Subject line: "' + subject + '"',
    "Key points to cover: " + keyPoints.join("; "),
  ];

  if (options.recipient) parts.push("Recipient: " + options.recipient);
  if (options.sender) parts.push("Sender: " + options.sender);
  if (options.context) parts.push("Context: " + options.context);
  if (options.callToAction)
    parts.push("Include a call to action: " + options.callToAction);

  parts.push(
    "Keep the email concise and professional. Output ONLY the email content."
  );

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: baseSystem(
        options.format ?? "plain-text",
        options.tone ?? "professional",
        options.audience ?? "professionals"
      ),
    },
    { role: "user", content: parts.join("\n") },
  ];

  const response = await client.complete({
    messages,
    maxTokens: options.maxLength ?? 1024,
    temperature: options.temperature ?? 0.7,
    provider: options.provider,
  });

  return { content: response.content.trim(), response };
}

// ---------------------------------------------------------------------------
// Streaming content generation
// ---------------------------------------------------------------------------

export async function* streamGenerate(
  prompt: string,
  options: GenerationOptions = {}
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: baseSystem(
        options.format ?? "markdown",
        options.tone,
        options.audience
      ),
    },
    { role: "user", content: prompt },
  ];

  yield* client.stream({
    messages,
    maxTokens: options.maxLength ?? 4096,
    temperature: options.temperature ?? 0.7,
    provider: options.provider,
    stream: true,
  });
}

export async function* streamBlogPost(
  title: string,
  options: BlogPostOptions = {}
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const wordCount = options.wordCount ?? 1200;

  const parts = [
    'Write a blog post titled "' + title + '".',
    "Target approximately " + String(wordCount) + " words.",
    "Style: " + (options.style ?? "how-to") + ".",
  ];

  if (options.keywords?.length) {
    parts.push("Keywords: " + options.keywords.join(", ") + ".");
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: baseSystem(
        "markdown",
        options.tone ?? "professional",
        options.audience ?? "general readers"
      ),
    },
    { role: "user", content: parts.join(" ") },
  ];

  yield* client.stream({
    messages,
    maxTokens: Math.max(wordCount * 2, options.maxLength ?? 8192),
    temperature: options.temperature ?? 0.7,
    provider: options.provider,
    stream: true,
  });
}

// ---------------------------------------------------------------------------
// Content templates
// ---------------------------------------------------------------------------

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  defaultOptions?: GenerationOptions;
}

export const BUILT_IN_TEMPLATES: ContentTemplate[] = [
  {
    id: "blog-howto",
    name: "How-To Blog Post",
    description: "Step-by-step guide format blog post",
    prompt:
      "Write a comprehensive how-to guide about {topic}. Include clear steps, examples, and tips.",
    defaultOptions: { tone: "friendly", format: "markdown" },
  },
  {
    id: "api-docs",
    name: "API Documentation",
    description: "REST API documentation with examples",
    prompt:
      "Write complete API documentation for {endpoint}. Include request/response examples, error codes, and authentication details.",
    defaultOptions: { tone: "technical", format: "markdown" },
  },
  {
    id: "product-desc",
    name: "Product Description",
    description: "Compelling product description for marketing",
    prompt:
      "Write a compelling product description for {product}. Highlight key features, benefits, and a clear call to action.",
    defaultOptions: { tone: "persuasive", format: "markdown" },
  },
  {
    id: "release-notes",
    name: "Release Notes",
    description: "Version release notes template",
    prompt:
      "Write release notes for version {version}. Include new features, improvements, bug fixes, and breaking changes.",
    defaultOptions: { tone: "professional", format: "markdown" },
  },
  {
    id: "readme",
    name: "README.md",
    description: "Project README template",
    prompt:
      "Write a comprehensive README for {project}. Include badges, description, features, installation, usage, API reference, contributing, and license sections.",
    defaultOptions: { tone: "friendly", format: "markdown" },
  },
  {
    id: "changelog",
    name: "Changelog",
    description: "Conventional changelog format",
    prompt:
      "Write a changelog entry following conventional commits format. Group changes by: Added, Changed, Deprecated, Removed, Fixed, Security.",
    defaultOptions: { tone: "neutral", format: "markdown" },
  },
];

export async function generateFromTemplate(
  templateId: string,
  variables: Record<string, string>,
  options?: GenerationOptions
): Promise<GeneratedContent> {
  const template = BUILT_IN_TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error('Template "' + templateId + '" not found.');
  }

  let prompt = template.prompt;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp("\\{" + key + "\\}", "g"), value);
  }

  return generateFromPrompt(prompt, undefined, {
    ...template.defaultOptions,
    ...options,
  });
}
