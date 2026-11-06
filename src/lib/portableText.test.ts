import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "@/lib/sanity/types";
import { splitLead } from "./portableText";

const para = (key: string, ...texts: string[]): PortableTextBlock => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: texts.map((text, i) => ({ _type: "span", _key: `${key}${i}`, text, marks: [] })),
});

describe("splitLead", () => {
  it("returns no lead and no rest for empty content", () => {
    expect(splitLead([])).toEqual({ lead: null, rest: [] });
  });

  it("takes the first paragraph's plain text as the lead and keeps the rest as blocks", () => {
    const second = para("b", "Second.");
    expect(splitLead([para("a", "TerraForge is ", "a sandbox."), second])).toEqual({ lead: "TerraForge is a sandbox.", rest: [second] });
  });

  it("leaves everything to RichText when the first block is not a plain paragraph", () => {
    const heading = { ...para("h", "Heading"), style: "h2" };
    const item = { ...para("l", "Item"), listItem: "bullet", level: 1 };
    expect(splitLead([heading, para("a", "x")])).toEqual({ lead: null, rest: [heading, para("a", "x")] });
    expect(splitLead([item])).toEqual({ lead: null, rest: [item] });
  });

  it("skips a blank first paragraph instead of rendering an empty lead", () => {
    const second = para("b", "Second.");
    expect(splitLead([para("a", "  "), second])).toEqual({ lead: null, rest: [second] });
  });
});
