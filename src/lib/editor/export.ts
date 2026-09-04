import { customBlockSchema, type CustomBlock } from "./block-schema";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ExportFormat = "markdown" | "html" | "pdf" | "docx";
export type ImportFormat = "markdown" | "html" | "docx";

export interface ExportOptions {
  format: ExportFormat;
  title?: string;
  includeMetadata?: boolean;
  includeStyles?: boolean;
  cssStyles?: string;
  pageSize?: "letter" | "a4" | "legal";
  margin?: number;
  imageHandling?: "inline" | "reference";
}

export interface ImportOptions {
  format: ImportFormat;
  preserveFormatting?: boolean;
  importImages?: boolean;
  baseUrl?: string;
}

export interface ImportResult {
  blocks: CustomBlock[];
  metadata?: Record<string, any>;
  warnings: string[];
  errors: string[];
}

// ─── Markdown Export ─────────────────────────────────────────────────────────

export function exportToMarkdown(
  blocks: CustomBlock[],
  options: ExportOptions = { format: "markdown" }
): string {
  const lines: string[] = [];

  if (options.title) {
    lines.push(`# ${options.title}`);
    lines.push("");
  }

  if (options.includeMetadata) {
    lines.push("---");
    lines.push(`title: ${options.title || "Untitled"}`);
    lines.push(`date: ${new Date().toISOString().split("T")[0]}`);
    lines.push("---");
    lines.push("");
  }

  for (const block of blocks) {
    const md = blockToMarkdown(block);
    if (md !== null) {
      lines.push(md);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

function blockToMarkdown(block: CustomBlock): string | null {
  const content = extractMarkdownContent(block.content);

  switch (block.type) {
    case "heading": {
      const level = parseInt((block.props as any)?.level || "1");
      return `${"#".repeat(level)} ${content}`;
    }
    case "paragraph":
      return content || "";
    case "bulletListItem":
      return `- ${content}`;
    case "numberedListItem":
      return `1. ${content}`;
    case "checkListItem":
      return (block.props as any)?.checked ? `- [x] ${content}` : `- [ ] ${content}`;
    case "todo":
      return (block.props as any)?.checked ? `- [x] ${content}` : `- [ ] ${content}`;
    case "toggle":
      return `<details>\n<summary>${content}</summary>\n\n</details>`;
    case "callout": {
      const emoji = (block.props as any)?.emoji || "💡";
      const type = (block.props as any)?.type || "info";
      return `> ${emoji} **${type.toUpperCase()}:** ${content}`;
    }
    case "quote":
      return `> ${content}`;
    case "codeBlock": {
      const lang = (block.props as any)?.language || "";
      return `\`\`\`${lang}\n${content}\n\`\`\``;
    }
    case "divider":
      return "---";
    case "image": {
      const caption = (block.props as any)?.caption || "image";
      const url = (block.props as any)?.url || "";
      return `![${caption}](${url})`;
    }
    case "video":
      return `[Video: ${(block.props as any)?.caption || "video"}](${(block.props as any)?.url || ""})`;
    case "audio":
      return `[Audio: ${(block.props as any)?.caption || "audio"}](${(block.props as any)?.url || ""})`;
    case "file":
      return `[File: ${(block.props as any)?.name || "file"}](${(block.props as any)?.url || ""})`;
    case "embed":
      return `[Embed: ${(block.props as any)?.url || ""}]`;
    case "iframe":
      return `[Iframe: ${(block.props as any)?.url || ""}]`;
    case "bookmark":
      return `[Bookmark: ${(block.props as any)?.title || (block.props as any)?.url || ""}](${(block.props as any)?.url || ""})`;
    case "table":
      return markdownTable(block);
    case "math":
      return `$$\n${(block.props as any)?.latex || ""}\n$$`;
    case "diagram":
      return `\`\`\`${(block.props as any)?.diagramType || "mermaid"}\n${(block.props as any)?.code || ""}\n\`\`\``;
    case "tableOfContents":
      return "[Table of Contents]";
    case "syncedBlock":
      return `[Synced Block: ${(block.props as any)?.syncSourceTitle || "untitled"}]`;
    case "templateVariable":
      return `{{${(block.props as any)?.variableName || "variable"}}}`;
    case "columns":
      return "[Columns Layout]";
    default:
      return content || "";
  }
}

function markdownTable(block: CustomBlock): string {
  const content = block.content as any[];
  if (!content || !Array.isArray(content) || content.length === 0) {
    return "| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |";
  }

  const rows: string[] = [];
  const headerRow = (block.props as any)?.headerRow;

  for (let i = 0; i < content.length; i++) {
    const row = content[i];
    if (!row || !Array.isArray(row)) continue;

    const cells = row.map((cell: any) => {
      if (cell && cell.content) {
        return cell.content.map((c: any) => c.text || "").join("");
      }
      return "";
    });

    rows.push(`| ${cells.join(" | ")} |`);

    if (i === 0 && headerRow) {
      rows.push(`| ${cells.map(() => "---").join(" | ")} |`);
    }
  }

  return rows.join("\n");
}

function extractMarkdownContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (item.type === "text") return item.text || "";
        if (item.type === "link") {
          const text = item.content?.map((c: any) => c.text || "").join("") || "";
          return `[${text}](${item.href || ""})`;
        }
        if (item.type === "mention") return `@${item.userName || "user"}`;
        return "";
      })
      .join("");
  }
  return "";
}

// ─── HTML Export ─────────────────────────────────────────────────────────────

export function exportToHTML(
  blocks: CustomBlock[],
  options: ExportOptions = { format: "html" }
): string {
  const title = options.title || "Document";
  const includeStyles = options.includeStyles !== false;

  const cssStyles = options.cssStyles || getDefaultStyles();

  let html = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n";
  html += `<meta charset="UTF-8">\n`;
  html += `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
  html += `<title>${escapeHtml(title)}</title>\n`;

  if (includeStyles) {
    html += `<style>\n${cssStyles}\n</style>\n`;
  }

  html += "</head>\n<body>\n";
  html += '<div class="document">\n';

  if (options.title) {
    html += `<h1 class="document-title">${escapeHtml(options.title)}</h1>\n`;
  }

  for (const block of blocks) {
    html += blockToHTML(block);
  }

  html += "</div>\n</body>\n</html>";
  return html;
}

function blockToHTML(block: CustomBlock): string {
  const content = extractHTMLContent(block.content);

  switch (block.type) {
    case "heading": {
      const level = (block.props as any)?.level || "1";
      return `<h${level}>${content}</h${level}>\n`;
    }
    case "paragraph":
      return `<p>${content}</p>\n`;
    case "bulletListItem":
      return `<li class="bullet-list">${content}</li>\n`;
    case "numberedListItem":
      return `<li class="numbered-list">${content}</li>\n`;
    case "checkListItem": {
      const checked = (block.props as any)?.checked;
      return `<div class="check-list"><input type="checkbox" ${checked ? "checked" : ""} disabled> ${content}</div>\n`;
    }
    case "todo": {
      const checked = (block.props as any)?.checked;
      return `<div class="todo"><input type="checkbox" ${checked ? "checked" : ""} disabled> ${content}</div>\n`;
    }
    case "toggle": {
      const open = (block.props as any)?.open;
      return `<details ${open ? "open" : ""}>\n<summary>${content}</summary>\n</details>\n`;
    }
    case "callout": {
      const emoji = (block.props as any)?.emoji || "💡";
      const type = (block.props as any)?.type || "info";
      return `<div class="callout callout-${type}"><span class="callout-emoji">${emoji}</span> ${content}</div>\n`;
    }
    case "quote":
      return `<blockquote>${content}</blockquote>\n`;
    case "codeBlock": {
      const lang = (block.props as any)?.language || "";
      return `<pre><code class="language-${lang}">${escapeHtml(content)}</code></pre>\n`;
    }
    case "divider":
      return "<hr>\n";
    case "image": {
      const url = (block.props as any)?.url || "";
      const caption = (block.props as any)?.caption || "";
      const alt = (block.props as any)?.alt || caption;
      return `<figure><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>\n`;
    }
    case "video": {
      const url = (block.props as any)?.url || "";
      return `<div class="video-embed"><video src="${escapeHtml(url)}" controls></video></div>\n`;
    }
    case "audio": {
      const url = (block.props as any)?.url || "";
      return `<div class="audio-embed"><audio src="${escapeHtml(url)}" controls></audio></div>\n`;
    }
    case "file": {
      const url = (block.props as any)?.url || "";
      const name = (block.props as any)?.name || "file";
      return `<a href="${escapeHtml(url)}" class="file-link" download>${escapeHtml(name)}</a>\n`;
    }
    case "embed": {
      const url = (block.props as any)?.url || "";
      const height = (block.props as any)?.height || "400";
      return `<div class="embed"><iframe src="${escapeHtml(url)}" height="${height}" frameborder="0"></iframe></div>\n`;
    }
    case "iframe": {
      const url = (block.props as any)?.url || "";
      const height = (block.props as any)?.height || "400";
      return `<div class="iframe"><iframe src="${escapeHtml(url)}" height="${height}" frameborder="0"></iframe></div>\n`;
    }
    case "bookmark": {
      const url = (block.props as any)?.url || "";
      const bmTitle = (block.props as any)?.title || url;
      const desc = (block.props as any)?.description || "";
      return `<div class="bookmark"><a href="${escapeHtml(url)}" target="_blank"><strong>${escapeHtml(bmTitle)}</strong>${desc ? `<br><small>${escapeHtml(desc)}</small>` : ""}</a></div>\n`;
    }
    case "table":
      return htmlTable(block);
    case "math": {
      const latex = (block.props as any)?.latex || "";
      return `<div class="math-block" data-latex="${escapeHtml(latex)}">$$${escapeHtml(latex)}$$</div>\n`;
    }
    case "diagram": {
      const code = (block.props as any)?.code || "";
      const type = (block.props as any)?.diagramType || "mermaid";
      return `<div class="diagram" data-type="${type}"><pre class="mermaid">${escapeHtml(code)}</pre></div>\n`;
    }
    case "tableOfContents":
      return '<nav class="table-of-contents"><p><em>[Table of Contents - auto-generated]</em></p></nav>\n';
    case "syncedBlock":
      return `<div class="synced-block" data-source="${(block.props as any)?.syncSourceId || ""}"><p><em>[Synced Block]</em></p></div>\n`;
    case "templateVariable":
      return `<span class="template-variable" data-variable="${(block.props as any)?.variableName || ""}">{{${(block.props as any)?.variableName || "variable"}}}</span>\n`;
    case "columns":
      return `<div class="columns columns-${(block.props as any)?.layout || "1-1"}"></div>\n`;
    default:
      return `<div class="block-${block.type}">${content}</div>\n`;
  }
}

function htmlTable(block: CustomBlock): string {
  const content = block.content as any[];
  if (!content || !Array.isArray(content) || content.length === 0) {
    return '<table><tr><td>Empty table</td></tr></table>\n';
  }

  let html = '<table class="editor-table">\n';

  for (let i = 0; i < content.length; i++) {
    const row = content[i];
    if (!row || !Array.isArray(row)) continue;

    const isHeader = i === 0 && (block.props as any)?.headerRow;
    const tag = isHeader ? "th" : "td";

    html += "<tr>\n";
    for (const cell of row) {
      const cellContent = cell?.content?.map((c: any) => c.text || "").join("") || "";
      html += `  <${tag}>${escapeHtml(cellContent)}</${tag}>\n`;
    }
    html += "</tr>\n";
  }

  html += "</table>\n";
  return html;
}

function extractHTMLContent(content: any): string {
  if (!content) return "";
  if (typeof content === "string") return escapeHtml(content);
  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (item.type === "text") {
          let text = escapeHtml(item.text || "");
          if (item.styles?.bold) text = `<strong>${text}</strong>`;
          if (item.styles?.italic) text = `<em>${text}</em>`;
          if (item.styles?.underline) text = `<u>${text}</u>`;
          if (item.styles?.strike) text = `<s>${text}</s>`;
          if (item.styles?.code) text = `<code>${text}</code>`;
          if (item.styles?.highlight) text = `<mark>${text}</mark>`;
          return text;
        }
        if (item.type === "link") {
          const text = item.content?.map((c: any) => c.text || "").join("") || "";
          return `<a href="${escapeHtml(item.href || "")}">${escapeHtml(text)}</a>`;
        }
        if (item.type === "mention") {
          return `<span class="mention">@${escapeHtml(item.userName || "user")}</span>`;
        }
        return "";
      })
      .join("");
  }
  return "";
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getDefaultStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
    .document-title { font-size: 2.5rem; margin-bottom: 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    h1 { font-size: 2rem; margin: 1.5rem 0 0.5rem; }
    h2 { font-size: 1.5rem; margin: 1.25rem 0 0.5rem; }
    h3 { font-size: 1.25rem; margin: 1rem 0 0.5rem; }
    h4, h5, h6 { font-size: 1rem; margin: 0.75rem 0 0.5rem; }
    p { margin: 0.5rem 0; }
    .bullet-list, .numbered-list { margin: 0.25rem 0 0.25rem 1.5rem; }
    .check-list, .todo { display: flex; align-items: center; gap: 0.5rem; margin: 0.25rem 0; }
    .callout { padding: 1rem; border-radius: 8px; margin: 0.5rem 0; border-left: 4px solid; }
    .callout-info { background: #e3f2fd; border-color: #2196f3; }
    .callout-warning { background: #fff3e0; border-color: #ff9800; }
    .callout-error { background: #ffebee; border-color: #f44336; }
    .callout-success { background: #e8f5e9; border-color: #4caf50; }
    .callout-note { background: #f3e5f5; border-color: #9c27b0; }
    .callout-emoji { font-size: 1.25rem; margin-right: 0.5rem; }
    blockquote { border-left: 4px solid #ddd; padding-left: 1rem; margin: 0.5rem 0; color: #666; font-style: italic; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0; }
    code { font-family: 'Fira Code', monospace; }
    hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
    figure { margin: 1rem 0; }
    figure img { max-width: 100%; border-radius: 8px; }
    figcaption { text-align: center; color: #666; font-size: 0.875rem; margin-top: 0.5rem; }
    .video-embed, .audio-embed { margin: 1rem 0; }
    .video-embed video, .audio-embed audio { max-width: 100%; }
    .file-link { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #f5f5f5; border-radius: 4px; text-decoration: none; color: #333; }
    .embed iframe, .iframe iframe { width: 100%; border-radius: 8px; }
    .bookmark { padding: 1rem; border: 1px solid #eee; border-radius: 8px; margin: 0.5rem 0; }
    .bookmark a { text-decoration: none; color: inherit; }
    .table-of-contents { padding: 1rem; background: #f9f9f9; border-radius: 8px; margin: 1rem 0; }
    .editor-table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    .editor-table th, .editor-table td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    .editor-table th { background: #f5f5f5; font-weight: 600; }
    .math-block { padding: 1rem; background: #f9f9f9; border-radius: 8px; margin: 0.5rem 0; text-align: center; font-family: serif; }
    .diagram { padding: 1rem; background: #f9f9f9; border-radius: 8px; margin: 0.5rem 0; }
    .synced-block { border: 2px dashed #ccc; padding: 1rem; border-radius: 8px; margin: 0.5rem 0; }
    .template-variable { background: #fff3cd; padding: 0.125rem 0.375rem; border-radius: 3px; font-family: monospace; }
    .mention { background: #e3f2fd; padding: 0.125rem 0.375rem; border-radius: 3px; color: #1976d2; }
  `;
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

export function exportToPDF(
  blocks: CustomBlock[],
  options: ExportOptions = { format: "pdf" }
): string {
  // Generate HTML that can be printed to PDF
  return exportToHTML(blocks, {
    ...options,
    format: "html",
    includeStyles: true,
    cssStyles: getPdfStyles(options),
  });
}

function getPdfStyles(options: ExportOptions): string {
  const pageSize = options.pageSize || "a4";
  const margin = options.margin || 1;

  return `
    @page {
      size: ${pageSize};
      margin: ${margin}in;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .document { max-width: none; }
      pre { white-space: pre-wrap; word-wrap: break-word; }
      .video-embed, .audio-embed { display: none; }
      .embed iframe, .iframe iframe { border: 1px solid #ccc; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .document { max-width: 100%; }
    .document-title { font-size: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    h1 { font-size: 1.75rem; margin: 1.25rem 0 0.5rem; }
    h2 { font-size: 1.5rem; margin: 1rem 0 0.5rem; }
    h3 { font-size: 1.25rem; margin: 0.75rem 0 0.5rem; }
    p { margin: 0.5rem 0; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 4px; overflow-x: auto; margin: 0.5rem 0; }
    blockquote { border-left: 3px solid #ddd; padding-left: 1rem; margin: 0.5rem 0; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; }
    th { background: #f5f5f5; }
    .callout { padding: 0.75rem; border-radius: 4px; margin: 0.5rem 0; border-left: 3px solid; }
    .callout-info { background: #e3f2fd; border-color: #2196f3; }
    .callout-warning { background: #fff3e0; border-color: #ff9800; }
  `;
}

// ─── DOCX Export ─────────────────────────────────────────────────────────────

export function exportToDOCX(
  blocks: CustomBlock[],
  options: ExportOptions = { format: "docx" }
): string {
  // Generate HTML that can be converted to DOCX
  return exportToHTML(blocks, {
    ...options,
    format: "html",
    includeStyles: true,
    cssStyles: getDocxStyles(),
  });
}

function getDocxStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Calibri, sans-serif; line-height: 1.5; color: #333; }
    .document { max-width: 100%; }
    .document-title { font-size: 24pt; margin-bottom: 0.5rem; }
    h1 { font-size: 20pt; margin: 1rem 0 0.5rem; }
    h2 { font-size: 16pt; margin: 0.75rem 0 0.5rem; }
    h3 { font-size: 14pt; margin: 0.5rem 0 0.25rem; }
    p { margin: 0.25rem 0; }
    pre { background: #f5f5f5; padding: 0.5rem; border: 1px solid #ddd; margin: 0.25rem 0; }
    blockquote { border-left: 3px solid #ccc; padding-left: 0.75rem; margin: 0.25rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.25rem 0; }
    th, td { border: 1px solid #ccc; padding: 0.25rem; }
    th { background: #f0f0f0; }
    .callout { padding: 0.5rem; border: 1px solid #ccc; margin: 0.25rem 0; }
  `;
}

// ─── Markdown Import ─────────────────────────────────────────────────────────

export function importFromMarkdown(
  markdown: string,
  options: ImportOptions = { format: "markdown" }
): ImportResult {
  const blocks: CustomBlock[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Frontmatter
    if (i === 0 && line.trim() === "---") {
      i++;
      while (i < lines.length && lines[i].trim() !== "---") {
        i++;
      }
      i++;
      continue;
    }

    // Code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      blocks.push({
        id: generateId(),
        type: "codeBlock",
        props: { language: lang || "plaintext", theme: "dark", showLineNumbers: false },
        content: [{ type: "text", text: codeLines.join("\n"), styles: {} }],
        children: [],
      } as CustomBlock);
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({
        id: generateId(),
        type: "heading",
        props: { level: String(level) },
        content: parseInlineMarkdown(headingMatch[2]),
        children: [],
      } as CustomBlock);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({
        id: generateId(),
        type: "divider",
        props: {},
        content: [],
        children: [],
      } as CustomBlock);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }

      blocks.push({
        id: generateId(),
        type: "callout",
        props: { type: "info", emoji: "💡" },
        content: parseInlineMarkdown(quoteLines.join(" ")),
        children: [],
      } as CustomBlock);
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const listLines: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        listLines.push(lines[i].replace(/^[-*+]\s/, ""));
        i++;
      }

      for (const listLine of listLines) {
        const checked = listLine.startsWith("[x] ") || listLine.startsWith("[X] ");
        const unchecked = listLine.startsWith("[ ] ");
        const text = checked || unchecked ? listLine.slice(4) : listLine;

        if (checked || unchecked) {
          blocks.push({
            id: generateId(),
            type: "checkListItem",
            props: { checked },
            content: parseInlineMarkdown(text),
            children: [],
          } as CustomBlock);
        } else {
          blocks.push({
            id: generateId(),
            type: "bulletListItem",
            props: {},
            content: parseInlineMarkdown(text),
            children: [],
          } as CustomBlock);
        }
      }
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const listLines: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listLines.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }

      for (const listLine of listLines) {
        blocks.push({
          id: generateId(),
          type: "numberedListItem",
          props: {},
          content: parseInlineMarkdown(listLine),
          children: [],
        } as CustomBlock);
      }
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("---")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }

      const tableContent = tableLines
        .filter((l) => !l.match(/^\|[\s-|]+\|$/))
        .map((l) =>
          l.split("|").filter((c) => c.trim() !== "").map((c) => ({
            content: [{ type: "text", text: c.trim(), styles: {} }],
          }))
        );

      blocks.push({
        id: generateId(),
        type: "table",
        props: { headerRow: true, striped: false, bordered: true },
        content: tableContent,
        children: [],
      } as CustomBlock);
      continue;
    }

    // Image
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      blocks.push({
        id: generateId(),
        type: "image",
        props: { url: imageMatch[2], caption: imageMatch[1], alt: imageMatch[1] },
        content: [],
        children: [],
      } as CustomBlock);
      i++;
      continue;
    }

    // Default: paragraph
    blocks.push({
      id: generateId(),
      type: "paragraph",
      props: {},
      content: parseInlineMarkdown(line),
      children: [],
    } as CustomBlock);
    i++;
  }

  return { blocks, warnings, errors };
}

function parseInlineMarkdown(text: string): any[] {
  const items: any[] = [];
  const regex = /(\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*|`(.+?)`|~~(.+?)~~|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      items.push({ type: "text", text: text.slice(lastIndex, match.index), styles: {} });
    }

    if (match[2] || match[3]) {
      items.push({ type: "text", text: match[2] || match[3], styles: { bold: true } });
    } else if (match[4] || match[5]) {
      items.push({ type: "text", text: match[4] || match[5], styles: { italic: true } });
    } else if (match[6]) {
      items.push({ type: "text", text: match[6], styles: { code: true } });
    } else if (match[7]) {
      items.push({ type: "text", text: match[7], styles: { strike: true } });
    } else if (match[8] && match[9]) {
      items.push({ type: "link", href: match[9], content: [{ type: "text", text: match[8], styles: {} }] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    items.push({ type: "text", text: text.slice(lastIndex), styles: {} });
  }

  if (items.length === 0) {
    items.push({ type: "text", text, styles: {} });
  }

  return items;
}

// ─── HTML Import ─────────────────────────────────────────────────────────────

export function importFromHTML(
  html: string,
  options: ImportOptions = { format: "html" }
): ImportResult {
  const blocks: CustomBlock[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    if (!body) {
      errors.push("No body found in HTML");
      return { blocks, warnings, errors };
    }

    processNode(body, blocks, warnings);
  } catch (error) {
    errors.push(`Failed to parse HTML: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return { blocks, warnings, errors };
}

function processNode(node: Node, blocks: CustomBlock[], warnings: string[]): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        blocks.push({
          id: generateId(),
          type: "paragraph",
          props: {},
          content: [{ type: "text", text, styles: {} }],
          children: [],
        } as CustomBlock);
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      switch (tag) {
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          blocks.push({
            id: generateId(),
            type: "heading",
            props: { level: tag[1] },
            content: [{ type: "text", text: el.textContent || "", styles: {} }],
            children: [],
          } as CustomBlock);
          break;

        case "p":
          blocks.push({
            id: generateId(),
            type: "paragraph",
            props: {},
            content: [{ type: "text", text: el.textContent || "", styles: {} }],
            children: [],
          } as CustomBlock);
          break;

        case "ul":
        case "ol":
          for (const li of Array.from(el.querySelectorAll("li"))) {
            const isCheck = li.querySelector("input[type=checkbox]") !== null;
            const isChecked = (li.querySelector("input[type=checkbox]") as HTMLInputElement)?.checked;

            if (isCheck) {
              blocks.push({
                id: generateId(),
                type: "checkListItem",
                props: { checked: isChecked },
                content: [{ type: "text", text: li.textContent || "", styles: {} }],
                children: [],
              } as CustomBlock);
            } else {
              blocks.push({
                id: generateId(),
                type: tag === "ul" ? "bulletListItem" : "numberedListItem",
                props: {},
                content: [{ type: "text", text: li.textContent || "", styles: {} }],
                children: [],
              } as CustomBlock);
            }
          }
          break;

        case "blockquote":
          blocks.push({
            id: generateId(),
            type: "callout",
            props: { type: "info", emoji: "💡" },
            content: [{ type: "text", text: el.textContent || "", styles: {} }],
            children: [],
          } as CustomBlock);
          break;

        case "pre":
          blocks.push({
            id: generateId(),
            type: "codeBlock",
            props: { language: "plaintext", theme: "dark", showLineNumbers: false },
            content: [{ type: "text", text: el.textContent || "", styles: {} }],
            children: [],
          } as CustomBlock);
          break;

        case "hr":
          blocks.push({
            id: generateId(),
            type: "divider",
            props: {},
            content: [],
            children: [],
          } as CustomBlock);
          break;

        case "img":
          blocks.push({
            id: generateId(),
            type: "image",
            props: {
              url: el.getAttribute("src") || "",
              caption: el.getAttribute("alt") || "",
              alt: el.getAttribute("alt") || "",
            },
            content: [],
            children: [],
          } as CustomBlock);
          break;

        case "table": {
          const rows: any[][] = [];
          for (const tr of Array.from(el.querySelectorAll("tr"))) {
            const cells: any[] = [];
            for (const td of Array.from(tr.querySelectorAll("td, th"))) {
              cells.push({
                content: [{ type: "text", text: td.textContent || "", styles: {} }],
              });
            }
            rows.push(cells);
          }

          blocks.push({
            id: generateId(),
            type: "table",
            props: { headerRow: true, striped: false, bordered: true },
            content: rows,
            children: [],
          } as CustomBlock);
          break;
        }

        default:
          if (el.textContent?.trim()) {
            blocks.push({
              id: generateId(),
              type: "paragraph",
              props: {},
              content: [{ type: "text", text: el.textContent.trim(), styles: {} }],
              children: [],
            } as CustomBlock);
          }
          break;
      }
    }
  }
}

// ─── DOCX Import (Basic) ────────────────────────────────────────────────────

export function importFromDOCX(
  content: string,
  options: ImportOptions = { format: "docx" }
): ImportResult {
  // Basic DOCX import - treats the content as HTML
  // Full DOCX parsing would require a library like mammoth.js
  return importFromHTML(content, { ...options, format: "html" });
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function detectFormat(content: string): ImportFormat {
  if (content.trim().startsWith("<!DOCTYPE") || content.trim().startsWith("<html")) {
    return "html";
  }
  if (content.includes("<?xml") || content.includes("<w:")) {
    return "docx";
  }
  return "markdown";
}

export function autoImport(
  content: string,
  options?: ImportOptions
): ImportResult {
  const format = options?.format || detectFormat(content);

  switch (format) {
    case "markdown":
      return importFromMarkdown(content, options);
    case "html":
      return importFromHTML(content, options);
    case "docx":
      return importFromDOCX(content, options);
    default:
      return importFromMarkdown(content, options);
  }
}

export function getExportMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    markdown: "text/markdown",
    html: "text/html",
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeTypes[format];
}

export function getExportExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    markdown: ".md",
    html: ".html",
    pdf: ".pdf",
    docx: ".docx",
  };
  return extensions[format];
}
