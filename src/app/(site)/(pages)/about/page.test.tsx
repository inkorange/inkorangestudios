import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { SiteSettings } from "@/lib/sanity/types";

const content = vi.hoisted(() => ({ getSettings: vi.fn() }));
vi.mock("@/lib/sanity/content", () => content);
vi.mock("@/app/actions/contact", () => ({ sendContactMessage: vi.fn() }));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import About, { revalidate } from "./page";

it("revalidates hourly", () => expect(revalidate).toBe(3600));

it("renders the studio story, values and a contact form", async () => {
  content.getSettings.mockResolvedValue({ studioPhoto: null } as SiteSettings);
  const { container } = render(await About());
  expect(screen.getByText("THE STUDIO")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "A small studio with a big backlog of ideas." })).toBeInTheDocument();
  expect(screen.getByText(/Every title runs on SpaceUI/)).toBeInTheDocument();
  expect(screen.getByText("Play first")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Get in touch" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
  expect(container.querySelector("#contact")).not.toBeNull();
});

it("shows the studio photo when set", async () => {
  content.getSettings.mockResolvedValue({ studioPhoto: { src: "/p.jpg", alt: "Chris at his desk", width: 800, height: 600 } } as SiteSettings);
  render(await About());
  expect(screen.getByAltText("Chris at his desk")).toBeInTheDocument();
});
