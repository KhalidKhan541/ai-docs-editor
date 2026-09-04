"use client";

import { useState } from "react";
import { Sparkles, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AiInlineProps {
  suggestions: string[];
  onAccept?: (suggestion: string) => void;
  onDismiss?: () => void;
}

export default function AiInline({ suggestions, onAccept, onDismiss }: AiInlineProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const handleAccept = async (suggestion: string) => {
    setIsApplying(true);
    await new Promise((r) => setTimeout(r, 300));
    onAccept?.(suggestion);
    setIsApplying(false);
  };

  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[480px] -translate-x-1/2">
      <div className="rounded-xl border border-violet-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-2.5 border-b border-violet-100">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-800">AI Suggestions</span>
          <span className="text-[10px] text-violet-500">{suggestions.length} options</span>
          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={onDismiss}>
            <X className="h-3 w-3 text-violet-500" />
          </Button>
        </div>

        <div className="max-h-48 overflow-auto">
          {suggestions.map((suggestion, i) => (
            <div
              key={i}
              className={cn(
                "border-b border-gray-100 p-3 transition-colors last:border-0 cursor-pointer",
                selectedIndex === i ? "bg-violet-50" : "hover:bg-gray-50"
              )}
              onClick={() => setSelectedIndex(i)}
            >
              <p className="text-sm text-gray-700 leading-relaxed">{suggestion}</p>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-6 gap-1 bg-violet-600 text-white hover:bg-violet-700"
                  onClick={(e) => { e.stopPropagation(); handleAccept(suggestion); }}
                  disabled={isApplying}
                >
                  {isApplying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6"
                  onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
