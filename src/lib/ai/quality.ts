import {
  getAIClient,
  type AICompletionResponse,
  type ChatMessage,
  type StreamChunk,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReadabilityScore {
  /** Flesch-Kincaid Grade Level (0-20+). */
  gradeLevel: number;
  /** Flesch Reading Ease (0-100). Higher = easier. */
  readingEase: number;
  /** Coleman-Liau Index. */
  colemanLiauIndex: number;
  /** Automated Readability Index. */
  autoReadabilityIndex: number;
  /** Human-readable grade label. */
  gradeLabel: string;
  /** Human-readable ease label. */
  easeLabel: string;
  /** Estimated reading time in minutes. */
  readingTimeMinutes: number;
  /** Word count. */
  wordCount: number;
  /** Sentence count. */
  sentenceCount: number;
  /** Paragraph count. */
  paragraphCount: number;
  /** Average words per sentence. */
  avgWordsPerSentence: number;
  /** Average syllables per word. */
  avgSyllablesPerWord: number;
}

export interface ToneConsistencyResult {
  /** Overall detected tone. */
  overallTone: string;
  /** Consistency score 0-1. */
  consistencyScore: number;
  /** Per-paragraph tone analysis. */
  paragraphTones: Array<{
    index: number;
    tone: string;
    confidence: number;
    startOffset: number;
    endOffset: number;
  }>;
  /** Inconsistencies found. */
  inconsistencies: Array<{
    paragraphIndex: number;
    expectedTone: string;
    actualTone: string;
    suggestion: string;
  }>;
}

export interface GrammarIssue {
  id: string;
  type: "grammar" | "spelling" | "punctuation" | "style" | "clarity";
  message: string;
  offset: number;
  length: number;
  originalText: string;
  suggestedFix: string;
  severity: "error" | "warning" | "info";
  rule?: string;
}

export interface GrammarCheckResult {
  issues: GrammarIssue[];
  score: number; // 0-100
  totalIssues: number;
  byType: Record<string, number>;
}

export interface PlagiarismCheckResult {
  /** Overall originality score 0-1 (1 = fully original). */
  originalityScore: number;
  /** Flagged passages. */
  flaggedPassages: Array<{
    text: string;
    offset: number;
    length: number;
    similarity: number;
    possibleSource?: string;
    context: string;
  }>;
  /** Summary. */
  summary: string;
}

export interface SEOSuggestion {
  id: string;
  category: "title" | "meta" | "headings" | "keywords" | "structure" | "readability" | "links";
  severity: "critical" | "important" | "minor";
  message: string;
  current?: string;
  suggested?: string;
}

export interface SEOAnalysisResult {
  score: number; // 0-100
  suggestions: SEOSuggestion[];
  keywordDensity: Record<string, number>;
  headingStructure: Array<{ level: number; text: string }>;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  readingTime: number;
}

export interface QualityOptions {
  provider?: "openai" | "anthropic" | "gemini";
}

// ---------------------------------------------------------------------------
// Readability scoring
// ---------------------------------------------------------------------------

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length <= 3) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;

  for (const char of cleaned) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Silent e
  if (cleaned.endsWith("e")) count--;

  // -le ending
  if (cleaned.endsWith("le") && cleaned.length > 2 && !vowels.includes(cleaned[cleaned.length - 3] ?? "")) {
    count++;
  }

  return Math.max(count, 1);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
}

function splitWords(text: string): string[] {
  return text
    .split(/\s+/)
    .filter((w) => w.replace(/[^a-zA-Z]/g, "").length > 0);
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
}

/**
 * Calculate readability metrics for text.
 */
export function calculateReadability(text: string): ReadabilityScore {
  const words = splitWords(text);
  const sentences = splitSentences(text);
  const paragraphs = splitParagraphs(text);

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphCount = Math.max(paragraphs.length, 1);

  const totalSyllables = words.reduce(
    (sum, w) => sum + countSyllables(w),
    0
  );

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / Math.max(wordCount, 1);

  // Flesch-Kincaid Grade Level
  const gradeLevel =
    0.39 * avgWordsPerSentence +
    11.8 * avgSyllablesPerWord -
    15.59;

  // Flesch Reading Ease
  const readingEase =
    206.835 -
    1.015 * avgWordsPerSentence -
    84.6 * avgSyllablesPerWord;

  // Coleman-Liau Index
  const letters = words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, "").length, 0);
  const L = (letters / Math.max(wordCount, 1)) * 100;
  const S = (sentenceCount / Math.max(wordCount, 1)) * 100;
  const colemanLiauIndex = 0.0588 * L - 0.296 * S - 15.8;

  // Automated Readability Index
  const characters = text.replace(/[^a-zA-Z0-9]/g, "").length;
  const autoRI =
    4.71 * (characters / Math.max(wordCount, 1)) +
    0.5 * avgWordsPerSentence -
    21.43;

  // Grade label
  let gradeLabel: string;
  if (gradeLevel < 1) gradeLabel = "Kindergarten";
  else if (gradeLevel < 2) gradeLabel = "First Grade";
  else if (gradeLevel < 6) gradeLabel = "Elementary School";
  else if (gradeLevel < 9) gradeLabel = "Middle School";
  else if (gradeLevel < 13) gradeLabel = "High School";
  else if (gradeLevel < 17) gradeLabel = "College";
  else gradeLabel = "Graduate Level";

  // Ease label
  let easeLabel: string;
  if (readingEase >= 90) easeLabel = "Very Easy (5th grade)";
  else if (readingEase >= 80) easeLabel = "Easy (6th grade)";
  else if (readingEase >= 70) easeLabel = "Fairly Easy (7th grade)";
  else if (readingEase >= 60) easeLabel = "Standard (8th-9th grade)";
  else if (readingEase >= 50) easeLabel = "Fairly Difficult (10th-12th grade)";
  else if (readingEase >= 30) easeLabel = "Difficult (College)";
  else easeLabel = "Very Difficult (College Graduate)";

  // Reading time (avg 200 wpm)
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return {
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    readingEase: Math.round(Math.max(0, Math.min(100, readingEase)) * 10) / 10,
    colemanLiauIndex: Math.round(colemanLiauIndex * 10) / 10,
    autoReadabilityIndex: Math.round(autoRI * 10) / 10,
    gradeLabel,
    easeLabel,
    readingTimeMinutes,
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Tone consistency check
// ---------------------------------------------------------------------------

export async function checkToneConsistency(
  text: string,
  expectedTone?: string,
  options?: QualityOptions
): Promise<ToneConsistencyResult> {
  const client = getAIClient();
  const paragraphs = splitParagraphs(text);

  if (paragraphs.length === 0) {
    return {
      overallTone: "neutral",
      consistencyScore: 1,
      paragraphTones: [],
      inconsistencies: [],
    };
  }

  // Analyze each paragraph's tone
  const paragraphTones: ToneConsistencyResult["paragraphTones"] = [];

  // Batch analyze for efficiency
  const batchedParagraphs = paragraphs.slice(0, 20); // limit for API efficiency
  const paragraphsText = batchedParagraphs
    .map((p, i) => "[" + i + "] " + p.slice(0, 300))
    .join("\n\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "Analyze the tone of each paragraph.",
        "Detect: formal, casual, professional, friendly, academic, technical, persuasive, neutral, humorous, urgent.",
        "Output JSON array:",
        '[{"index": 0, "tone": "...", "confidence": 0.0-1.0}]',
        "Output ONLY the JSON array, no fences.",
      ].join("\n"),
    },
    {
      role: "user",
      content: paragraphsText,
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
    const tones = JSON.parse(cleaned) as Array<{
      index: number;
      tone: string;
      confidence: number;
    }>;

    let offset = 0;
    for (const t of tones) {
      const para = paragraphs[t.index] ?? "";
      paragraphTones.push({
        index: t.index,
        tone: t.tone,
        confidence: t.confidence,
        startOffset: offset,
        endOffset: offset + para.length,
      });
      offset += para.length + 2; // +2 for \n\n
    }
  } catch {
    // Fallback: mark all as neutral
    let offset = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i] ?? "";
      paragraphTones.push({
        index: i,
        tone: "neutral",
        confidence: 0.5,
        startOffset: offset,
        endOffset: offset + para.length,
      });
      offset += para.length + 2;
    }
  }

  // Determine overall tone (mode)
  const toneCounts = new Map<string, number>();
  for (const pt of paragraphTones) {
    toneCounts.set(pt.tone, (toneCounts.get(pt.tone) ?? 0) + 1);
  }
  const overallTone =
    Array.from(toneCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";

  // Calculate consistency
  const targetTone = expectedTone ?? overallTone;
  const matchingCount = paragraphTones.filter(
    (pt) => pt.tone === targetTone
  ).length;
  const consistencyScore = paragraphTones.length > 0
    ? matchingCount / paragraphTones.length
    : 1;

  // Find inconsistencies
  const inconsistencies: ToneConsistencyResult["inconsistencies"] = [];
  for (const pt of paragraphTones) {
    if (pt.tone !== targetTone && pt.confidence > 0.6) {
      inconsistencies.push({
        paragraphIndex: pt.index,
        expectedTone: targetTone,
        actualTone: pt.tone,
        suggestion: "Consider rewriting to match the " + targetTone + " tone.",
      });
    }
  }

  return {
    overallTone,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
    paragraphTones,
    inconsistencies,
  };
}

// ---------------------------------------------------------------------------
// Grammar and style suggestions
// ---------------------------------------------------------------------------

export async function checkGrammarAndStyle(
  text: string,
  options?: QualityOptions
): Promise<GrammarCheckResult> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are an expert grammar and style checker.",
        "Find all grammar, spelling, punctuation, and style issues.",
        "For each issue, provide:",
        "- type: grammar|spelling|punctuation|style|clarity",
        "- message: explanation",
        "- offset: character offset in the text",
        "- length: number of characters to replace",
        "- originalText: the problematic text",
        "- suggestedFix: the correction",
        "- severity: error|warning|info",
        "- rule: the grammar/style rule violated (optional)",
        "Output JSON:",
        '{"issues": [...], "score": 0-100}',
        "Output ONLY the JSON, no fences.",
      ].join("\n"),
    },
    {
      role: "user",
      content: text.slice(0, 8000),
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 4096,
    temperature: 0.1,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      issues: GrammarIssue[];
      score: number;
    };

    const byType: Record<string, number> = {};
    for (const issue of parsed.issues) {
      byType[issue.type] = (byType[issue.type] ?? 0) + 1;
    }

    return {
      issues: parsed.issues,
      score: parsed.score,
      totalIssues: parsed.issues.length,
      byType,
    };
  } catch {
    return {
      issues: [],
      score: 85,
      totalIssues: 0,
      byType: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Plagiarism detection
// ---------------------------------------------------------------------------

export async function checkPlagiarism(
  text: string,
  options?: QualityOptions
): Promise<PlagiarismCheckResult> {
  const client = getAIClient();

  const sentences = splitSentences(text);
  // Check in batches of 5 sentences
  const batchSize = 5;
  const allFlagged: PlagiarismCheckResult["flaggedPassages"] = [];

  for (let i = 0; i < Math.min(sentences.length, 20); i += batchSize) {
    const batch = sentences.slice(i, i + batchSize);
    const batchText = batch.join(" ");

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: [
          "You are a plagiarism detection assistant.",
          "Analyze the text for potential plagiarism indicators:",
          "- Overly generic or cliched language",
          "- Text that reads like it was copied from common sources",
          "- Inconsistent writing style that suggests mixed sources",
          "- Very common phrases that may be unattributed quotes",
          "Note: You cannot search the web, but flag suspicious patterns.",
          "Output JSON:",
          '{"flaggedPassages": [{"text": "...", "offset": N, "length": N, "similarity": 0.0-1.0, "possibleSource": "...", "context": "..."}], "summary": "..."}',
          "Output ONLY the JSON, no fences.",
        ].join("\n"),
      },
      {
        role: "user",
        content: batchText,
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
      const parsed = JSON.parse(cleaned) as {
        flaggedPassages?: PlagiarismCheckResult["flaggedPassages"];
      };
      if (parsed.flaggedPassages) {
        allFlagged.push(...parsed.flaggedPassages);
      }
    } catch {
      // skip malformed responses
    }
  }

  const totalChars = text.length;
  const flaggedChars = allFlagged.reduce((sum, f) => sum + f.length, 0);
  const originalityScore = Math.max(
    0,
    Math.min(1, 1 - flaggedChars / Math.max(totalChars, 1))
  );

  return {
    originalityScore: Math.round(originalityScore * 100) / 100,
    flaggedPassages: allFlagged,
    summary:
      allFlagged.length === 0
        ? "No potential plagiarism detected."
        : "Found " + String(allFlagged.length) + " passages that may need review.",
  };
}

// ---------------------------------------------------------------------------
// SEO optimization
// ---------------------------------------------------------------------------

export async function analyzeSEO(
  text: string,
  options?: QualityOptions & {
    targetKeywords?: string[];
    pageTitle?: string;
  }
): Promise<SEOAnalysisResult> {
  const client = getAIClient();
  const readability = calculateReadability(text);

  const keywords = options?.targetKeywords ?? [];

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        "You are an SEO optimization expert.",
        "Analyze the content for SEO best practices.",
        "Check:",
        "- Title optimization",
        "- Heading hierarchy (H1-H6)",
        "- Keyword usage and density",
        "- Content structure",
        "- Internal/external linking opportunities",
        "- Readability for SEO",
        "- Meta description suggestions",
        "Output JSON:",
        '{"suggestions": [{"id": "...", "category": "title|meta|headings|keywords|structure|readability|links", "severity": "critical|important|minor", "message": "...", "current": "...", "suggested": "..."}], "keywordDensity": {"keyword": 0.0}, "headingStructure": [{"level": N, "text": "..."}], "internalLinks": N, "externalLinks": N}',
        "Output ONLY the JSON, no fences.",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "Content:\n" + text.slice(0, 6000),
        options?.pageTitle ? "Page title: " + options.pageTitle : "",
        keywords.length > 0 ? "Target keywords: " + keywords.join(", ") : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
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
    const parsed = JSON.parse(cleaned) as Omit<SEOAnalysisResult, "score" | "wordCount" | "readingTime">;

    // Calculate SEO score based on suggestions
    const criticalCount = parsed.suggestions.filter((s) => s.severity === "critical").length;
    const importantCount = parsed.suggestions.filter((s) => s.severity === "important").length;
    const minorCount = parsed.suggestions.filter((s) => s.severity === "minor").length;
    const score = Math.max(
      0,
      100 - criticalCount * 15 - importantCount * 8 - minorCount * 3
    );

    return {
      score,
      suggestions: parsed.suggestions,
      keywordDensity: parsed.keywordDensity ?? {},
      headingStructure: parsed.headingStructure ?? [],
      internalLinks: parsed.internalLinks ?? 0,
      externalLinks: parsed.externalLinks ?? 0,
      wordCount: readability.wordCount,
      readingTime: readability.readingTimeMinutes,
    };
  } catch {
    return {
      score: 50,
      suggestions: [
        {
          id: "parse-error",
          category: "structure",
          severity: "minor",
          message: "Unable to fully analyze SEO. Please try again.",
        },
      ],
      keywordDensity: {},
      headingStructure: [],
      internalLinks: 0,
      externalLinks: 0,
      wordCount: readability.wordCount,
      readingTime: readability.readingTimeMinutes,
    };
  }
}

// ---------------------------------------------------------------------------
// Combined quality report
// ---------------------------------------------------------------------------

export interface QualityReport {
  readability: ReadabilityScore;
  toneConsistency: ToneConsistencyResult;
  grammarCheck: GrammarCheckResult;
  plagiarismCheck: PlagiarismCheckResult;
  seoAnalysis?: SEOAnalysisResult;
  overallScore: number;
}

/**
 * Generate a comprehensive quality report for a document.
 */
export async function generateQualityReport(
  text: string,
  options?: QualityOptions & {
    includeSEO?: boolean;
    targetKeywords?: string[];
    pageTitle?: string;
    expectedTone?: string;
  }
): Promise<QualityReport> {
  // Calculate readability locally (no API needed)
  const readability = calculateReadability(text);

  // Run AI checks in parallel
  const [toneConsistency, grammarCheck, plagiarismCheck, seoAnalysis] =
    await Promise.all([
      checkToneConsistency(text, options?.expectedTone, options),
      checkGrammarAndStyle(text, options),
      checkPlagiarism(text, options),
      options?.includeSEO
        ? analyzeSEO(text, {
            ...options,
            targetKeywords: options.targetKeywords,
            pageTitle: options.pageTitle,
          })
        : Promise.resolve(undefined),
    ]);

  // Calculate overall score
  const readabilityScore = Math.min(100, readability.readingEase);
  const grammarScore = grammarCheck.score;
  const toneScore = toneConsistency.consistencyScore * 100;
  const originalityScore = plagiarismCheck.originalityScore * 100;
  const seoScore = seoAnalysis?.score ?? 80;

  const weights = {
    readability: 0.2,
    grammar: 0.3,
    tone: 0.15,
    originality: 0.2,
    seo: 0.15,
  };

  const overallScore = Math.round(
    readabilityScore * weights.readability +
      grammarScore * weights.grammar +
      toneScore * weights.tone +
      originalityScore * weights.originality +
      seoScore * weights.seo
  );

  return {
    readability,
    toneConsistency,
    grammarCheck,
    plagiarismCheck,
    seoAnalysis,
    overallScore: Math.max(0, Math.min(100, overallScore)),
  };
}

// ---------------------------------------------------------------------------
// Streaming quality suggestions
// ---------------------------------------------------------------------------

export async function* streamQualitySuggestions(
  text: string,
  options?: QualityOptions
): AsyncGenerator<StreamChunk, void, undefined> {
  const client = getAIClient();

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "You are a writing quality advisor. Analyze the text and provide actionable improvement suggestions. Be specific and helpful. Output your suggestions directly.",
    },
    {
      role: "user",
      content: "Analyze and suggest improvements for this text:\n\n" + text.slice(0, 6000),
    },
  ];

  yield* client.stream({
    messages,
    maxTokens: 2048,
    temperature: 0.4,
    provider: options?.provider,
    stream: true,
  });
}
