import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/design" }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import DesignPage, { metadata } from "./page";

it("is never indexed", () => {
  expect(metadata.robots).toEqual({ index: false, follow: false });
  expect(metadata.title).toBe("Design system — inkOrange Studios");
});

it("renders the gallery in a main landmark", () => {
  render(<DesignPage />);
  expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { level: 1, name: "Design system" }));
});
