import {
  getAIClient,
  type AICompletionResponse,
  type ChatMessage,
} from "./provider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  /** Unique result identifier. */
  id: string;
  /** Matched document ID. */
  documentId: string;
  /** Document title. */
  documentTitle: string;
  /** Matched content excerpt. */
  excerpt: string;
  /** Relevance score 0-1. */
  score: number;
  /** Match type. */
  matchType: "semantic" | "keyword" | "hybrid";
  /** Start offset of the match within the document. */
  offset: number;
  /** End offset of the match. */
  endOffset: number;
  /** Metadata about the match. */
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  /** Maximum results to return. */
  limit?: number;
  /** Minimum relevance score threshold. */
  minScore?: number;
  /** Filter by document IDs. */
  documentIds?: string[];
  /** Search mode. */
  mode?: "semantic" | "keyword" | "hybrid";
  /** Provider to use. */
  provider?: "openai" | "anthropic" | "gemini";
}

export interface CrossDocumentSearchOptions extends SearchOptions {
  /** Maximum documents to search. */
  maxDocuments?: number;
}

export interface SimilarContentRequest {
  /** Text to find similar content for. */
  text: string;
  /** Document to search within. */
  documents: DocumentForSearch[];
  /** Number of similar passages to find. */
  topK?: number;
  provider?: "openai" | "anthropic" | "gemini";
}

export interface DocumentForSearch {
  id: string;
  title: string;
  content: string;
  /** Pre-computed embedding (optional, for performance). */
  embedding?: number[];
}

export interface SearchResultCluster {
  theme: string;
  documents: SearchResult[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Document indexing helpers
// ---------------------------------------------------------------------------

/**
 * Chunk a document into overlapping segments for embedding.
 */
export function chunkDocument(
  content: string,
  options?: { chunkSize?: number; overlap?: number }
): Array<{ text: string; offset: number; endOffset: number }> {
  const chunkSize = options?.chunkSize ?? 512;
  const overlap = options?.overlap ?? 64;
  const chunks: Array<{ text: string; offset: number; endOffset: number }> = [];

  // Split by paragraphs first for better semantic chunking
  const paragraphs = content.split(/\n\n+/);
  let currentOffset = 0;

  for (const para of paragraphs) {
    if (!para.trim()) {
      currentOffset += para.length + 2; // +2 for \n\n
      continue;
    }

    if (para.length <= chunkSize) {
      chunks.push({
        text: para,
        offset: currentOffset,
        endOffset: currentOffset + para.length,
      });
    } else {
      // Split long paragraphs by sentences
      const sentences = para.match(/[^.!?]+[.!?]+\s*/g) ?? [para];
      let buffer = "";
      let bufferOffset = currentOffset;

      for (const sentence of sentences) {
        if (buffer.length + sentence.length > chunkSize && buffer.length > 0) {
          chunks.push({
            text: buffer.trim(),
            offset: bufferOffset,
            endOffset: bufferOffset + buffer.length,
          });

          // Overlap: keep last portion of buffer
          const overlapText = buffer.slice(-overlap);
          buffer = overlapText + sentence;
          bufferOffset = bufferOffset + buffer.length - overlapText.length;
        } else {
          buffer += sentence;
        }
      }

      if (buffer.trim()) {
        chunks.push({
          text: buffer.trim(),
          offset: bufferOffset,
          endOffset: bufferOffset + buffer.length,
        });
      }
    }

    currentOffset += para.length + 2;
  }

  return chunks;
}

/**
 * Cosine similarity between two embedding vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ---------------------------------------------------------------------------
// Embedding-based semantic search
// ---------------------------------------------------------------------------

async function getEmbeddings(
  texts: string[],
  provider?: "openai" | "anthropic" | "gemini"
): Promise<number[][]> {
  const client = getAIClient();

  // Process in batches of 20 to avoid API limits
  const batchSize = 20;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const result = await client.embed({ input: batch, provider });
    allEmbeddings.push(...result.embeddings);
  }

  return allEmbeddings;
}

/**
 * Perform semantic search using embeddings.
 */
export async function semanticSearch(
  query: string,
  documents: DocumentForSearch[],
  options?: SearchOptions
): Promise<SearchResult[]> {
  const limit = options?.limit ?? 10;
  const minScore = options?.minScore ?? 0.3;

  // Get query embedding
  const [queryEmbedding] = await getEmbeddings(
    [query],
    options?.provider
  );

  if (!queryEmbedding) return [];

  const results: SearchResult[] = [];

  for (const doc of documents) {
    if (options?.documentIds?.length && !options.documentIds.includes(doc.id)) {
      continue;
    }

    // Get document embeddings (compute if not provided)
    let embeddings: number[][];
    let chunks: Array<{ text: string; offset: number; endOffset: number }>;

    if (doc.embedding) {
      // Use pre-computed embedding for whole document (simple mode)
      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      if (score >= minScore) {
        results.push({
          id: `result-${doc.id}-full`,
          documentId: doc.id,
          documentTitle: doc.title,
          excerpt: doc.content.slice(0, 300),
          score,
          matchType: "semantic",
          offset: 0,
          endOffset: doc.content.length,
        });
      }
      continue;
    }

    chunks = chunkDocument(doc.content);
    if (chunks.length === 0) continue;

    embeddings = await getEmbeddings(
      chunks.map((c) => c.text),
      options?.provider
    );

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] ?? { text: "", offset: 0, endOffset: 0 };
      const embedding = embeddings[i];
      if (!embedding) continue;

      const score = cosineSimilarity(queryEmbedding, embedding);

      if (score >= minScore) {
        results.push({
          id: `result-${doc.id}-${i}`,
          documentId: doc.id,
          documentTitle: doc.title,
          excerpt: chunk.text,
          score,
          matchType: "semantic",
          offset: chunk.offset,
          endOffset: chunk.endOffset,
        });
      }
    }
  }

  // Sort by score descending and limit
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Keyword search
// ---------------------------------------------------------------------------

/**
 * Simple keyword-based search with TF-IDF-like scoring.
 */
export function keywordSearch(
  query: string,
  documents: DocumentForSearch[],
  options?: SearchOptions
): SearchResult[] {
  const limit = options?.limit ?? 10;
  const minScore = options?.minScore ?? 0.1;

  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const doc of documents) {
    if (options?.documentIds?.length && !options.documentIds.includes(doc.id)) {
      continue;
    }

    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    // Find all occurrences of query terms
    for (const term of queryTerms) {
      let searchFrom = 0;

      while (true) {
        const idx = contentLower.indexOf(term, searchFrom);
        if (idx === -1) break;

        // Extract surrounding context
        const start = Math.max(0, idx - 100);
        const end = Math.min(doc.content.length, idx + term.length + 200);
        const excerpt = doc.content.slice(start, end);

        // Calculate score based on term frequency and position
        const titleBoost = titleLower.includes(term) ? 0.2 : 0;
        const positionBoost = idx < 500 ? 0.1 : 0;
        const frequencyBoost =
          (contentLower.split(term).length - 1) * 0.05;
        const score = Math.min(
          0.5 + titleBoost + positionBoost + frequencyBoost,
          1.0
        );

        if (score >= minScore) {
          results.push({
            id: `kw-${doc.id}-${idx}`,
            documentId: doc.id,
            documentTitle: doc.title,
            excerpt,
            score,
            matchType: "keyword",
            offset: start,
            endOffset: end,
            metadata: { term },
          });
        }

        searchFrom = idx + term.length;
      }
    }
  }

  // Deduplicate overlapping results for same document
  const deduplicated = deduplicateResults(results);

  return deduplicated
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const byDoc = new Map<string, SearchResult[]>();

  for (const r of results) {
    const existing = byDoc.get(r.documentId) ?? [];
    existing.push(r);
    byDoc.set(r.documentId, existing);
  }

  const deduplicated: SearchResult[] = [];

  for (const docResults of byDoc.values()) {
    docResults.sort((a, b) => a.offset - b.offset);

    // Merge overlapping ranges
    let current = docResults[0];
    if (!current) continue;

    for (let i = 1; i < docResults.length; i++) {
      const next = docResults[i];
      if (!next) continue;

      if (next.offset <= (current.endOffset ?? 0) + 50) {
        // Overlapping – merge
        current = {
          ...current,
          endOffset: Math.max(current.endOffset ?? 0, next.endOffset ?? 0),
          score: Math.max(current.score, next.score),
          excerpt: current.excerpt + " ... " + next.excerpt,
        };
      } else {
        deduplicated.push(current);
        current = next;
      }
    }
    deduplicated.push(current);
  }

  return deduplicated;
}

// ---------------------------------------------------------------------------
// Hybrid search (semantic + keyword)
// ---------------------------------------------------------------------------

/**
 * Combined semantic and keyword search with weighted scoring.
 */
export async function hybridSearch(
  query: string,
  documents: DocumentForSearch[],
  options?: SearchOptions & {
    semanticWeight?: number;
    keywordWeight?: number;
  }
): Promise<SearchResult[]> {
  const limit = options?.limit ?? 10;
  const semanticWeight = options?.semanticWeight ?? 0.7;
  const keywordWeight = options?.keywordWeight ?? 0.3;

  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, documents, { ...options, limit: limit * 2 }),
    Promise.resolve(keywordSearch(query, documents, { ...options, limit: limit * 2 })),
  ]);

  // Merge scores
  const scoreMap = new Map<string, { result: SearchResult; score: number }>();

  for (const r of semanticResults) {
    scoreMap.set(r.id, { result: r, score: r.score * semanticWeight });
  }

  for (const r of keywordResults) {
    const existing = scoreMap.get(r.id);
    if (existing) {
      existing.score += r.score * keywordWeight;
    } else {
      scoreMap.set(r.id, {
        result: { ...r, matchType: "hybrid" },
        score: r.score * keywordWeight,
      });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      ...entry.result,
      score: Math.min(entry.score, 1),
      matchType: "hybrid" as const,
    }));
}

// ---------------------------------------------------------------------------
// Natural language search
// ---------------------------------------------------------------------------

/**
 * Search using natural language query with AI interpretation.
 */
export async function naturalLanguageSearch(
  query: string,
  documents: DocumentForSearch[],
  options?: SearchOptions
): Promise<SearchResult[]> {
  const client = getAIClient();

  // Use AI to expand/reformulate the query
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a search query optimizer. Given a natural language query, generate:
1. An optimized search query for keyword matching
2. A semantic search query that captures the user's intent
3. Key terms and concepts

Output JSON: {"keywordQuery": "...", "semanticQuery": "...", "keyTerms": ["..."]}
Output ONLY the JSON, no fences.`,
    },
    { role: "user", content: query },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 256,
    temperature: 0.2,
    provider: options?.provider,
  });

  let keywordQuery = query;
  let semanticQuery = query;

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      keywordQuery?: string;
      semanticQuery?: string;
    };
    keywordQuery = parsed.keywordQuery ?? query;
    semanticQuery = parsed.semanticQuery ?? query;
  } catch {
    // Use original query for both
  }

  // Run both searches in parallel
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(semanticQuery, documents, { ...options, limit: 20 }),
    Promise.resolve(keywordSearch(keywordQuery, documents, { ...options, limit: 20 })),
  ]);

  // Merge with hybrid approach
  const scoreMap = new Map<string, { result: SearchResult; score: number }>();

  for (const r of semanticResults) {
    scoreMap.set(r.id, { result: r, score: r.score * 0.7 });
  }

  for (const r of keywordResults) {
    const existing = scoreMap.get(r.id);
    if (existing) {
      existing.score += r.score * 0.3;
    } else {
      scoreMap.set(r.id, {
        result: { ...r, matchType: "hybrid" },
        score: r.score * 0.3,
      });
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, options?.limit ?? 10)
    .map((entry) => ({
      ...entry.result,
      score: Math.min(entry.score, 1),
    }));
}

// ---------------------------------------------------------------------------
// Find similar content
// ---------------------------------------------------------------------------

/**
 * Find passages similar to a given text.
 */
export async function findSimilarContent(
  request: SimilarContentRequest
): Promise<SearchResult[]> {
  const topK = request.topK ?? 5;
  const minScore = 0.3;

  const [queryEmbedding] = await getEmbeddings(
    [request.text],
    request.provider
  );

  if (!queryEmbedding) return [];

  const results: SearchResult[] = [];

  for (const doc of request.documents) {
    const chunks = chunkDocument(doc.content);
    if (chunks.length === 0) continue;

    const embeddings = await getEmbeddings(
      chunks.map((c) => c.text),
      request.provider
    );

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] ?? { text: "", offset: 0, endOffset: 0 };
      const embedding = embeddings[i];
      if (!embedding) continue;

      const score = cosineSimilarity(queryEmbedding, embedding);

      if (score >= minScore) {
        results.push({
          id: `similar-${doc.id}-${i}`,
          documentId: doc.id,
          documentTitle: doc.title,
          excerpt: chunk.text,
          score,
          matchType: "semantic",
          offset: chunk.offset,
          endOffset: chunk.endOffset,
        });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ---------------------------------------------------------------------------
// Cross-document search with AI ranking
// ---------------------------------------------------------------------------

/**
 * Search across multiple documents with AI-powered result ranking.
 */
export async function crossDocumentSearch(
  query: string,
  documents: DocumentForSearch[],
  options?: CrossDocumentSearchOptions
): Promise<SearchResult[]> {
  const maxDocs = options?.maxDocuments ?? 50;

  // First, use hybrid search to get candidates
  const candidates = await hybridSearch(query, documents, {
    ...options,
    limit: Math.min(maxDocs * 3, 100),
  });

  if (candidates.length <= 5) return candidates;

  // Use AI to re-rank top candidates
  const client = getAIClient();

  const candidateDescriptions = candidates
    .slice(0, 20)
    .map(
      (r, i) =>
        `[${i}] Score: ${r.score.toFixed(3)} | Doc: ${r.documentTitle} | Excerpt: ${r.excerpt.slice(0, 150)}`
    )
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a search result ranking expert. Given a query and search results, re-rank them by relevance.

Consider:
- Semantic relevance to the query
- Quality and informativeness of the excerpt
- Context appropriateness

Output ONLY a comma-separated list of indices in order of relevance, e.g.: "2,0,5,1,3"
Do not include any other text.`,
    },
    {
      role: "user",
      content: `Query: ${query}

Results:
${candidateDescriptions}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 128,
    temperature: 0.1,
    provider: options?.provider,
  });

  try {
    const rankings = response.content
      .trim()
      .split(/[,\s]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n < candidates.length);

    const reranked = rankings
      .map((idx, rank) => {
        const result = candidates[idx];
        if (!result) return null;
        return {
          ...result,
          score: 1 - rank / rankings.length,
        };
      })
      .filter((r): r is SearchResult => r !== null);

    // Append any results not in the ranking
    const rankedIds = new Set(reranked.map((r) => r.id));
    const remaining = candidates
      .filter((r) => !rankedIds.has(r.id))
      .map((r) => ({ ...r, score: r.score * 0.5 }));

    return [...reranked, ...remaining].slice(0, options?.limit ?? 10);
  } catch {
    return candidates.slice(0, options?.limit ?? 10);
  }
}

// ---------------------------------------------------------------------------
// Search result clustering
// ---------------------------------------------------------------------------

/**
 * Cluster search results by theme using AI.
 */
export async function clusterResults(
  results: SearchResult[],
  query: string,
  options?: { provider?: "openai" | "anthropic" | "gemini" }
): Promise<SearchResultCluster[]> {
  if (results.length === 0) return [];

  const client = getAIClient();

  const resultsText = results
    .map(
      (r, i) =>
        `[${i}] ${r.documentTitle}: ${r.excerpt.slice(0, 200)}`
    )
    .join("\n\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Group the search results into thematic clusters.
Each cluster should have a clear theme, contain related results, and include a brief summary.

Output JSON array:
[{
  "theme": "cluster theme",
  "indices": [0, 2, 5],
  "summary": "brief summary of findings"
}]
Output ONLY the JSON array, no fences.`,
    },
    {
      role: "user",
      content: `Query: ${query}

Search Results:
${resultsText}`,
    },
  ];

  const response = await client.complete({
    messages,
    maxTokens: 2048,
    temperature: 0.3,
    provider: options?.provider,
  });

  try {
    const cleaned = response.content
      .replace(/^```json?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Array<{
      theme: string;
      indices: number[];
      summary: string;
    }>;

    return parsed.map((cluster) => ({
      theme: cluster.theme,
      documents: cluster.indices
        .map((idx) => results[idx])
        .filter((r): r is SearchResult => r !== undefined),
      summary: cluster.summary,
    }));
  } catch {
    return [
      {
        theme: "All Results",
        documents: results,
        summary: "Uncategorized search results.",
      },
    ];
  }
}
