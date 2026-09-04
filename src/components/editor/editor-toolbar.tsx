"use client";

import { useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Link, Image,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote,
  Minus, Undo2, Redo2, Sparkles, Type, Heading1, Heading2, Heading3,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ToolbarGroup {
  items: { icon: React.ElementType; label: string; active?: boolean; action: () => void }[];
}

export default function EditorToolbar() {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const toggleFormat = (format: string) => {
    setActiveFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) next.delete(format);
      else next.add(format);
      return next;
    });
  };

  const headingOptions = [
    { icon: Type, label: "Paragraph", shortcut: "⌘⌥0" },
    { icon: Heading1, label: "Heading 1", shortcut: "⌘⌥1" },
    { icon: Heading2, label: "Heading 2", shortcut: "⌘⌥2" },
    { icon: Heading3, label: "Heading 3", shortcut: "⌘⌥3" },
  ];

  const formatGroups: ToolbarGroup[] = [
    {
      items: [
        { icon: Undo2, label: "Undo", action: () => document.execCommand("undo") },
        { icon: Redo2, label: "Redo", action: () => document.execCommand("redo") },
      ],
    },
    {
      items: [
        { icon: Bold, label: "Bold", active: activeFormats.has("bold"), action: () => { toggleFormat("bold"); document.execCommand("bold"); } },
        { icon: Italic, label: "Italic", active: activeFormats.has("italic"), action: () => { toggleFormat("italic"); document.execCommand("italic"); } },
        { icon: Underline, label: "Underline", active: activeFormats.has("underline"), action: () => { toggleFormat("underline"); document.execCommand("underline"); } },
        { icon: Strikethrough, label: "Strikethrough", active: activeFormats.has("strikethrough"), action: () => { toggleFormat("strikethrough"); document.execCommand("strikeThrough"); } },
        { icon: Code, label: "Code", active: activeFormats.has("code"), action: () => toggleFormat("code") },
      ],
    },
    {
      items: [
        { icon: Link, label: "Link", action: () => { const url = prompt("Enter URL:"); if (url) document.execCommand("createLink", false, url); } },
        { icon: Image, label: "Image", action: () => {} },
      ],
    },
    {
      items: [
        { icon: AlignLeft, label: "Align left", active: activeFormats.has("alignLeft"), action: () => { toggleFormat("alignLeft"); document.execCommand("justifyLeft"); } },
        { icon: AlignCenter, label: "Align center", active: activeFormats.has("alignCenter"), action: () => { toggleFormat("alignCenter"); document.execCommand("justifyCenter"); } },
        { icon: AlignRight, label: "Align right", active: activeFormats.has("alignRight"), action: () => { toggleFormat("alignRight"); document.execCommand("justifyRight"); } },
      ],
    },
    {
      items: [
        { icon: List, label: "Bullet list", active: activeFormats.has("bulletList"), action: () => { toggleFormat("bulletList"); document.execCommand("insertUnorderedList"); } },
        { icon: ListOrdered, label: "Numbered list", active: activeFormats.has("numberedList"), action: () => { toggleFormat("numberedList"); document.execCommand("insertOrderedList"); } },
        { icon: Quote, label: "Block quote", active: activeFormats.has("quote"), action: () => toggleFormat("quote") },
        { icon: Minus, label: "Divider", action: () => {} },
      ],
    },
  ];

  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-gray-200 bg-white px-4 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-sm">
            Paragraph <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {headingOptions.map((option) => (
            <DropdownMenuItem key={option.label} className="gap-2">
              <option.icon className="h-4 w-4" />
              <span className="flex-1">{option.label}</span>
              <kbd className="text-[10px] text-gray-400">{option.shortcut}</kbd>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {formatGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {group.items.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", item.active && "bg-gray-100 text-gray-900")}
              onClick={item.action}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
          {groupIndex < formatGroups.length - 1 && (
            <Separator orientation="vertical" className="h-6 mx-1" />
          )}
        </div>
      ))}

      <div className="ml-auto">
        <Button variant="ghost" size="sm" className="gap-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50">
          <Sparkles className="h-4 w-4" />
          AI
        </Button>
      </div>
    </div>
  );
}
