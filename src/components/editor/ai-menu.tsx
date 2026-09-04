"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Wand2, RefreshCw, Languages, Minimize2,
  Maximize2, Bold, Italic, ArrowRight, Lightbulb, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AiMenuProps {
  onSuggest: (suggestions: string[]) => void;
  onClose: () => void;
}

const aiCommands = [
  { id: "improve", icon: Wand2, label: "Improve writing", description: "Enhance clarity and flow", color: "text-violet-600" },
  { id: "continue", icon: ArrowRight, label: "Continue writing", description: "Generate next paragraph", color: "text-blue-600" },
  { id: "shorten", icon: Minimize2, label: "Make shorter", description: "Condense the content", color: "text-orange-600" },
  { id: "expand", icon: Maximize2, label: "Make longer", description: "Add more detail", color: "text-green-600" },
  { id: "simplify", icon: Zap, label: "Simplify", description: "Use simpler language", color: "text-yellow-600" },
  { id: "formal", icon: Languages, label: "Make formal", description: "Professional tone", color: "text-indigo-600" },
  { id: "creative", icon: Lightbulb, label: "Make creative", description: "More engaging style", color: "text-pink-600" },
  { id: "fix", icon: RefreshCw, label: "Fix grammar", description: "Correct errors", color: "text-red-600" },
];

export default function AiMenu({ onSuggest, onClose }: AiMenuProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleGenerate = async (command?: string) => {
    setIsGenerating(true);
    const finalPrompt = command ? `${command}: ${prompt || "the current section"}` : prompt;
    await new Promise((r) => setTimeout(r, 1500));
    setIsGenerating(false);
    onSuggest([
      "Based on your input, here's an improved version that maintains the core message while enhancing clarity and readability.",
      "The revised content flows better and uses more precise language to convey the technical requirements effectively.",
    ]);
  };

  return (
    <div
      ref={menuRef}
      className="fixed bottom-24 left-1/2 z-50 w-[480px] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white shadow-2xl"
    >
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
        </div>
        <div className="relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like me to help with?"
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
              if (e.key === "Escape") onClose();
            }}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8"
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3">
        <div className="mb-2 text-xs font-medium text-gray-500">Quick commands</div>
        <ScrollArea className="max-h-64">
          <div className="grid grid-cols-2 gap-1.5">
            {aiCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleGenerate(cmd.id)}
                disabled={isGenerating}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <cmd.icon className={cn("h-4 w-4 shrink-0", cmd.color)} />
                <div className="min-w-0">
                  <div className="font-medium text-gray-900">{cmd.label}</div>
                  <div className="text-[11px] text-gray-500">{cmd.description}</div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {isGenerating && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles className="h-4 w-4 animate-pulse text-violet-500" />
            Generating suggestions...
          </div>
        </div>
      )}
    </div>
  );
}
