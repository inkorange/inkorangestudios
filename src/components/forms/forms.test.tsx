import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

const { subscribeNewsletter, joinBeta, requestLaunchAlert, sendContactMessage } = vi.hoisted(() => ({
  subscribeNewsletter: vi.fn(),
  joinBeta: vi.fn(),
  requestLaunchAlert: vi.fn(),
  sendContactMessage: vi.fn(),
}));
vi.mock("@/app/actions/newsletter", () => ({ subscribeNewsletter }));
vi.mock("@/app/actions/beta", () => ({ joinBeta }));
vi.mock("@/app/actions/launchAlert", () => ({ requestLaunchAlert }));
vi.mock("@/app/actions/contact", () => ({ sendContactMessage }));

import { validateBeta, validateContact, validateLaunchAlert } from "@/lib/signups/validate";
import { BetaForm } from "./BetaForm";
import { ContactForm } from "./ContactForm";
import { LaunchAlertForm } from "./LaunchAlertForm";
import { NewsletterForm } from "./NewsletterForm";

beforeEach(() => {
  for (const m of [subscribeNewsletter, joinBeta, requestLaunchAlert, sendContactMessage]) {
    m.mockReset();
    m.mockResolvedValue({ status: "ok" });
  }
});

it("NewsletterForm submits with its source and shows the success copy", async () => {
  render(<NewsletterForm tone="on-dark" source="footer" />);
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
  expect(await screen.findByRole("status")).toHaveTextContent("You're on the list. Watch your inbox for news.");
  expect(subscribeNewsletter.mock.calls[0][1].get("source")).toBe("footer");
});

it("BetaForm renders its submit label and sends game and source", async () => {
  render(<BetaForm game="terra-forge" platforms={["ios"]} />);
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Join the beta" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Thanks! We'll email you when a beta spot opens.");
  const fd: FormData = joinBeta.mock.calls[0][1];
  expect(fd.get("game")).toBe("terra-forge");
  expect(fd.get("source")).toBe("callout");
  expect(validateBeta(fd)).toMatchObject({ ok: true, value: { game: "terra-forge", platform: "ios", source: "callout" } });
});

it("BetaForm shows a platform select only with more than one platform", () => {
  const { unmount } = render(<BetaForm game="g" platforms={["ios", "android"]} />);
  const select = screen.getByRole("combobox", { name: "Platform" });
  expect([...select.querySelectorAll("option")].map((o) => o.textContent)).toEqual(["iOS", "Android"]);
  unmount();
  render(<BetaForm game="g" platforms={["ios"]} />);
  expect(screen.queryByRole("combobox")).toBeNull();
});

it("BetaForm sends the chosen platform and keeps it after a failed submit", async () => {
  joinBeta.mockResolvedValue({ status: "error", error: "Nope" });
  render(<BetaForm game="g" platforms={["ios", "android"]} />);
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Platform" }), "android");
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Join the beta" }));
  await screen.findByRole("alert");
  expect(joinBeta.mock.calls[0][1].get("platform")).toBe("android");
  expect(screen.getByRole("combobox", { name: "Platform" })).toHaveValue("android");
});

it("LaunchAlertForm slugifies a display label for the server", async () => {
  render(<LaunchAlertForm game="g" platform="Android TV" />);
  await userEvent.type(screen.getByRole("textbox"), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Notify me" }));
  await screen.findByRole("status");
  expect(requestLaunchAlert.mock.calls[0][1].get("platform")).toBe("android-tv");
});

it("LaunchAlertForm renders Notify me and names the platform on success", async () => {
  render(<LaunchAlertForm game="g" platform="iOS" />);
  expect(screen.getByPlaceholderText("Email me at launch")).toBeInTheDocument();
  await userEvent.type(screen.getByRole("textbox"), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Notify me" }));
  expect(await screen.findByRole("status")).toHaveTextContent("We'll email you when it launches on iOS.");
  const fd: FormData = requestLaunchAlert.mock.calls[0][1];
  expect(fd.get("game")).toBe("g");
  expect(fd.get("platform")).toBe("ios");
  expect(validateLaunchAlert(fd)).toMatchObject({ ok: true, value: { game: "g", platform: "ios" } });
});

it("ContactForm has a Send message button and a hidden honeypot", () => {
  render(<ContactForm />);
  expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
  const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]')!;
  expect(honeypot).toHaveAttribute("tabindex", "-1");
  expect(honeypot).toHaveAttribute("autocomplete", "off");
  expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  expect([...screen.getByRole("combobox", { name: "Topic" }).querySelectorAll("option")].map((o) => o.textContent)).toEqual([
    "General",
    "Player support",
    "Press",
    "Business",
  ]);
});

it("ContactForm sends every field and replaces itself with the success copy", async () => {
  render(<ContactForm />);
  await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Ann");
  await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Topic" }), "press");
  await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "Hi there");
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Thanks — your message is on its way. We'll reply by email.");
  const fd: FormData = sendContactMessage.mock.calls[0][1];
  expect([fd.get("name"), fd.get("email"), fd.get("topic"), fd.get("message"), fd.get("website")]).toEqual([
    "Ann",
    "a@b.co",
    "press",
    "Hi there",
    "",
  ]);
  expect(validateContact(fd)).toMatchObject({ ok: true, value: { topic: "press", name: "Ann" } });
  expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
});

it("ContactForm keeps typed values after an error", async () => {
  sendContactMessage.mockResolvedValue({ status: "error", error: "Nope" });
  render(<ContactForm />);
  await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Ann");
  await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Topic" }), "business");
  await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "Hi there");
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Nope");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Ann");
  expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("a@b.co");
  expect(screen.getByRole("combobox", { name: "Topic" })).toHaveValue("business");
  expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Hi there");
});
