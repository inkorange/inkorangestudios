import type { PortableTextBlock, RichBody } from "@/lib/sanity/types";

type Span = { _type?: unknown; text?: unknown };

function isPlainParagraph(block: RichBody[number]): block is PortableTextBlock {
  const b = block as PortableTextBlock & { style?: string; listItem?: string };
  return b._type === "block" && (b.style ?? "normal") === "normal" && !b.listItem;
}

function plainText(block: PortableTextBlock): string {
  const children = (block as { children?: Span[] }).children ?? [];
  return children
    .map((child) => (child._type === "span" && typeof child.text === "string" ? child.text : ""))
    .join("")
    .trim();
}

/**
 * Splits a description into a lead line (the first paragraph, as plain text) and
 * the blocks that follow it. When the first block isn't a plain paragraph there is
 * no lead and everything stays rich text; a blank first paragraph is dropped.
 */
export function splitLead(blocks: RichBody): { lead: string | null; rest: RichBody } {
  const [first, ...rest] = blocks;
  if (!first || !isPlainParagraph(first)) return { lead: null, rest: blocks };
  const lead = plainText(first);
  return { lead: lead || null, rest };
}
