import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { FormState } from "@/lib/signups/types";
import { EmailSignupForm } from "./EmailSignupForm";

function setup(action: (prev: FormState, data: FormData) => Promise<FormState>, hidden?: Record<string, string>) {
  render(
    <EmailSignupForm
      action={action}
      label="Email address"
      placeholder="you@example.com"
      submitLabel="Subscribe"
      tone="on-dark"
      hidden={hidden}
      successMessage="You're on the list."
    />,
  );
}

it("shows the success message in place of the form", async () => {
  setup(vi.fn(async () => ({ status: "ok" as const })));
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(await screen.findByRole("status")).toHaveTextContent("You're on the list.");
  expect(screen.queryByRole("textbox")).toBeNull();
});
it("shows an error alert and keeps the input and its value", async () => {
  setup(vi.fn(async () => ({ status: "error" as const, error: "Nope" })));
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Nope");
  expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue("a@b.co");
});
it("submits hidden fields with the form data", async () => {
  const action = vi.fn<(prev: FormState, data: FormData) => Promise<FormState>>(async () => ({ status: "ok" }));
  setup(action, { game: "space-cowboy" });
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
  await screen.findByRole("status");
  const data = action.mock.calls[0][1];
  expect(data.get("game")).toBe("space-cowboy");
  expect(data.get("email")).toBe("a@b.co");
});
it("disables submit while pending", async () => {
  let release: (s: FormState) => void = () => {};
  setup(() => new Promise<FormState>((r) => { release = r; }));
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(screen.getByRole("button", { name: "Subscribe" })).toBeDisabled();
  release({ status: "ok" });
  expect(await screen.findByRole("status")).toBeInTheDocument();
});
