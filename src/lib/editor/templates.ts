import { customBlockSchema, type CustomBlock } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  tags: string[];
  blocks: TemplateBlock[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  isPublic: boolean;
  usageCount: number;
}

export type TemplateCategory =
  | "meeting"
  | "project"
  | "technical"
  | "content"
  | "wiki"
  | "knowledge-base"
  | "custom";

export interface TemplateBlock {
  type: string;
  props?: Record<string, any>;
  content?: TemplateInlineContent[];
  children?: TemplateBlock[];
}

export interface TemplateInlineContent {
  type: "text" | "link" | "mention";
  text?: string;
  styles?: Record<string, boolean>;
  href?: string;
  userId?: string;
  userName?: string;
  variable?: string;
}

// ─── Template Registry ───────────────────────────────────────────────────────

const templateRegistry: Map<string, DocumentTemplate> = new Map();

export function registerTemplate(template: DocumentTemplate): void {
  templateRegistry.set(template.id, template);
}

export function getTemplate(id: string): DocumentTemplate | undefined {
  return templateRegistry.get(id);
}

export function getAllTemplates(): DocumentTemplate[] {
  return Array.from(templateRegistry.values());
}

export function getTemplatesByCategory(category: TemplateCategory): DocumentTemplate[] {
  return getAllTemplates().filter((t) => t.category === category);
}

export function searchTemplates(query: string): DocumentTemplate[] {
  const lower = query.toLowerCase();
  return getAllTemplates().filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

// ─── Template Application ────────────────────────────────────────────────────

export function applyTemplate(
  template: DocumentTemplate,
  variables?: Record<string, string>
): CustomBlock[] {
  const blocks: CustomBlock[] = [];

  for (const templateBlock of template.blocks) {
    const block = convertTemplateBlock(templateBlock, variables);
    blocks.push(block);
  }

  return blocks;
}

function convertTemplateBlock(
  templateBlock: TemplateBlock,
  variables?: Record<string, string>
): CustomBlock {
  const id = `tmpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  let content: any[] = [];

  if (templateBlock.content) {
    content = templateBlock.content.map((item) => {
      if (item.type === "text") {
        let text = item.text || "";
        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
          }
        }
        return { type: "text", text, styles: item.styles || {} };
      }
      if (item.type === "link") {
        return {
          type: "link",
          href: item.href || "",
          content: [{ type: "text", text: item.text || "", styles: {} }],
        };
      }
      if (item.type === "mention") {
        return {
          type: "mention",
          userId: item.userId || "",
          userName: item.userName || "",
          content: [{ type: "text", text: item.userName || "", styles: {} }],
        };
      }
      return item;
    });
  }

  const children = templateBlock.children?.map((child) =>
    convertTemplateBlock(child, variables)
  ) || [];

  return {
    id,
    type: templateBlock.type,
    props: templateBlock.props || {},
    content,
    children,
  } as CustomBlock;
}

// ─── Default Templates ───────────────────────────────────────────────────────

export function registerDefaultTemplates(): void {
  // ── Meeting Notes ─────────────────────────────────────────────────────
  registerTemplate({
    id: "meeting-notes",
    name: "Meeting Notes",
    description: "Template for taking meeting notes with agenda, attendees, and action items",
    category: "meeting",
    icon: "📋",
    tags: ["meeting", "notes", "agenda", "action-items"],
    blocks: [
      {
        type: "heading",
        props: { level: "1" },
        content: [{ type: "text", text: "Meeting Notes", styles: { bold: true } }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Date: ", styles: { bold: true } },
          { type: "mention", mentionType: "date", content: [{ type: "text", text: "{{date}}", styles: {} }] },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Attendees: ", styles: { bold: true } },
          { type: "text", text: "{{attendees}}", styles: {} },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Agenda", styles: {} }],
      },
      {
        type: "numberedListItem",
        content: [{ type: "text", text: "Topic 1", styles: {} }],
      },
      {
        type: "numberedListItem",
        content: [{ type: "text", text: "Topic 2", styles: {} }],
      },
      {
        type: "numberedListItem",
        content: [{ type: "text", text: "Topic 3", styles: {} }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Discussion Notes", styles: {} }],
      },
      {
        type: "callout",
        props: { type: "info", emoji: "📝" },
        content: [{ type: "text", text: "Add your discussion notes here", styles: { italic: true } }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Action Items", styles: {} }],
      },
      {
        type: "checkListItem",
        props: { checked: false },
        content: [{ type: "text", text: "Action item 1 - assigned to @name", styles: {} }],
      },
      {
        type: "checkListItem",
        props: { checked: false },
        content: [{ type: "text", text: "Action item 2 - assigned to @name", styles: {} }],
      },
      {
        type: "checkListItem",
        props: { checked: false },
        content: [{ type: "text", text: "Action item 3 - assigned to @name", styles: {} }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Next Meeting", styles: {} }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Date: ", styles: { bold: true } },
          { type: "text", text: "TBD", styles: {} },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Time: ", styles: { bold: true } },
          { type: "text", text: "TBD", styles: {} },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "system",
    isPublic: true,
    usageCount: 0,
  });

  // ── Project Proposal ──────────────────────────────────────────────────
  registerTemplate({
    id: "project-proposal",
    name: "Project Proposal",
    description: "Comprehensive project proposal template with sections for overview, goals, timeline, and budget",
    category: "project",
    icon: "🚀",
    tags: ["project", "proposal", "planning", "business"],
    blocks: [
      {
        type: "heading",
        props: { level: "1" },
        content: [{ type: "text", text: "Project Proposal", styles: { bold: true } }],
      },
      {
        type: "callout",
        props: { type: "info", emoji: "📌" },
        content: [{ type: "text", text: "Project Name: {{projectName}}", styles: { bold: true } }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Prepared by: ", styles: { bold: true } },
          { type: "text", text: "{{author}}", styles: {} },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Date: ", styles: { bold: true } },
          { type: "mention", mentionType: "date", content: [{ type: "text", text: "{{date}}", styles: {} }] },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Executive Summary", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Provide a brief overview of the project, its goals, and expected outcomes.", styles: { italic: true } }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Problem Statement", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Describe the problem this project aims to solve.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Proposed Solution", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Outline the proposed solution and approach.", styles: { italic: true } }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Goals & Objectives", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Goal 1: Define measurable objective", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Goal 2: Define measurable objective", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Goal 3: Define measurable objective", styles: {} }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Timeline", styles: {} }],
      },
      {
        type: "table",
        props: { headerRow: true, striped: false, bordered: true },
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Budget", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Estimated budget: ${{budget}}", styles: {} }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Team & Resources", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Team Lead: {{teamLead}}", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Team Members: {{teamMembers}}", styles: {} }],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "system",
    isPublic: true,
    usageCount: 0,
  });

  // ── Technical Spec ────────────────────────────────────────────────────
  registerTemplate({
    id: "technical-spec",
    name: "Technical Specification",
    description: "Technical specification document template for software projects",
    category: "technical",
    icon: "⚙️",
    tags: ["technical", "spec", "engineering", "architecture"],
    blocks: [
      {
        type: "heading",
        props: { level: "1" },
        content: [{ type: "text", text: "Technical Specification", styles: { bold: true } }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Status: ", styles: { bold: true } },
          { type: "text", text: "Draft", styles: {} },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Authors: ", styles: { bold: true } },
          { type: "text", text: "{{authors}}", styles: {} },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Last Updated: ", styles: { bold: true } },
          { type: "mention", mentionType: "date", content: [{ type: "text", text: "{{date}}", styles: {} }] },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Overview", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Provide a high-level overview of the technical specification.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Requirements", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "3" },
        content: [{ type: "text", text: "Functional Requirements", styles: {} }],
      },
      {
        type: "numberedListItem",
        content: [{ type: "text", text: "Requirement 1", styles: {} }],
      },
      {
        type: "numberedListItem",
        content: [{ type: "text", text: "Requirement 2", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "3" },
        content: [{ type: "text", text: "Non-Functional Requirements", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Performance: Define performance criteria", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Security: Define security requirements", styles: {} }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Architecture", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Describe the system architecture and design decisions.", styles: { italic: true } }],
      },
      {
        type: "codeBlock",
        props: { language: "typescript", theme: "dark" },
        content: [{ type: "text", text: "// Architecture diagram or code example", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Data Model", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Define the data model and schemas.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "API Design", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Document the API endpoints and contracts.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Implementation Plan", styles: {} }],
      },
      {
        type: "checkListItem",
        props: { checked: false },
        content: [{ type: "text", text: "Phase 1: Core implementation", styles: {} }],
      },
      {
        type: "checkListItem",
        props: { checked: false },
        content: [{ type: "text", text: "Phase 2: Testing & validation", styles: {} }],
      },
      {
        type: "checkListItem",
        props: { checked: false },
        content: [{ type: "text", text: "Phase 3: Deployment & monitoring", styles: {} }],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "system",
    isPublic: true,
    usageCount: 0,
  });

  // ── Blog Post ─────────────────────────────────────────────────────────
  registerTemplate({
    id: "blog-post",
    name: "Blog Post",
    description: "Blog post template with introduction, body sections, and conclusion",
    category: "content",
    icon: "✍️",
    tags: ["blog", "article", "content", "writing"],
    blocks: [
      {
        type: "heading",
        props: { level: "1" },
        content: [{ type: "text", text: "Blog Post Title", styles: { bold: true } }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "By ", styles: {} },
          { type: "text", text: "{{author}}", styles: { bold: true } },
          { type: "text", text: " | ", styles: {} },
          { type: "mention", mentionType: "date", content: [{ type: "text", text: "{{date}}", styles: {} }] },
        ],
      },
      {
        type: "image",
        props: { url: "", caption: "Featured image", alt: "Featured image" },
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Introduction", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Hook your readers with an engaging introduction. Tell them what they'll learn and why it matters.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Main Content", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Start with your first main point. Use clear, concise language and support your arguments with evidence.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "3" },
        content: [{ type: "text", text: "Subheading", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Expand on your point with details, examples, and supporting evidence.", styles: { italic: true } }],
      },
      {
        type: "callout",
        props: { type: "info", emoji: "💡" },
        content: [{ type: "text", text: "Pro tip: Add valuable insights here to keep readers engaged.", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Conclusion", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Summarize your key points and leave readers with a clear call-to-action.", styles: { italic: true } }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Key Takeaways", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Takeaway 1", styles: { bold: true } }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Takeaway 2", styles: { bold: true } }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Takeaway 3", styles: { bold: true } }],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "system",
    isPublic: true,
    usageCount: 0,
  });

  // ── Wiki Page ─────────────────────────────────────────────────────────
  registerTemplate({
    id: "wiki-page",
    name: "Wiki Page",
    description: "Wiki page template for documentation and knowledge sharing",
    category: "wiki",
    icon: "📚",
    tags: ["wiki", "documentation", "knowledge"],
    blocks: [
      {
        type: "heading",
        props: { level: "1" },
        content: [{ type: "text", text: "Wiki Page Title", styles: { bold: true } }],
      },
      {
        type: "callout",
        props: { type: "info", emoji: "📖" },
        content: [{ type: "text", text: "This page was last updated on {{date}}. If you find outdated information, please update it.", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Table of Contents", styles: {} }],
      },
      {
        type: "tableOfContents",
        props: { depth: "3", startLevel: "2", numbered: false },
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Overview", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Provide an overview of this topic. What is it? Why is it important?", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Getting Started", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "How to get started with this topic.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Advanced Topics", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "More advanced information and deep dives.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Related Pages", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Related topic 1", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Related topic 2", styles: {} }],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "system",
    isPublic: true,
    usageCount: 0,
  });

  // ── Knowledge Base Article ────────────────────────────────────────────
  registerTemplate({
    id: "knowledge-base",
    name: "Knowledge Base Article",
    description: "Knowledge base article template for FAQs and how-to guides",
    category: "knowledge-base",
    icon: "🧠",
    tags: ["knowledge", "faq", "how-to", "help"],
    blocks: [
      {
        type: "heading",
        props: { level: "1" },
        content: [{ type: "text", text: "Article Title", styles: { bold: true } }],
      },
      {
        type: "callout",
        props: { type: "info", emoji: "📝" },
        content: [{ type: "text", text: "Category: {{category}} | Difficulty: {{difficulty}}", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "What you'll learn", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Learning objective 1", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Learning objective 2", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Prerequisites", styles: {} }],
      },
      {
        type: "bulletListItem",
        content: [{ type: "text", text: "Prerequisite 1", styles: {} }],
      },
      {
        type: "divider",
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Step-by-Step Guide", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "3" },
        content: [{ type: "text", text: "Step 1: Title", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Describe the first step in detail.", styles: { italic: true } }],
      },
      {
        type: "heading",
        props: { level: "3" },
        content: [{ type: "text", text: "Step 2: Title", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Describe the second step in detail.", styles: { italic: true } }],
      },
      {
        type: "callout",
        props: { type: "warning", emoji: "⚠️" },
        content: [{ type: "text", text: "Important: Add any warnings or caveats here.", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "Troubleshooting", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "3" },
        content: [{ type: "text", text: "Common Issue 1", styles: {} }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Solution: Describe how to resolve this issue.", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "2" },
        content: [{ type: "text", text: "FAQ", styles: {} }],
      },
      {
        type: "heading",
        props: { level: "3" },
        content: [{ type: "text", text: "Q: Common question?", styles: { bold: true } }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "A: Provide a clear, concise answer.", styles: {} }],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "system",
    isPublic: true,
    usageCount: 0,
  });
}

// ─── Template Utilities ──────────────────────────────────────────────────────

export function createCustomTemplate(
  name: string,
  description: string,
  category: TemplateCategory,
  blocks: TemplateBlock[]
): DocumentTemplate {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    description,
    category,
    icon: "📄",
    tags: [],
    blocks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: "custom",
    isPublic: false,
    usageCount: 0,
  };
}

export function extractTemplateFromBlocks(
  blocks: CustomBlock[],
  name: string,
  description: string,
  category: TemplateCategory
): DocumentTemplate {
  const templateBlocks: TemplateBlock[] = blocks.map((block) => ({
    type: block.type,
    props: block.props ? { ...block.props } : undefined,
    content: Array.isArray(block.content)
      ? block.content.map((item: any) => ({
          type: item.type,
          text: item.text,
          styles: item.styles,
          href: item.href,
        }))
      : undefined,
    children: block.children?.length > 0
      ? block.children.map((child) => ({
          type: child.type,
          props: child.props ? { ...child.props } : undefined,
          content: Array.isArray(child.content)
            ? child.content.map((item: any) => ({
                type: item.type,
                text: item.text,
                styles: item.styles,
              }))
            : undefined,
        }))
      : undefined,
  }));

  return createCustomTemplate(name, description, category, templateBlocks);
}

export function incrementTemplateUsage(templateId: string): void {
  const template = templateRegistry.get(templateId);
  if (template) {
    template.usageCount++;
    template.updatedAt = new Date().toISOString();
  }
}
