import { blocksToHtml, blocksToText, esc, safeHref } from "./blocks";
import { theme } from "./theme";
import type {
  EmailButton,
  EmailChip,
  EmailImage,
  EmailSection,
  Footer,
  IssueData,
  RenderedEmail,
} from "./types";

/** Postmark swaps this for each recipient's unsubscribe link. The view-in-browser route replaces it too. */
export const UNSUBSCRIBE_PLACEHOLDER = "{{{ pm:unsubscribe }}}";
const UNSUB = UNSUBSCRIBE_PLACEHOLDER;
const UNSUB_NOTE = "(Unsubscribe link appears here)";
const REASON = "You're getting this because you signed up at inkorangestudios.com.";
const CONFIRM_REASON =
  "You're getting this because someone signed up at inkorangestudios.com with this email address.";
const LOGO = { width: 160, height: 60 };
/** Horizontal padding around a card (the page gutter) and inside it. */
const CARD_GUTTER = 24;
const CARD_PADDING = 20;
/** The cell a card's image sits in: Outlook stretches anything wider. */
const CARD_WIDTH = theme.width - 2 * CARD_GUTTER - 2 * CARD_PADDING;

const base = (siteUrl: string) => siteUrl.replace(/\/+$/, "");
const lines = (s: string) => esc(s).replace(/\r?\n/g, "<br>");

function logo(siteUrl: string, align = "center"): string {
  return `<img src="${esc(`${base(siteUrl)}/brand/inkorange-logo.png`)}" width="${LOGO.width}" height="${LOGO.height}" alt="inkOrange Studios" style="display:block;border:0;outline:none;height:auto;${align === "center" ? "margin:0 auto;" : ""}">`;
}

function image(img: EmailImage): string {
  const height = Math.round((CARD_WIDTH * img.height) / img.width);
  return `<img src="${esc(img.src)}" width="${CARD_WIDTH}" height="${height}" alt="${esc(img.alt)}" style="display:block;border:0;outline:none;width:100%;height:auto;border-radius:${theme.radiusImage};">`;
}

function chip(c: EmailChip): string {
  const accent = c.tone === "accent";
  const style = [
    "display:inline-block",
    "margin:0 6px 6px 0",
    "padding:6px 12px",
    "border-radius:" + theme.radiusPill,
    `font-family:${theme.fontDisplay}`,
    "font-size:13px",
    "line-height:14px",
    "font-weight:700",
    "letter-spacing:0.08em",
    "text-transform:uppercase",
    accent ? `background-color:${theme.accent};color:${theme.ink};border:1px solid ${theme.accent}` : `color:${theme.ink};border:1px solid ${theme.ink}`,
  ].join(";");
  return `<span style="${style}">${esc(c.label)}</span>`;
}

function button(b: EmailButton | null): { html: string; href: string | null } {
  const href = b ? safeHref(b.href) : null;
  if (!b || !href) return { html: "", href: null };
  const accent = b.tone === "accent";
  const bg = accent ? `background-color:${theme.accent};` : "";
  const border = accent ? theme.accent : theme.ink;
  return {
    href,
    html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td ${accent ? `bgcolor="${theme.accent}" ` : ""}style="${bg}border:2px solid ${border};border-radius:${theme.radiusPill};"><a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:${theme.fontDisplay};font-size:17px;line-height:18px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${theme.ink};text-decoration:none;">${esc(b.label)}</a></td></tr></table>`,
  };
}

function section(s: EmailSection): string {
  const free = s.kind === "free";
  const wrapAttrs = free
    ? `bgcolor="${theme.sand}" style="background-color:${theme.sand};border-radius:${theme.radiusCard};"`
    : `bgcolor="${theme.card}" style="background-color:${theme.card};border:1px solid ${theme.line};border-radius:${theme.radiusCard};"`;
  const parts: string[] = [];
  if (s.image) parts.push(`<tr><td style="padding:0 0 18px 0;">${image(s.image)}</td></tr>`);
  if (s.kind === "game" && s.chips.length) {
    parts.push(`<tr><td style="padding:0 0 4px 0;font-size:0;line-height:0;">${s.chips.map(chip).join("")}</td></tr>`);
  }
  if (s.kind === "free" && s.eyebrow) {
    parts.push(
      `<tr><td style="padding:0 0 6px 0;font-family:${theme.fontDisplay};font-size:14px;line-height:16px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${theme.ink2};">${esc(s.eyebrow)}</td></tr>`,
    );
  }
  parts.push(
    `<tr><td style="padding:0 0 10px 0;font-family:${theme.fontDisplay};font-size:30px;line-height:32px;font-weight:700;text-transform:uppercase;color:${theme.ink};"><h2 style="margin:0;font:inherit;text-transform:inherit;color:inherit;">${esc(s.title)}</h2></td></tr>`,
  );
  parts.push(
    `<tr><td style="padding:0 0 8px 0;font-family:${theme.fontBody};font-size:16px;line-height:25px;color:${theme.ink2};">${blocksToHtml(s.body)}</td></tr>`,
  );
  const btn = button(s.button);
  if (btn.href) parts.push(`<tr><td style="padding:8px 0 0 0;">${btn.html}</td></tr>`);
  return `<tr><td style="padding:0 ${CARD_GUTTER}px ${CARD_GUTTER}px ${CARD_GUTTER}px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ${wrapAttrs}><tr><td style="padding:${CARD_PADDING}px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${parts.join("")}</table></td></tr></table></td></tr>`;
}

function sectionText(s: EmailSection): string {
  const out: string[] = [];
  if (s.kind === "free" && s.eyebrow) out.push(s.eyebrow.toUpperCase());
  out.push(s.title.toUpperCase());
  if (s.kind === "game" && s.chips.length) out.push(s.chips.map((c) => `[${c.label}]`).join(" "));
  const body = blocksToText(s.body);
  if (body) out.push(body);
  const b = s.button;
  const href = b ? safeHref(b.href) : null;
  if (b && href) out.push(`${b.label}: ${href}`);
  return out.join("\n\n");
}

function document(opts: { title: string; preheader: string | null; rows: string; footer: string }): string {
  const pre = opts.preheader
    ? `<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${esc(opts.preheader)}${"&zwnj;&nbsp;".repeat(30)}</span>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${theme.paper};">
${pre}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${theme.paper}" style="background-color:${theme.paper};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="${theme.width}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${theme.width}px;">
${opts.rows}
${opts.footer}
</table>
</td></tr></table>
</body>
</html>`;
}

function footerHtml(opts: {
  siteUrl: string;
  mailingAddress: string | null;
  viewInBrowserUrl?: string | null;
  unsubscribe?: Footer["unsubscribe"];
  reason?: string;
}): string {
  const linkStyle = `color:${theme.onDark};text-decoration:underline;`;
  const links: string[] = [];
  if (opts.unsubscribe === "placeholder") links.push(`<a href="${UNSUB}" style="${linkStyle}">Unsubscribe</a>`);
  if (opts.unsubscribe === "note") links.push(`<span style="color:${theme.onDark2};">${UNSUB_NOTE}</span>`);
  const view = opts.viewInBrowserUrl ? safeHref(opts.viewInBrowserUrl) : null;
  if (view) links.push(`<a href="${esc(view)}" style="${linkStyle}">View in browser</a>`);
  const text = `font-family:${theme.fontBody};font-size:13px;line-height:20px;color:${theme.onDark2};`;
  return `<tr><td style="padding:0 0 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${theme.ink}" style="background-color:${theme.ink};border-radius:${theme.radiusCard};"><tr><td align="center" style="padding:32px 24px;">
${logo(opts.siteUrl)}
<p style="margin:18px 0 0 0;${text}">${esc(opts.reason ?? REASON)}</p>
${links.length ? `<p style="margin:10px 0 0 0;${text}">${links.join(" &nbsp;·&nbsp; ")}</p>` : ""}
${opts.mailingAddress ? `<p style="margin:14px 0 0 0;font-family:${theme.fontBody};font-size:12px;line-height:18px;color:${theme.onDark4};">${lines(opts.mailingAddress)}</p>` : ""}
</td></tr></table></td></tr>`;
}

function footerText(opts: {
  mailingAddress: string | null;
  viewInBrowserUrl?: string | null;
  unsubscribe?: Footer["unsubscribe"];
}): string {
  const out = ["--", REASON];
  if (opts.unsubscribe === "placeholder") out.push(`Unsubscribe: ${UNSUB}`);
  if (opts.unsubscribe === "note") out.push(UNSUB_NOTE);
  const view = opts.viewInBrowserUrl ? safeHref(opts.viewInBrowserUrl) : null;
  if (view) out.push(`View in browser: ${view}`);
  if (opts.mailingAddress) out.push(opts.mailingAddress);
  return out.join("\n");
}

export function renderIssue(issue: IssueData, footer: Footer): RenderedEmail {
  const siteUrl = footer.siteUrl;
  const head = [
    `<tr><td align="center" style="padding:0 0 20px 0;">${logo(siteUrl)}</td></tr>`,
  ];
  if (issue.issueLine) {
    head.push(
      `<tr><td align="center" style="padding:0 24px 20px 24px;font-family:${theme.fontDisplay};font-size:15px;line-height:18px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${theme.ink3};">${esc(issue.issueLine)}</td></tr>`,
    );
  }
  if (issue.headline) {
    head.push(
      `<tr><td style="padding:0 24px 12px 24px;font-family:${theme.fontDisplay};font-size:44px;line-height:46px;font-weight:700;text-transform:uppercase;color:${theme.ink};"><h1 style="margin:0;font:inherit;text-transform:inherit;color:inherit;">${esc(issue.headline)}</h1></td></tr>`,
    );
  }
  if (issue.intro.length) {
    head.push(
      `<tr><td style="padding:0 24px 24px 24px;font-family:${theme.fontBody};font-size:17px;line-height:27px;color:${theme.ink2};">${blocksToHtml(issue.intro)}</td></tr>`,
    );
  }
  const rows = [...head, ...issue.sections.map((s) => section(s))].join("\n");
  const html = document({
    title: issue.subject,
    preheader: issue.preheader,
    rows,
    footer: footerHtml({
      siteUrl,
      mailingAddress: footer.mailingAddress,
      viewInBrowserUrl: footer.viewInBrowserUrl,
      unsubscribe: footer.unsubscribe,
    }),
  });

  const textParts: string[] = [];
  if (issue.issueLine) textParts.push(issue.issueLine);
  if (issue.headline) textParts.push(issue.headline.toUpperCase());
  const intro = blocksToText(issue.intro);
  if (intro) textParts.push(intro);
  textParts.push(...issue.sections.map(sectionText));
  textParts.push(footerText(footer));
  return { subject: issue.subject, html, text: textParts.join("\n\n") + "\n" };
}

export function renderConfirmation(opts: {
  confirmUrl: string;
  siteUrl: string;
  mailingAddress: string | null;
}): RenderedEmail {
  const subject = "Confirm your inkOrange Studios newsletter subscription";
  const btn = button({ label: "Confirm subscription", href: opts.confirmUrl, tone: "accent" });
  const rows = [
    `<tr><td align="center" style="padding:0 0 24px 0;">${logo(opts.siteUrl)}</td></tr>`,
    `<tr><td style="padding:0 24px 12px 24px;font-family:${theme.fontDisplay};font-size:36px;line-height:38px;font-weight:700;text-transform:uppercase;color:${theme.ink};"><h1 style="margin:0;font:inherit;text-transform:inherit;color:inherit;">Confirm your subscription</h1></td></tr>`,
    `<tr><td style="padding:0 24px 20px 24px;font-family:${theme.fontBody};font-size:16px;line-height:25px;color:${theme.ink2};">Thanks for signing up for the inkOrange Studios newsletter. Confirm your email address to start getting studio notes. If you didn't sign up, you can ignore this email and nothing will happen.</td></tr>`,
    `<tr><td style="padding:0 24px 28px 24px;">${btn.html}</td></tr>`,
  ].join("\n");
  const html = document({
    title: subject,
    preheader: "Confirm your email address to finish subscribing.",
    rows,
    footer: footerHtml({ siteUrl: opts.siteUrl, mailingAddress: opts.mailingAddress, reason: CONFIRM_REASON }),
  });
  const text = [
    "CONFIRM YOUR SUBSCRIPTION",
    "Thanks for signing up for the inkOrange Studios newsletter. Confirm your email address to start getting studio notes. If you didn't sign up, you can ignore this email and nothing will happen.",
    `Confirm subscription: ${opts.confirmUrl}`,
    ["--", CONFIRM_REASON, opts.mailingAddress]
      .filter(Boolean)
      .join("\n"),
  ].join("\n\n");
  return { subject, html, text: text + "\n" };
}
