import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

import ErrorPage from "./error";

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());

it("is a branded error page with a retry button", async () => {
  const retry = vi.fn();
  const error = new Error("sanity down");
  render(<ErrorPage error={error} retry={retry} reset={vi.fn()} />);
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "inkOrange Studios" })).toHaveAttribute("href", "/");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(errorSpy).toHaveBeenCalledWith(error);
});
