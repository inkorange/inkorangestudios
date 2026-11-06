import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
vi.mock("next/link", () => ({
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className} data-next-link="true">
      {children}
    </a>
  ),
}));

import { RichText } from "./RichText";

const block = (style: string, text: string, extra: object = {}) => ({
  _type: "block",
  _key: text,
  style,
  markDefs: [],
  children: [{ _type: "span", _key: `${text}s`, text, marks: [] }],
  ...extra,
});

it("renders headings, paragraphs and lists", () => {
  render(
    <RichText
      value={[
        block("h2", "Heading"),
        block("normal", "Paragraph"),
        block("normal", "Item", { listItem: "bullet", level: 1 }),
        block("blockquote", "Quote"),
      ]}
    />,
  );
  expect(screen.getByRole("heading", { level: 2, name: "Heading" })).toBeVisible();
  expect(screen.getByText("Paragraph")).toBeVisible();
  expect(screen.getByRole("listitem")).toHaveTextContent("Item");
  expect(screen.getByText("Quote").closest("blockquote")).not.toBeNull();
});
it("opens external links in a new tab with rel noopener", () => {
  render(
    <RichText
      value={[
        {
          _type: "block", _key: "k", style: "normal",
          markDefs: [{ _type: "link", _key: "l1", href: "https://example.com" }, { _type: "link", _key: "l2", href: "/about" }],
          children: [
            { _type: "span", _key: "a", text: "Ext", marks: ["l1"] },
            { _type: "span", _key: "b", text: "Int", marks: ["l2"] },
          ],
        },
      ]}
    />,
  );
  const ext = screen.getByRole("link", { name: "Ext" });
  expect(ext).toHaveAttribute("target", "_blank");
  expect(ext.getAttribute("rel")).toContain("noopener");
  const int = screen.getByRole("link", { name: "Int" });
  expect(int).not.toHaveAttribute("target");
  expect(int).toHaveAttribute("href", "/about");
  expect(int).toHaveAttribute("data-next-link", "true");
});
