import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import { StudioTeaser } from "./StudioTeaser";

const values = [
  { title: "Play first", body: "Fun in the first minute." },
  { title: "Smart, not stuffy", body: "Learn by experimenting." },
];

it("renders eyebrow, heading, body, values and the action", () => {
  render(
    <StudioTeaser
      photo={{ src: "/p.jpg", alt: "Chris at his desk", width: 800, height: 600 }}
      eyebrow="The studio"
      title="A small studio with a big backlog of ideas."
      body="Founded in New York."
      values={values}
      action={{ label: "About the studio", href: "/about" }}
    />,
  );
  expect(screen.getByText("The studio")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "A small studio with a big backlog of ideas." })).toBeInTheDocument();
  expect(screen.getByText("Founded in New York.")).toBeInTheDocument();
  expect(screen.getByText("Smart, not stuffy")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "About the studio" })).toHaveAttribute("href", "/about");
  expect(screen.getByAltText("Chris at his desk")).toBeInTheDocument();
});

it("shows the hatched placeholder without a photo and hides a missing body", () => {
  const { container } = render(
    <StudioTeaser photo={null} eyebrow="The studio" title="T" body={null} values={values} action={{ label: "About the studio", href: "/about" }} />,
  );
  expect(screen.queryByRole("img")).toBeNull();
  expect(container.querySelector("[data-tone='light']")).not.toBeNull();
  expect(container.querySelectorAll("p")).toHaveLength(1 + values.length * 2);
});
