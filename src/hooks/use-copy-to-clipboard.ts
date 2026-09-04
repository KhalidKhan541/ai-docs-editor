import { useState, useCallback, useRef } from "react";

interface UseCopyToClipboardResult {
  copiedText: string | null;
  isCopied: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useCopyToClipboard(timeout = 2000): UseCopyToClipboardResult {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.left = "-9999px";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        setCopiedText(text);
        setIsCopied(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsCopied(false);
        }, timeout);

        return true;
      } catch {
        setCopiedText(null);
        setIsCopied(false);
        return false;
      }
    },
    [timeout]
  );

  const reset = useCallback(() => {
    setCopiedText(null);
    setIsCopied(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { copiedText, isCopied, copy, reset };
}
