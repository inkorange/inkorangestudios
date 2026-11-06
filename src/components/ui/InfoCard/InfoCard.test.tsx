import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { InfoCard } from "./InfoCard";

it("renders title, body and link", () => {
  const { container } = render(<InfoCard title="Press kit" body="Logo and art." link={{ label: "Download →", href: "/press" }} layout="row" />);
  expect(screen.getByText("Press kit")).toBeVisible();
  expect(screen.getByText("Logo and art.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Download →" })).toHaveAttribute("href", "/press");
  expect(container.firstElementChild).toHaveAttribute("data-layout", "row");
});
it("defaults to stack and handles mailto links", () => {
  const { container } = render(<InfoCard title="Help" body="b" link={{ label: "mail", href: "mailto:a@b.co" }} />);
  expect(container.firstElementChild).toHaveAttribute("data-layout", "stack");
  expect(screen.getByRole("link", { name: "mail" })).toHaveAttribute("href", "mailto:a@b.co");
});

it("supports the auto layout (a row on phones, a stack from lg)", () => {
  const { container } = render(<InfoCard title="Press kit" body="Logos." link={{ label: "Download →", href: "https://x.test/kit.zip" }} layout="auto" />);
  expect(container.firstElementChild).toHaveAttribute("data-layout", "auto");
});
