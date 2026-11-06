import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import GlobalError from "./global-error";

it("renders its own document with a message and a retry button", () => {
  const html = renderToStaticMarkup(<GlobalError error={new Error("x")} retry={vi.fn()} reset={vi.fn()} />);
  expect(html).toMatch(/^<html lang="en">/);
  expect(html).toContain("<body>");
  expect(html).toContain("<h1>Something went wrong</h1>");
  expect(html).toContain(">Try again</button>");
});
