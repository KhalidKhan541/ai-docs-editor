"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, ExternalLink, Eye, Tag, Users, Clock,
  FileText, Sparkles
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const templateData = {
  id: "t1",
  title: "Product Requirements Document",
  description: "Standard PRD template with sections for overview, user stories, acceptance criteria, and technical specs.",
  icon: "📋",
  category: "Product",
  usageCount: 1240,
  author: { name: "DocuFlow Team" },
  createdAt: new Date("2025-12-01"),
  content: [
    { heading: "Overview", description: "High-level summary of the product or feature being proposed." },
    { heading: "Goals & Objectives", description: "What are we trying to achieve? Define measurable success criteria." },
    { heading: "User Stories", description: "As a [user], I want [action] so that [outcome]. Include acceptance criteria." },
    { heading: "Technical Requirements", description: "Architecture decisions, API contracts, data models, and constraints." },
    { heading: "Design Specifications", description: "UI/UX requirements, wireframes, and design system references." },
    { heading: "Timeline & Milestones", description: "Development phases, checkpoints, and launch date." },
    { heading: "Success Metrics", description: "KPIs, analytics events, and measurement approach." },
    { heading: "Risks & Mitigations", description: "Identified risks and planned mitigation strategies." },
  ],
};

export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const [isCreating, setIsCreating] = useState(false);

  const handleUseTemplate = async () => {
    setIsCreating(true);
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/documents/new-from-template");
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-3">
          <Link href="/templates">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-xl">{templateData.icon}</span>
          <div>
            <span className="text-sm font-medium text-gray-900">{templateData.title}</span>
            <Badge variant="secondary" className="ml-2 text-xs">{templateData.category}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button size="sm" className="gap-1.5 bg-gray-900 text-white hover:bg-gray-800" onClick={handleUseTemplate} disabled={isCreating}>
            <Copy className="h-3.5 w-3.5" />
            {isCreating ? "Creating..." : "Use this template"}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-6 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8">
            <div className="text-4xl mb-4">{templateData.icon}</div>
            <h1 className="text-2xl font-bold text-gray-900">{templateData.title}</h1>
            <p className="mt-2 text-gray-600">{templateData.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {templateData.usageCount.toLocaleString()} uses</span>
              <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {templateData.category}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Created {templateData.createdAt.toLocaleDateString()}</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Template Structure
              </CardTitle>
              <CardDescription>This template includes the following sections:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templateData.content.map((section, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{section.heading}</h3>
                      <p className="mt-0.5 text-xs text-gray-500">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> AI Features
              </CardTitle>
              <CardDescription>This template is optimized for AI-powered editing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {["Auto-generate user stories", "Suggest acceptance criteria", "Fill technical specs", "Generate success metrics"].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 rounded-lg border border-gray-100 p-3">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
