"use client";

import { useState, useEffect, useRef } from "react";
import {
  Type, Heading1, Heading2, List, ListOrdered, Quote, Code,
  Minus, Image, Table, FileText, Sparkles, LayoutTemplate
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SlashMenuProps {
  position: { x: number; y: number };
  onSelect: (type: string) => void;
  onClose: () => void;
}

interface SlashItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  category: string;
}

const slashItems: SlashItem[] = [
  { id: "paragraph", icon: Type, label: "Paragraph", description: "Plain text block", category: "Basic" },
  { id: "heading1", icon: Heading1, label: "Heading 1", description: "Large section heading", category: "Basic" },
  { id: "heading2", icon: Heading2, label: "Heading 2", description: "Medium section heading", category: "Basic" },
  { id: "bulletList", icon: List, label: "Bullet List", description: "Unordered list", category: "Basic" },
  { id: "numberedList", icon: ListOrdered, label: "Numbered List", description: "Ordered list", category: "Basic" },
  { id: "quote", icon: Quote, label: "Blockquote", description: "Quoted text block", category: "Basic" },
  { id: "code", icon: Code, label: "Code Block", description: "Code with syntax highlighting", category: "Basic" },
  { id: "divider", icon: Minus, label: "Divider", description: "Horizontal separator", category: "Basic" },
  { id: "image", icon: Image, label: "Image", description: "Upload or embed an image", category: "Media" },
  { id: "table", icon: Table, label: "Table", description: "Insert a table", category: "Media" },
  { id: "template", icon: LayoutTemplate, label: "Template", description: "Insert a template block", category: "Advanced" },
  { id: "ai", icon: Sparkles, label: "AI Generate", description: "Generate content with AI", category: "Advanced" },
];

export default function SlashMenu({ position, onSelect, onClose }: SlashMenuProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = slashItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  const categories = [...new Set(filteredItems.map((item) => item.category))];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-xl"
      style={{ left: position.x, top: position.y }}
    >
      <div className="border-b border-gray-100 p-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Filter commands..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          className="w-full rounded-lg border-0 bg-gray-50 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:bg-gray-100"
        />
      </div>
      <ScrollArea className="max-h-80">
        {categories.map((category) => (
          <div key={category}>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {category}
            </div>
            {filteredItems
              .filter((item) => item.category === category)
              .map((item, i) => {
                const globalIndex = filteredItems.indexOf(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                      globalIndex === selectedIndex
                        ? "bg-violet-50 text-violet-900"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      globalIndex === selectedIndex ? "bg-violet-100" : "bg-gray-100"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 truncate">{item.description}</div>
                    </div>
                  </button>
                );
              })}
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-gray-500">
            No commands found
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
