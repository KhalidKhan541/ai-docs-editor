"use client";

import { useState } from "react";
import { Plus, Search, Grid3X3, List, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TemplateCard from "@/components/editor/template-card";

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  usageCount: number;
  previewColor: string;
}

const categories = ["All", "Product", "Engineering", "Marketing", "Design", "HR", "Legal"];

const mockTemplates: Template[] = [
  { id: "t1", title: "Product Requirements Document", description: "Standard PRD template with sections for overview, user stories, acceptance criteria, and technical specs.", icon: "📋", category: "Product", usageCount: 1240, previewColor: "bg-violet-100" },
  { id: "t2", title: "Engineering RFC", description: "Request for Comments template for proposing technical changes and gathering team feedback.", icon: "🔧", category: "Engineering", usageCount: 890, previewColor: "bg-blue-100" },
  { id: "t3", title: "Sprint Planning", description: "Template for sprint planning meetings with capacity, story points, and priority sections.", icon: "🏃", category: "Engineering", usageCount: 756, previewColor: "bg-green-100" },
  { id: "t4", title: "Marketing Brief", description: "Campaign brief template with target audience, messaging, channels, and KPIs.", icon: "📣", category: "Marketing", usageCount: 623, previewColor: "bg-orange-100" },
  { id: "t5", title: "Design System Guide", description: "Comprehensive design system documentation template with components, tokens, and guidelines.", icon: "🎨", category: "Design", usageCount: 534, previewColor: "bg-pink-100" },
  { id: "t6", title: "Meeting Notes", description: "Structured meeting notes template with agenda, attendees, decisions, and action items.", icon: "📝", category: "Product", usageCount: 2100, previewColor: "bg-yellow-100" },
  { id: "t7", title: "Quarterly Business Review", description: "QBR template with metrics, achievements, challenges, and next quarter goals.", icon: "📊", category: "Product", usageCount: 445, previewColor: "bg-indigo-100" },
  { id: "t8", title: "API Documentation", description: "REST API documentation template with endpoints, auth, examples, and error codes.", icon: "🔌", category: "Engineering", usageCount: 678, previewColor: "bg-teal-100" },
  { id: "t9", title: "Brand Guidelines", description: "Brand identity template with logo usage, colors, typography, and voice.", icon: "✨", category: "Design", usageCount: 389, previewColor: "bg-purple-100" },
  { id: "t10", title: "Employee Onboarding", description: "New hire onboarding checklist and documentation template.", icon: "👋", category: "HR", usageCount: 312, previewColor: "bg-cyan-100" },
  { id: "t11", title: "Contract Template", description: "Standard contract template with terms, conditions, and signature blocks.", icon: "📄", category: "Legal", usageCount: 198, previewColor: "bg-gray-100" },
  { id: "t12", title: "Bug Report", description: "Bug report template with steps to reproduce, expected vs actual behavior.", icon: "🐛", category: "Engineering", usageCount: 1560, previewColor: "bg-red-100" },
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredTemplates = mockTemplates.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Templates</h1>
          <Badge variant="secondary" className="text-xs">{mockTemplates.length} templates</Badge>
        </div>
        <Button size="sm" className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
          <Plus className="h-4 w-4" /> Create template
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search templates..." className="w-80 pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
          <div className="flex rounded-lg border border-gray-200 bg-white">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-r-none" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8 rounded-l-none" onClick={() => setViewMode("list")}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? "bg-gray-900 text-white hover:bg-gray-800" : ""}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className={cn(
          viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"
        )}>
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} viewMode={viewMode} />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-4xl">🔍</div>
            <h3 className="mt-3 text-sm font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
