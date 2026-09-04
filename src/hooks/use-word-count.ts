import { useMemo, useCallback } from "react";

interface WordCountResult {
  wordCount: number;
  charCount: number;
  charCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  lineCount: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
}

export function useWordCount(text: string): WordCountResult {
  const stats = useMemo((): WordCountResult => {
    if (!text || text.trim().length === 0) {
      return {
        wordCount: 0,
        charCount: 0,
        charCountNoSpaces: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        lineCount: 0,
        readingTimeMinutes: 0,
        speakingTimeMinutes: 0,
      };
    }

    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
    const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const lines = trimmed.split("\n");

    const wordCount = words.length;
    const charCount = text.length;
    const charCountNoSpaces = text.replace(/\s/g, "").length;
    const sentenceCount = sentences.length;
    const paragraphCount = Math.max(1, paragraphs.length);
    const lineCount = lines.length;

    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const speakingTimeMinutes = Math.max(1, Math.ceil(wordCount / 130));

    return {
      wordCount,
      charCount,
      charCountNoSpaces,
      sentenceCount,
      paragraphCount,
      lineCount,
      readingTimeMinutes,
      speakingTimeMinutes,
    };
  }, [text]);

  const formatWordCount = useCallback((): string => {
    const { wordCount } = stats;
    if (wordCount === 0) return "0 words";
    if (wordCount === 1) return "1 word";
    return `${wordCount.toLocaleString()} words`;
  }, [stats]);

  const formatReadingTime = useCallback((): string => {
    const { readingTimeMinutes } = stats;
    if (readingTimeMinutes < 1) return "Less than 1 min read";
    if (readingTimeMinutes === 1) return "1 min read";
    return `${readingTimeMinutes} min read`;
  }, [stats]);

  return {
    ...stats,
    wordCount: stats.wordCount,
    charCount: stats.charCount,
    charCountNoSpaces: stats.charCountNoSpaces,
    sentenceCount: stats.sentenceCount,
    paragraphCount: stats.paragraphCount,
    lineCount: stats.lineCount,
    readingTimeMinutes: stats.readingTimeMinutes,
    speakingTimeMinutes: stats.speakingTimeMinutes,
  };
}

export function useCharCount(text: string): {
  count: number;
  countNoSpaces: number;
  formatted: string;
} {
  return useMemo(() => {
    const count = text.length;
    const countNoSpaces = text.replace(/\s/g, "").length;
    return {
      count,
      countNoSpaces,
      formatted: count.toLocaleString() + " characters",
    };
  }, [text]);
}
