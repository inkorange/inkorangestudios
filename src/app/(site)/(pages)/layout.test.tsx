import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

// SiteFooterBlock is an async server component (tested on its own); stub it to see what the layout asks for.
const footer = vi.hoisted(() =>
  vi.fn((props: { variant: string; stickyBarSpace?: boolean }) => (
    <footer data-variant={props.variant} data-sticky-bar={String(Boolean(props.stickyBarSpace))} />
  )),
);
vi.mock("@/components/site/SiteFooterBlock", () => ({ SiteFooterBlock: footer }));

import PagesLayout from "./layout";

it("puts the page in <main> followed by the full footer", async () => {
  render(await PagesLayout({ children: <p>Page body</p> }));
  expect(within(screen.getByRole("main")).getByText("Page body")).toBeInTheDocument();
  const contentinfo = screen.getByRole("contentinfo");
  expect(contentinfo).toHaveAttribute("data-variant", "full");
  expect(contentinfo).toHaveAttribute("data-sticky-bar", "false");
  expect(screen.getByRole("main").compareDocumentPosition(contentinfo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(footer.mock.calls[0][0]).toEqual({ variant: "full" });
});
