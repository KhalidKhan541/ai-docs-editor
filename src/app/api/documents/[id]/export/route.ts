import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
} from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "markdown";

    const document = await prismadb.document.findUnique({
      where: { id: params.id },
      include: {
        blocks: { orderBy: { order: "asc" } },
        author: { select: { id: true, name: true } },
      },
    });

    if (!document) return errorResponse("Document not found", 404);

    const content = document.content as Record<string, unknown>;

    let exportData: string;

    switch (format) {
      case "html": {
        const blocks = document.blocks
          .map((block) => {
            const blockContent = block.content as Record<string, unknown>;
            const text = (blockContent.text as string) ?? "";
            switch (block.type) {
              case "heading":
                return `<h1>${text}</h1>`;
              case "paragraph":
                return `<p>${text}</p>`;
              case "list":
                return `<li>${text}</li>`;
              case "code":
                return `<pre><code>${text}</code></pre>`;
              case "quote":
                return `<blockquote>${text}</blockquote>`;
              default:
                return `<div>${text}</div>`;
            }
          })
          .join("\n");

        exportData = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${document.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 75ch; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { margin-bottom: 1rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    blockquote { border-left: 3px solid #333; margin-left: 0; padding-left: 1rem; color: #666; }
  </style>
</head>
<body>
  <h1>${document.title}</h1>
  <p><em>By ${document.author.name ?? "Unknown"}</em></p>
  <hr>
  ${blocks}
</body>
</html>`;
        break;
      }
      case "json": {
        exportData = JSON.stringify(
          {
            title: document.title,
            author: document.author.name,
            content,
            blocks: document.blocks.map((b) => ({
              type: b.type,
              content: b.content,
            })),
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
        break;
      }
      case "plain": {
        const plainBlocks = document.blocks
          .map((block) => {
            const blockContent = block.content as Record<string, unknown>;
            return (blockContent.text as string) ?? "";
          })
          .filter(Boolean)
          .join("\n\n");

        exportData = `${document.title}\n${"=".repeat(document.title.length)}\n\nBy ${document.author.name ?? "Unknown"}\n\n${plainBlocks}`;
        break;
      }
      default: {
        const mdBlocks = document.blocks
          .map((block) => {
            const blockContent = block.content as Record<string, unknown>;
            const text = (blockContent.text as string) ?? "";
            switch (block.type) {
              case "heading":
                return `# ${text}`;
              case "paragraph":
                return text;
              case "list":
                return `- ${text}`;
              case "code":
                return "```\n" + text + "\n```";
              case "quote":
                return `> ${text}`;
              default:
                return text;
            }
          })
          .join("\n\n");

        exportData = `# ${document.title}\n\nBy ${document.author.name ?? "Unknown"}\n\n${mdBlocks}`;
        break;
      }
    }

    const contentTypes: Record<string, string> = {
      markdown: "text/markdown",
      html: "text/html",
      json: "application/json",
      plain: "text/plain",
    };

    return new Response(exportData, {
      headers: {
        "Content-Type": contentTypes[format] ?? "text/plain",
        "Content-Disposition": `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, "_")}.${format === "markdown" ? "md" : format}"`,
      },
    });
  } catch (error) {
    console.error("[DOCUMENT_EXPORT]", error);
    return errorResponse("Internal server error", 500);
  }
}
