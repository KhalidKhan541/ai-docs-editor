"use client";

import Link from "next/link";
import { Copy, ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  usageCount: number;
  previewColor: string;
}

interface TemplateCardProps {
  template: Template;
  viewMode?: "grid" | "list";
}

export default function TemplateCard({ template, viewMode = "grid" }: TemplateCardProps) {
  if (viewMode === "list") {
    return (
      <Link href={`/templates/${template.id}`}>
        <div className="group flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 cursor-pointer">
          <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl", template.previewColor)}>
            {template.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                {template.title}
              </h3>
              <Badge variant="secondary" className="text-[9px]">{template.category}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{template.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {template.usageCount.toLocaleString()}</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy className="h-3 w-3" /> Use
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/templates/${template.id}`}>
      <div className="group flex flex-col rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md cursor-pointer overflow-hidden">
        <div className={cn("flex h-32 items-center justify-center text-4xl", template.previewColor)}>
          {template.icon}
        </div>
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors line-clamp-1">
              {template.title}
            </h3>
          </div>
          <Badge variant="secondary" className="w-fit text-[9px] mb-2">{template.category}</Badge>
          <p className="text-xs text-gray-500 line-clamp-2 flex-1">{template.description}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{template.usageCount.toLocaleString()} uses</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy className="h-3 w-3" /> Use template
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
