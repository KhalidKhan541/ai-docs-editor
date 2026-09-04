import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIProvider = "openai" | "anthropic" | "gemini";

export type MessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface StreamChunk {
  delta: string;
  finishReason: "stop" | "length" | "tool_call" | null;
  usage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AICompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface AICompletionResponse {
  content: string;
  usage: TokenUsage;
  finishReason: string;
  model: string;
  provider: AIProvider;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage: TokenUsage;
  model: string;
  provider: AIProvider;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const ProviderConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string().optional(),
  maxRetries: z.number().int().min(0).max(5).default(3),
  timeoutMs: z.number().int().min(1000).max(300_000).default(60_000),
});

const CompletionRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(128_000).default(4096),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  stop: z.array(z.string()).optional(),
  stream: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// Model defaults per provider
// ---------------------------------------------------------------------------

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-1.5-pro",
};

const EMBEDDING_MODELS: Record<AIProvider, string> = {
  openai: "text-embedding-3-small",
  anthropic: "text-embedding-3-small",
  gemini: "text-embedding-004",
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: AIProvider,
    public readonly statusCode: number,
    public readonly errorCode?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export class AIRateLimitError extends AIProviderError {
  public readonly retryAfterMs: number;

  constructor(provider: AIProvider, retryAfterMs: number) {
    super(
      `Rate limit exceeded for ${provider}. Retry after ${retryAfterMs}ms.`,
      provider,
      429,
      "rate_limit_exceeded",
      true
    );
    this.name = "AIRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class AITimeoutError extends AIProviderError {
  constructor(provider: AIProvider, timeoutMs: number) {
    super(
      `Request to ${provider} timed out after ${timeoutMs}ms.`,
      provider,
      408,
      "timeout",
      true
    );
    this.name = "AITimeoutError";
  }
}

// ---------------------------------------------------------------------------
// Provider adapter interface
// ---------------------------------------------------------------------------

interface ProviderAdapter {
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  stream(
    request: AICompletionRequest
  ): AsyncGenerator<StreamChunk, void, undefined>;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

// ---------------------------------------------------------------------------
// OpenAI adapter
// ---------------------------------------------------------------------------

class OpenAIAdapter implements ProviderAdapter {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const body = {
      model: request.model ?? DEFAULT_MODELS.openai,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
      stream: false,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "5") * 1000;
          throw new AIRateLimitError("openai", retryAfter);
        }
        throw new AIProviderError(
          `OpenAI API error ${res.status}: ${errBody}`,
          "openai",
          res.status
        );
      }

      const json = (await res.json()) as {
        choices: Array<{
          message: { content: string };
          finish_reason: string;
        }>;
        usage: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
        model: string;
      };

      return {
        content: json.choices[0]?.message.content ?? "",
        usage: {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
          totalTokens: json.usage.total_tokens,
        },
        finishReason: json.choices[0]?.finish_reason ?? "stop",
        model: json.model,
        provider: "openai",
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AITimeoutError("openai", this.timeoutMs);
      }
      throw new AIProviderError(
        `OpenAI request failed: ${(err as Error).message}`,
        "openai",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async *stream(
    request: AICompletionRequest
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const body = {
      model: request.model ?? DEFAULT_MODELS.openai,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
      stream: true,
      stream_options: { include_usage: true },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "5") * 1000;
          throw new AIRateLimitError("openai", retryAfter);
        }
        throw new AIProviderError(
          `OpenAI streaming error ${res.status}: ${errBody}`,
          "openai",
          res.status
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new AIProviderError("No response body", "openai", 500);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{
                delta?: { content?: string };
                finish_reason?: string | null;
              }>;
              usage?: {
                prompt_tokens: number;
                completion_tokens: number;
                total_tokens: number;
              };
              model?: string;
            };

            const choice = parsed.choices?.[0];
            if (choice?.delta?.content) {
              yield {
                delta: choice.delta.content,
                finishReason: choice.finish_reason ?? null,
              };
            }

            if (parsed.usage) {
              yield {
                delta: "",
                finishReason: "stop",
                usage: {
                  promptTokens: parsed.usage.prompt_tokens,
                  completionTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens,
                },
              };
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AITimeoutError("openai", this.timeoutMs);
      }
      throw new AIProviderError(
        `OpenAI stream failed: ${(err as Error).message}`,
        "openai",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const body = {
      input: request.input,
      model: request.model ?? EMBEDDING_MODELS.openai,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new AIProviderError(
          `OpenAI embedding error ${res.status}: ${errBody}`,
          "openai",
          res.status
        );
      }

      const json = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
        usage: {
          prompt_tokens: number;
          total_tokens: number;
        };
        model: string;
      };

      const sorted = json.data.sort((a, b) => a.index - b.index);

      return {
        embeddings: sorted.map((d) => d.embedding),
        usage: {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: 0,
          totalTokens: json.usage.total_tokens,
        },
        model: json.model,
        provider: "openai",
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError(
        `OpenAI embedding failed: ${(err as Error).message}`,
        "openai",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

// ---------------------------------------------------------------------------
// Anthropic adapter
// ---------------------------------------------------------------------------

class AnthropicAdapter implements ProviderAdapter {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.anthropic.com/v1";
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  private headers(): Record<string, string> {
    return {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const systemMsg = request.messages.find((m) => m.role === "system");
    const nonSystemMsgs = request.messages.filter((m) => m.role !== "system");

    const body = {
      model: request.model ?? DEFAULT_MODELS.anthropic,
      system: systemMsg?.content ?? undefined,
      messages: nonSystemMsgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      stop_sequences: request.stop,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "5") * 1000;
          throw new AIRateLimitError("anthropic", retryAfter);
        }
        throw new AIProviderError(
          `Anthropic API error ${res.status}: ${errBody}`,
          "anthropic",
          res.status
        );
      }

      const json = (await res.json()) as {
        content: Array<{ type: string; text: string }>;
        stop_reason: string;
        usage: {
          input_tokens: number;
          output_tokens: number;
        };
        model: string;
      };

      const textContent = json.content
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("");

      return {
        content: textContent,
        usage: {
          promptTokens: json.usage.input_tokens,
          completionTokens: json.usage.output_tokens,
          totalTokens: json.usage.input_tokens + json.usage.output_tokens,
        },
        finishReason: json.stop_reason ?? "stop",
        model: json.model,
        provider: "anthropic",
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AITimeoutError("anthropic", this.timeoutMs);
      }
      throw new AIProviderError(
        `Anthropic request failed: ${(err as Error).message}`,
        "anthropic",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async *stream(
    request: AICompletionRequest
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const systemMsg = request.messages.find((m) => m.role === "system");
    const nonSystemMsgs = request.messages.filter((m) => m.role !== "system");

    const body = {
      model: request.model ?? DEFAULT_MODELS.anthropic,
      system: systemMsg?.content ?? undefined,
      messages: nonSystemMsgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      stop_sequences: request.stop,
      stream: true,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "5") * 1000;
          throw new AIRateLimitError("anthropic", retryAfter);
        }
        throw new AIProviderError(
          `Anthropic streaming error ${res.status}: ${errBody}`,
          "anthropic",
          res.status
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new AIProviderError("No response body", "anthropic", 500);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as {
              type: string;
              delta?: { type: string; text?: string };
              message?: {
                usage?: {
                  input_tokens: number;
                  output_tokens: number;
                };
              };
              usage?: {
                input_tokens: number;
                output_tokens: number;
              };
              delta_type?: string;
              stop_reason?: string;
            };

            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              yield {
                delta: parsed.delta.text,
                finishReason: null,
              };
            }

            if (parsed.type === "message_delta" && parsed.delta) {
              yield {
                delta: "",
                finishReason: (parsed.delta as { stop_reason?: string })
                  .stop_reason ?? "stop",
              };
            }

            if (parsed.type === "message_start" && parsed.message?.usage) {
              // Initial usage – store for final
            }

            if (parsed.type === "message_delta" && parsed.usage) {
              yield {
                delta: "",
                finishReason: "stop",
                usage: {
                  promptTokens: parsed.usage.input_tokens,
                  completionTokens: parsed.usage.output_tokens,
                  totalTokens:
                    parsed.usage.input_tokens + parsed.usage.output_tokens,
                },
              };
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AITimeoutError("anthropic", this.timeoutMs);
      }
      throw new AIProviderError(
        `Anthropic stream failed: ${(err as Error).message}`,
        "anthropic",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Anthropic does not provide embeddings; fall back to OpenAI format
    throw new AIProviderError(
      "Anthropic does not support embeddings natively. Use OpenAI or Gemini.",
      "anthropic",
      400,
      "unsupported_operation"
    );
  }
}

// ---------------------------------------------------------------------------
// Gemini adapter
// ---------------------------------------------------------------------------

class GeminiAdapter implements ProviderAdapter {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl =
      config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
    this.timeoutMs = config.timeoutMs ?? 60_000;
  }

  private modelUrl(model: string, action: string): string {
    return `${this.baseUrl}/models/${model}:${action}?key=${this.apiKey}`;
  }

  private toGeminiMessages(messages: ChatMessage[]): {
    systemInstruction?: { parts: { text: string }[] };
    contents: Array<{
      role: string;
      parts: { text: string }[];
    }>;
  } {
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystemMsgs = messages.filter((m) => m.role !== "system");

    return {
      systemInstruction: systemMsg
        ? { parts: [{ text: systemMsg.content }] }
        : undefined,
      contents: nonSystemMsgs.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    };
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const model = request.model ?? DEFAULT_MODELS.gemini;
    const { systemInstruction, contents } = this.toGeminiMessages(
      request.messages
    );

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        topP: request.topP,
        stopSequences: request.stop,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.modelUrl(model, "generateContent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "5") * 1000;
          throw new AIRateLimitError("gemini", retryAfter);
        }
        throw new AIProviderError(
          `Gemini API error ${res.status}: ${errBody}`,
          "gemini",
          res.status
        );
      }

      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
        usageMetadata?: {
          promptTokenCount: number;
          candidatesTokenCount: number;
          totalTokenCount: number;
        };
      };

      const text = json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("") ?? "";

      return {
        content: text,
        usage: {
          promptTokens: json.usageMetadata?.promptTokenCount ?? 0,
          completionTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: json.usageMetadata?.totalTokenCount ?? 0,
        },
        finishReason: json.candidates?.[0]?.finishReason ?? "stop",
        model,
        provider: "gemini",
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AITimeoutError("gemini", this.timeoutMs);
      }
      throw new AIProviderError(
        `Gemini request failed: ${(err as Error).message}`,
        "gemini",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async *stream(
    request: AICompletionRequest
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const model = request.model ?? DEFAULT_MODELS.gemini;
    const { systemInstruction, contents } = this.toGeminiMessages(
      request.messages
    );

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        topP: request.topP,
        stopSequences: request.stop,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.modelUrl(model, "streamGenerateContent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "5") * 1000;
          throw new AIRateLimitError("gemini", retryAfter);
        }
        throw new AIProviderError(
          `Gemini streaming error ${res.status}: ${errBody}`,
          "gemini",
          res.status
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new AIProviderError("No response body", "gemini", 500);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Gemini streams newline-delimited JSON objects
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed) as {
              candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
                finishReason?: string;
              }>;
              usageMetadata?: {
                promptTokenCount: number;
                candidatesTokenCount: number;
                totalTokenCount: number;
              };
            };

            const text = parsed.candidates?.[0]?.content?.parts
              ?.map((p) => p.text ?? "")
              .join("");

            if (text) {
              yield {
                delta: text,
                finishReason: null,
              };
            }

            if (parsed.usageMetadata) {
              yield {
                delta: "",
                finishReason: "stop",
                usage: {
                  promptTokens: parsed.usageMetadata.promptTokenCount,
                  completionTokens:
                    parsed.usageMetadata.candidatesTokenCount,
                  totalTokens: parsed.usageMetadata.totalTokenCount,
                },
              };
            }
          } catch {
            // skip malformed JSON lines
          }
        }
      }
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new AITimeoutError("gemini", this.timeoutMs);
      }
      throw new AIProviderError(
        `Gemini stream failed: ${(err as Error).message}`,
        "gemini",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model ?? EMBEDDING_MODELS.gemini;
    const inputs = Array.isArray(request.input)
      ? request.input
      : [request.input];

    const body = {
      requests: inputs.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
      })),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(
        `${this.baseUrl}/models/${model}:batchEmbedContents?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new AIProviderError(
          `Gemini embedding error ${res.status}: ${errBody}`,
          "gemini",
          res.status
        );
      }

      const json = (await res.json()) as {
        embeddings: Array<{ values: number[] }>;
      };

      return {
        embeddings: json.embeddings.map((e) => e.values),
        usage: {
          promptTokens: inputs.reduce(
            (acc, s) => acc + Math.ceil(s.length / 4),
            0
          ),
          completionTokens: 0,
          totalTokens: inputs.reduce(
            (acc, s) => acc + Math.ceil(s.length / 4),
            0
          ),
        },
        model,
        provider: "gemini",
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError(
        `Gemini embedding failed: ${(err as Error).message}`,
        "gemini",
        500
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

// ---------------------------------------------------------------------------
// Main AI client
// ---------------------------------------------------------------------------

export class AIClient {
  private adapters: Map<AIProvider, ProviderAdapter> = new Map();
  private primaryProvider: AIProvider;

  constructor(configs: Partial<Record<AIProvider, ProviderConfig>>) {
    this.primaryProvider = "openai";

    if (configs.openai) {
      const parsed = ProviderConfigSchema.parse(configs.openai);
      this.adapters.set("openai", new OpenAIAdapter(parsed));
    }
    if (configs.anthropic) {
      const parsed = ProviderConfigSchema.parse(configs.anthropic);
      this.adapters.set("anthropic", new AnthropicAdapter(parsed));
    }
    if (configs.gemini) {
      const parsed = ProviderConfigSchema.parse(configs.gemini);
      this.adapters.set("gemini", new GeminiAdapter(parsed));
    }
  }

  /** Set the default provider used when none is specified. */
  setPrimaryProvider(provider: AIProvider): void {
    if (!this.adapters.has(provider)) {
      throw new Error(
        `Provider "${provider}" is not configured. Available: ${Array.from(
          this.adapters.keys()
        ).join(", ")}`
      );
    }
    this.primaryProvider = provider;
  }

  /** Get an adapter for the given provider (falls back to primary). */
  private getAdapter(provider?: AIProvider): ProviderAdapter {
    const target = provider ?? this.primaryProvider;
    const adapter = this.adapters.get(target);
    if (!adapter) {
      throw new Error(
        `Provider "${target}" is not configured. Available: ${Array.from(
          this.adapters.keys()
        ).join(", ")}`
      );
    }
    return adapter;
  }

  /** Non-streaming completion. */
  async complete(
    request: Omit<AICompletionRequest, "stream"> & { provider?: AIProvider }
  ): Promise<AICompletionResponse> {
    const adapter = this.getAdapter(request.provider);
    const validated = CompletionRequestSchema.parse({
      ...request,
      stream: false,
    });
    return adapter.complete(validated);
  }

  /** Streaming completion. */
  async *stream(
    request: AICompletionRequest & { provider?: AIProvider }
  ): AsyncGenerator<StreamChunk, void, undefined> {
    const adapter = this.getAdapter(request.provider);
    const validated = CompletionRequestSchema.parse({
      ...request,
      stream: true,
    });
    yield* adapter.stream(validated);
  }

  /** Convenience: collect a full stream into a single response. */
  async streamComplete(
    request: AICompletionRequest & { provider?: AIProvider }
  ): Promise<AICompletionResponse> {
    let content = "";
    let usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finishReason = "stop";
    let model = request.model ?? "";

    for await (const chunk of this.stream(request)) {
      content += chunk.delta;
      if (chunk.usage) usage = chunk.usage;
      if (chunk.finishReason) finishReason = chunk.finishReason;
    }

    return {
      content,
      usage,
      finishReason,
      model,
      provider: request.provider ?? this.primaryProvider,
    };
  }

  /** Generate embeddings. */
  async embed(
    request: EmbeddingRequest & { provider?: AIProvider }
  ): Promise<EmbeddingResponse> {
    const adapter = this.getAdapter(request.provider);
    return adapter.embed(request);
  }

  /** Check which providers are configured. */
  availableProviders(): AIProvider[] {
    return Array.from(this.adapters.keys());
  }
}

// ---------------------------------------------------------------------------
// Singleton client factory
// ---------------------------------------------------------------------------

let _client: AIClient | null = null;

/**
 * Initialise (or re-initialise) the global AI client.
 * Call this once at app startup with env-var-backed configs.
 */
export function initAIClient(
  configs: Partial<Record<AIProvider, ProviderConfig>>
): AIClient {
  _client = new AIClient(configs);
  return _client;
}

/**
 * Get the global AI client. Throws if `initAIClient` has not been called.
 */
export function getAIClient(): AIClient {
  if (!_client) {
    throw new Error(
      "AIClient not initialised. Call initAIClient() first."
    );
  }
  return _client;
}

/**
 * Convenience: build a client from `process.env` variables.
 * Recognises `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`.
 */
export function createClientFromEnv(): AIClient {
  const configs: Partial<Record<AIProvider, ProviderConfig>> = {};

  if (process.env.OPENAI_API_KEY) {
    configs.openai = {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL,
      timeoutMs: Number(process.env.AI_TIMEOUT_MS) || undefined,
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    configs.anthropic = {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.ANTHROPIC_BASE_URL,
      timeoutMs: Number(process.env.AI_TIMEOUT_MS) || undefined,
    };
  }
  if (process.env.GEMINI_API_KEY) {
    configs.gemini = {
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: process.env.GEMINI_BASE_URL,
      timeoutMs: Number(process.env.AI_TIMEOUT_MS) || undefined,
    };
  }

  return initAIClient(configs);
}
