import { theme } from "./theme";
import type { EmailBlock } from "./types";

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Absolute http(s) or mailto URL, or null. */
export function safeHref(href: string | undefined | null): string | null {
  if (!href) return null;
  try {
    const u = new URL(href.trim());
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? href.trim() : null;
  } catch {
    return null;
  }
}

function linkFor(block: EmailBlock, marks: string[] | undefined): string | null {
  for (const m of marks ?? []) {
    const def = block.markDefs?.find((d) => d._key === m && d._type === "link");
    if (def) return safeHref(def.href);
  }
  return null;
}

export function blocksToHtml(blocks: EmailBlock[]): string {
  return blocks
    .map((block) => {
      const inner = block.children
        .map((span) => {
          let html = esc(span.text).replace(/\n/g, "<br>");
          const marks = span.marks ?? [];
          if (marks.includes("strong")) html = `<strong>${html}</strong>`;
          if (marks.includes("em")) html = `<em>${html}</em>`;
          const href = linkFor(block, marks);
          if (href) {
            html = `<a href="${esc(href)}" style="color:${theme.link};text-decoration:underline;">${html}</a>`;
          }
          return html;
        })
        .join("");
      return `<p style="margin:0 0 14px 0;">${inner}</p>`;
    })
    .join("");
}

export function blocksToText(blocks: EmailBlock[]): string {
  return blocks
    .map((block) =>
      block.children
        .map((span) => {
          const href = linkFor(block, span.marks);
          if (!href) return span.text;
          const shown = href.replace(/^mailto:/, "");
          return span.text.trim() === shown || span.text.trim() === href ? span.text : `${span.text} (${href})`;
        })
        .join(""),
    )
    .join("\n\n");
}
