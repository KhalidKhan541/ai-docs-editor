"use client";

import { useState } from "react";
import { Check, X, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SuggestionOverlayProps {
  suggestions: string[];
  onAccept?: (suggestion: string) => void;
  onDismiss?: () => void;
}

export default function SuggestionOverlay({
  suggestions,
  onAccept,
  onDismiss,
}: SuggestionOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const handleAccept = async (suggestion: string) => {
    setIsApplying(true);
    await new Promise((r) => setTimeout(r, 500));
    onAccept?.(suggestion);
    setIsApplying(false);
  };

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[520px] -translate-x-1/2">
      <div className="rounded-2xl border border-violet-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50 px-4 py-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-medium text-violet-800">AI Suggestions</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-6 w-6"
            onClick={onDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="max-h-64 overflow-auto">
          {suggestions.map((suggestion, i) => (
            <div
              key={i}
              className={cn(
                "border-b border-gray-100 p-4 transition-colors last:border-0",
                selectedIndex === i ? "bg-violet-50" : "hover:bg-gray-50"
              )}
              onClick={() => setSelectedIndex(i)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100">
                  <span className="text-[10px] font-bold text-violet-700">{i + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{suggestion}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-6 gap-1 bg-violet-600 text-white hover:bg-violet-700"
                      onClick={(e) => { e.stopPropagation(); handleAccept(suggestion); }}
                      disabled={isApplying}
                    >
                      <Check className="h-3 w-3" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1"
                      onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2">
          <span className="text-[10px] text-gray-500">
            {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} available
          </span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={onDismiss}>
              Dismiss all
            </Button>
            <Button size="sm" className="h-6 text-[10px] bg-violet-600 text-white hover:bg-violet-700" onClick={() => handleAccept(suggestions[selectedIndex])}>
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
