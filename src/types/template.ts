import type { Block } from "./document";

export type TemplateCategory =
  | "business"
  | "academic"
  | "creative"
  | "technical"
  | "personal"
  | "marketing"
  | "legal"
  | "design";

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "date" | "select" | "multiselect" | "boolean";
  label: string;
  description?: string;
  defaultValue?: string | number | boolean;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  placeholder?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  blocks: Block[];
  variables: TemplateVariable[];
  isOptional: boolean;
  order: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  sections: TemplateSection[];
  blocks: Block[];
  previewImage?: string;
  thumbnail?: string;
  tags: string[];
  variables: TemplateVariable[];
  usageCount: number;
  rating: number;
  ratingCount: number;
  isOfficial: boolean;
  isPublic: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  previewImage?: string;
  tags: string[];
  usageCount: number;
  rating: number;
  isOfficial: boolean;
  createdBy: string;
  createdAt: string;
}

export interface TemplateFilter {
  category?: TemplateCategory[];
  tags?: string[];
  search?: string;
  isOfficial?: boolean;
  sortBy?: "name" | "usageCount" | "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface TemplateListResponse {
  templates: TemplateListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateTemplateFromDocRequest {
  documentId: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  isPublic: boolean;
  sections?: Array<{
    blockIds: string[];
    title: string;
    description?: string;
    isOptional: boolean;
  }>;
  variables?: TemplateVariable[];
}

export interface TemplateInstance {
  id: string;
  templateId: string;
  documentId: string;
  variableValues: Record<string, unknown>;
  createdAt: string;
  createdBy: string;
}
