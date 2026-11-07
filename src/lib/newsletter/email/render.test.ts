import { describe, expect, it } from "vitest";
import { tokenValue } from "@/lib/tokens";
import { blocksToHtml, blocksToText } from "./blocks";
import { UNSUBSCRIBE_PLACEHOLDER, renderConfirmation, renderIssue } from "./render";
import { theme } from "./theme";
import type { EmailBlock, Footer, IssueData } from "./types";

const para = (text: string, extra?: Partial<EmailBlock>): EmailBlock => ({
  _type: "block",
  children: [{ _type: "span", text }],
  ...extra,
});

const issue: IssueData = {
  id: "issue-1",
  subject: "Studio notes No. 1",
  preheader: "Beta is open",
  issueLine: "Studio notes · No. 1",
  headline: "Big news this month",
  intro: [para("Hello explorers")],
  sections: [
    {
      kind: "game",
      title: "Exoplanet Explorer",
      image: { src: "https://cdn.example.com/a.jpg", alt: "Art A", width: 1200, height: 600 },
      chips: [
        { label: "BETA TESTING", tone: "accent" },
        { label: "Android", tone: "outline" },
      ],
      body: [para("Join the beta")],
      button: { label: "Join the beta", href: "https://www.example.com/games/ee?a=1&b=2#beta", tone: "accent" },
    },
    {
      kind: "game",
      title: "TerraForge",
      image: null,
      chips: [],
      body: [para("Terraform worlds")],
      button: { label: "Game details", href: "https://www.example.com/games/tf", tone: "outline" },
    },
    {
      kind: "free",
      eyebrow: "Also new",
      title: "Molecular",
      image: null,
      body: [para("A little science")],
      button: null,
    },
  ],
};

const footer: Footer = {
  siteUrl: "https://www.example.com",
  mailingAddress: "1 Main St, Springfield",
  viewInBrowserUrl: "https://www.example.com/newsletter/issue-1",
  unsubscribe: "placeholder",
};

describe("renderIssue", () => {
  const out = renderIssue(issue, footer);

  it("contains headline, intro, titles in order, chips and buttons", () => {
    expect(out.subject).toBe("Studio notes No. 1");
    for (const s of ["Big news this month", "Hello explorers", "BETA TESTING", "Android", "Join the beta", "Game details"]) {
      expect(out.html).toContain(s);
    }
    const i1 = out.html.indexOf("Exoplanet Explorer");
    const i2 = out.html.indexOf("TerraForge");
    const i3 = out.html.indexOf("Molecular");
    expect(i1).toBeGreaterThan(-1);
    expect(i2).toBeGreaterThan(i1);
    expect(i3).toBeGreaterThan(i2);
    expect(out.html).toContain('href="https://www.example.com/games/ee?a=1&amp;b=2#beta"');
    expect(out.html).toContain('href="https://www.example.com/games/tf"');
    expect(out.text).toContain("https://www.example.com/games/tf");
  });

  it("is an email-safe document", () => {
    expect(out.html.toLowerCase().startsWith("<!doctype html>")).toBe(true);
    expect(out.html).toContain('<meta charset="utf-8">');
    expect(out.html).toContain('name="viewport"');
    expect(out.html).not.toContain("<style");
    expect(out.html).toContain('role="presentation"');
    expect(out.html).toMatch(/<body[^>]*>\s*<span[^>]*display:none[^>]*>Beta is open/);
  });

  it("renders no img for a section without an image; every img has dimensions and alt", () => {
    const imgs = out.html.match(/<img\b[^>]*>/g) ?? [];
    // logo (header), art A, logo (footer)
    expect(imgs).toHaveLength(3);
    for (const img of imgs) {
      expect(img).toMatch(/\swidth="\d+"/);
      expect(img).toMatch(/\sheight="\d+"/);
      expect(img).toMatch(/\salt="/);
    }
    const noImage = renderIssue({ ...issue, sections: issue.sections.slice(1) }, footer);
    expect(noImage.html).not.toContain("https://cdn.example.com/a.jpg");
  });

  it("footer has address and unsubscribe handling", () => {
    expect(out.html).toContain("1 Main St, Springfield");
    expect(out.text).toContain("1 Main St, Springfield");
    expect(UNSUBSCRIBE_PLACEHOLDER).toBe("{{{ pm:unsubscribe }}}");
    expect(out.html).toContain('href="{{{ pm:unsubscribe }}}"');
    expect(out.text).toContain("Unsubscribe: {{{ pm:unsubscribe }}}");
    const note = renderIssue(issue, { ...footer, unsubscribe: "note" });
    expect(note.html).not.toContain("pm:unsubscribe");
    expect(note.text).not.toContain("pm:unsubscribe");
    expect(note.html).toContain("(Unsubscribe link appears here)");
  });

  it("omits View in browser when there is no url", () => {
    expect(out.html).toContain("View in browser");
    const none = renderIssue(issue, { ...footer, viewInBrowserUrl: null });
    expect(none.html).not.toContain("View in browser");
    expect(none.text).not.toContain("View in browser");
  });

  it("uses a JPEG watercolor background fallback on free sections, never WebP", () => {
    expect(out.html).toContain('background="https://www.example.com/brand/watercolor-wash.jpg"');
    expect(out.html).toContain("url('https://www.example.com/brand/watercolor-wash.jpg')");
    expect(out.html).not.toMatch(/\.webp/i);
  });

  it("card images are as wide as the cell they sit in (page minus outer and inner padding)", () => {
    const cell = theme.width - 2 * 24 - 2 * 20;
    expect(cell).toBe(512);
    const art = (out.html.match(/<img\b[^>]*>/g) ?? []).find((i) => i.includes("cdn.example.com/a.jpg"))!;
    expect(art).toContain(`width="${cell}"`);
    expect(art).toContain(`height="${cell / 2}"`);
    expect(out.html).toContain("padding:0 24px 24px 24px;");
    expect(out.html).toContain("padding:20px;");
  });

  it("has no undefined/null and only token colours", () => {
    for (const s of [out.html, out.text]) {
      expect(s).not.toMatch(/undefined|\bnull\b/);
    }
    expect(out.html).toContain(tokenValue("--color-accent"));
    const allowed = new Set(
      [
        "--color-paper", "--color-card", "--color-sand", "--color-line", "--color-ink", "--color-ink-2",
        "--color-ink-3", "--color-accent", "--color-link", "--color-on-dark", "--color-on-dark-2",
        "--color-on-dark-3", "--color-on-dark-4", "--color-dark-line",
      ].map((n) => tokenValue(n).toLowerCase()),
    );
    for (const m of out.html.match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
      expect(allowed.has(m.toLowerCase())).toBe(true);
    }
  });

  it("escapes text everywhere", () => {
    const evil = renderIssue(
      { ...issue, headline: "<script>x</script>", issueLine: '"><img src=x>' },
      { ...footer, mailingAddress: "<b>addr</b>" },
    );
    expect(evil.html).not.toContain("<script>");
    expect(evil.html).not.toContain("<b>addr</b>");
    expect(evil.html).not.toContain('"><img src=x>');
  });
});

describe("blocks", () => {
  it("escapes html", () => {
    expect(blocksToHtml([para("<script>alert(1)</script>")])).not.toContain("<script>");
    expect(blocksToHtml([para("a & b")])).toContain("a &amp; b");
  });

  it("drops javascript links but keeps text, keeps mailto and https", () => {
    const mk = (href: string): EmailBlock => ({
      _type: "block",
      markDefs: [{ _key: "k", _type: "link", href }],
      children: [{ _type: "span", text: "click", marks: ["k"] }],
    });
    const bad = blocksToHtml([mk("javascript:alert(1)")]);
    expect(bad).toContain("click");
    expect(bad).not.toContain("javascript:");
    expect(bad).not.toContain("<a ");
    expect(blocksToHtml([mk("mailto:a@b.com")])).toContain('href="mailto:a@b.com"');
    expect(blocksToHtml([mk("https://x.com/a")])).toContain('href="https://x.com/a"');
    expect(blocksToHtml([mk("/relative")])).not.toContain("<a ");
  });

  it("renders strong and em; text output shows links", () => {
    const b: EmailBlock = {
      _type: "block",
      markDefs: [{ _key: "k", _type: "link", href: "https://x.com" }],
      children: [
        { _type: "span", text: "bold", marks: ["strong"] },
        { _type: "span", text: " it", marks: ["em"] },
        { _type: "span", text: " link", marks: ["k"] },
      ],
    };
    const html = blocksToHtml([b]);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em> it</em>");
    expect(blocksToText([b, para("two")])).toBe("bold it link (https://x.com)\n\ntwo");
  });
});

describe("renderConfirmation", () => {
  const opts = {
    confirmUrl: "https://www.example.com/newsletter/confirm?t=abc&u=1",
    siteUrl: "https://www.example.com",
    mailingAddress: "1 Main St",
  };
  it("has the confirm link as a button and in text, no unsubscribe placeholder", () => {
    const out = renderConfirmation(opts);
    expect(out.subject).toBe("Confirm your inkOrange Studios newsletter subscription");
    expect(out.html).toContain('href="https://www.example.com/newsletter/confirm?t=abc&amp;u=1"');
    expect(out.text).toContain(opts.confirmUrl);
    expect(out.html).not.toContain("pm:unsubscribe");
    expect(out.text).not.toContain("pm:unsubscribe");
    expect(out.html).toContain("1 Main St");
  });
  it("omits the address line when mailingAddress is null", () => {
    const out = renderConfirmation({ ...opts, mailingAddress: null });
    expect(out.html).not.toContain("1 Main St");
    expect(out.html).not.toMatch(/undefined|\bnull\b/);
    expect(out.text).not.toMatch(/undefined|\bnull\b/);
  });
});
