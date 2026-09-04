"use client";

import * as React from "react";

interface UseCopyToClipboardResult {
  copiedText: string | null;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

function useCopyToClipboard(): UseCopyToClipboardResult {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const copy = React.useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      setCopiedText(null);
      return false;
    }
  }, []);

  const reset = React.useCallback(() => {
    setCopiedText(null);
  }, []);

  React.useEffect(() => {
    if (copiedText !== null) {
      const timer = setTimeout(() => {
        setCopiedText(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [copiedText]);

  return { copiedText, copy, reset };
}

function useCopyToClipboardWithTimeout(timeout = 2000): {
  copiedText: string | null;
  copy: (text: string) => Promise<boolean>;
  isCopied: boolean;
} {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  const copy = React.useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, timeout);

      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      return false;
    }
  }, [timeout]);

  return { copiedText, copy, isCopied };
}

export { useCopyToClipboard, useCopyToClipboardWithTimeout };
