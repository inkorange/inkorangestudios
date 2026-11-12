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

it("holds submit until the human check has produced a token", async () => {
  vi.resetModules();
  vi.doMock("@/lib/signups/captchaEnabled", () => ({ CAPTCHA_WIDGET: true }));
  vi.doMock("@/lib/env-public", () => ({ publicEnv: { turnstileSiteKey: "site-key" } }));
  let callback: (t: string) => void = () => {};
  (window as unknown as { turnstile: unknown }).turnstile = {
    render: (_el: HTMLElement, o: { callback: (t: string) => void }) => { callback = o.callback; return "w1"; },
    remove: () => {},
    reset: () => {},
  };
  const { EmailSignupForm: Form } = await import("./EmailSignupForm");
  const { act } = await import("@testing-library/react");
  render(
    <Form action={async () => ({ status: "ok" })} label="Email address" placeholder="p" submitLabel="Subscribe" tone="on-dark" successMessage="Done" />,
  );
  expect(screen.getByRole("button", { name: "Subscribe" })).toBeDisabled();
  await vi.waitFor(() => expect(callback).not.toBe(undefined));
  await vi.waitFor(() => { act(() => callback("tok")); expect(screen.getByRole("button", { name: "Subscribe" })).toBeEnabled(); });
  vi.doUnmock("@/lib/signups/captchaEnabled");
  vi.doUnmock("@/lib/env-public");
  delete (window as unknown as { turnstile?: unknown }).turnstile;
});

it("renders extraFields inside the form before the submit button and sends them", async () => {
  const action = vi.fn<(prev: FormState, data: FormData) => Promise<FormState>>(async () => ({ status: "error", error: "Nope" }));
  render(
    <EmailSignupForm
      action={action}
      label="Email address"
      placeholder="p"
      submitLabel="Subscribe"
      tone="on-dark"
      successMessage="Done"
      extraFields={<input aria-label="Extra" name="extra" defaultValue="x1" />}
    />,
  );
  const extra = screen.getByRole("textbox", { name: "Extra" });
  const button = screen.getByRole("button", { name: "Subscribe" });
  expect(extra.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(button);
  await screen.findByRole("alert");
  expect(action.mock.calls[0][1].get("extra")).toBe("x1");
  expect(screen.getByRole("textbox", { name: "Extra" })).toBeInTheDocument();
});

it("flags forms that carry extra fields (phone stacks the email above them)", () => {
  const action = vi.fn(async () => ({ status: "idle" }) as FormState);
  const { container, rerender } = render(
    <EmailSignupForm action={action} label="Email address" placeholder="p" submitLabel="Go" tone="on-accent" successMessage="Done" extraFields={<select aria-label="Platform" />} />,
  );
  expect(container.querySelector("form")).toHaveAttribute("data-extra", "true");
  rerender(<EmailSignupForm action={action} label="Email address" placeholder="p" submitLabel="Go" tone="on-accent" successMessage="Done" />);
  expect(container.querySelector("form")).toHaveAttribute("data-extra", "false");
});

it("takes the responsive layout (stacked on a phone, one row from md)", () => {
  const { container } = render(
    <EmailSignupForm
      action={vi.fn()}
      label="Email address"
      placeholder="you@example.com"
      submitLabel="Join"
      tone="on-dark"
      layout="responsive"
      successMessage="Thanks"
    />,
  );
  expect(container.querySelector("form")).toHaveAttribute("data-layout", "responsive");
});
