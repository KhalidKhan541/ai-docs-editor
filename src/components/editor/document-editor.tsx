"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import EditorToolbar from "./editor-toolbar";
import SlashMenu from "./slash-menu";
import AiMenu from "./ai-menu";
import AiInline from "./ai-inline";

interface DocumentEditorProps {
  documentId: string;
  onContentChange?: () => void;
  onWordCountChange?: (count: number) => void;
}

interface EditorBlock {
  id: string;
  type: "paragraph" | "heading" | "bulletList" | "numberedList" | "quote" | "code" | "divider";
  content: string;
  level?: number;
  items?: string[];
}

export default function DocumentEditor({
  documentId,
  onContentChange,
  onWordCountChange,
}: DocumentEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: "b1", type: "heading", content: "Product Requirements", level: 1 },
    { id: "b2", type: "paragraph", content: "This document outlines the core requirements for the Q1 product launch, including user stories, acceptance criteria, and technical specifications." },
    { id: "b3", type: "heading", content: "Overview", level: 2 },
    { id: "b4", type: "paragraph", content: "The goal of this release is to improve collaboration features and add AI-powered writing assistance. We aim to increase team productivity by 30% through real-time editing and smart suggestions." },
    { id: "b5", type: "heading", content: "Key Features", level: 2 },
    { id: "b6", type: "bulletList", content: "", items: ["Real-time collaborative editing with conflict resolution", "AI-powered content generation and rewriting", "Version history with visual diff comparison", "Advanced commenting and discussion threads", "Template gallery for common document types"] },
    { id: "b7", type: "heading", content: "User Stories", level: 2 },
    { id: "b8", type: "paragraph", content: "As a product manager, I want to create PRDs quickly using templates so that I can focus on strategy rather than formatting." },
    { id: "b9", type: "paragraph", content: "As a developer, I want to see real-time cursor positions of my teammates so that we can edit simultaneously without conflicts." },
    { id: "b10", type: "heading", content: "Technical Requirements", level: 2 },
    { id: "b11", type: "paragraph", content: "The system must support up to 50 concurrent editors per document with sub-100ms latency for cursor updates. All operations must be conflict-free using CRDTs." },
    { id: "b12", type: "quote", content: "\"The best product documentation is the one that gets written and maintained. We need to make writing effortless.\" — Team Lead" },
    { id: "b13", type: "divider", content: "" },
    { id: "b14", type: "heading", content: "Timeline", level: 2 },
    { id: "b15", type: "numberedList", content: "", items: ["Week 1-2: Core collaboration infrastructure", "Week 3-4: AI writing features integration", "Week 5-6: Version history and comments system", "Week 7-8: Testing, polish, and launch"] },
  ]);

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  const updateBlock = useCallback((id: string, updates: Partial<EditorBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    onContentChange?.();
  }, [onContentChange]);

  const addBlock = useCallback((afterId: string, type: EditorBlock["type"] = "paragraph") => {
    const newBlock: EditorBlock = {
      id: `b-${Date.now()}`,
      type,
      content: "",
      items: type === "bulletList" || type === "numberedList" ? [""] : undefined,
    };
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === afterId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
    setActiveBlockId(newBlock.id);
    onContentChange?.();
  }, [onContentChange]);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((b) => b.id !== id);
    });
    onContentChange?.();
  }, [onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlock(blockId);
    }
    if (e.key === "Backspace" && blocks.find((b) => b.id === blockId)?.content === "") {
      e.preventDefault();
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index > 0) {
        setActiveBlockId(blocks[index - 1].id);
        deleteBlock(blockId);
      }
    }
    if (e.key === "/" && blocks.find((b) => b.id === blockId)?.content === "") {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setSlashMenuPosition({ x: rect.left, y: rect.bottom + 4 });
      setShowSlashMenu(true);
    }
    if (e.key === " " && blocks.find((b) => b.id === blockId)?.content === "AI") {
      e.preventDefault();
      updateBlock(blockId, { content: "" });
      setShowAiMenu(true);
    }
  }, [blocks, addBlock, deleteBlock, updateBlock]);

  useEffect(() => {
    const totalWords = blocks.reduce((count, block) => {
      const text = block.content + " " + (block.items?.join(" ") || "");
      return count + text.split(/\s+/).filter(Boolean).length;
    }, 0);
    onWordCountChange?.(totalWords);
  }, [blocks, onWordCountChange]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <EditorToolbar />
        <div ref={editorRef} className="mx-auto max-w-3xl px-6 py-8">
          {blocks.map((block) => (
            <div
              key={block.id}
              className={cn(
                "group relative py-1",
                activeBlockId === block.id && "ring-2 ring-violet-200 rounded-lg"
              )}
              onClick={() => setActiveBlockId(block.id)}
            >
              {block.type === "heading" && block.level === 1 && (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="text-3xl font-bold text-gray-900 outline-none"
                  onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.type === "heading" && block.level === 2 && (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="mt-6 mb-2 text-xl font-semibold text-gray-900 outline-none"
                  onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.type === "paragraph" && (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="text-base text-gray-700 leading-relaxed outline-none"
                  onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.type === "bulletList" && (
                <ul className="list-disc pl-6 space-y-1">
                  {block.items?.map((item, i) => (
                    <li key={i} contentEditable suppressContentEditableWarning className="text-base text-gray-700 outline-none" dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>
              )}
              {block.type === "numberedList" && (
                <ol className="list-decimal pl-6 space-y-1">
                  {block.items?.map((item, i) => (
                    <li key={i} contentEditable suppressContentEditableWarning className="text-base text-gray-700 outline-none" dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ol>
              )}
              {block.type === "quote" && (
                <blockquote className="border-l-4 border-gray-300 pl-4 py-1 text-gray-600 italic" dangerouslySetInnerHTML={{ __html: block.content }} />
              )}
              {block.type === "divider" && (
                <hr className="my-4 border-gray-200" />
              )}
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 9l4-4 4 4M5 15l4 4 4-4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSlashMenu && (
        <SlashMenu
          position={slashMenuPosition}
          onSelect={(type) => {
            if (activeBlockId) addBlock(activeBlockId, type);
            setShowSlashMenu(false);
          }}
          onClose={() => setShowSlashMenu(false)}
        />
      )}

      {showAiMenu && (
        <AiMenu
          onSuggest={(suggestions) => {
            setAiSuggestions(suggestions);
            setShowAiMenu(false);
          }}
          onClose={() => setShowAiMenu(false)}
        />
      )}

      {aiSuggestions.length > 0 && (
        <AiInline
          suggestions={aiSuggestions}
          onAccept={(suggestion) => {
            if (activeBlockId) addBlock(activeBlockId, "paragraph");
            setAiSuggestions([]);
          }}
          onDismiss={() => setAiSuggestions([])}
        />
      )}
    </div>
  );
}
