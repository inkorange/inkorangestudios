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

/** The custom Select: open it and pick an option by its label. */
async function choose(name: string, option: string) {
  await userEvent.click(screen.getByRole("combobox", { name }));
  await userEvent.click(screen.getByRole("option", { name: option }));
}

/** The custom Select's option labels, read by opening and closing the menu. */
async function optionLabels(name: string) {
  await userEvent.click(screen.getByRole("combobox", { name }));
  const labels = screen.getAllByRole("option").map((o) => o.textContent);
  await userEvent.keyboard("{Escape}");
  return labels;
}

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
  expect(await screen.findByRole("status")).toHaveTextContent("Check your inbox to confirm your subscription.");
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

it("BetaForm on the tester page adds the ?from= link tag to its source and takes custom copy", async () => {
  window.history.replaceState(null, "", "/beta/g?from=TerraForge");
  render(
    <BetaForm
      game="g"
      platforms={["android"]}
      source="beta-page"
      tone="on-dark"
      layout="responsive"
      label="Your Google Play email"
      placeholder="you@gmail.com"
      submitLabel="Become a tester"
      successMessage="Thanks! See you on Google Play."
    />,
  );
  await userEvent.type(screen.getByRole("textbox", { name: "Your Google Play email" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Become a tester" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Thanks! See you on Google Play.");
  const fd: FormData = joinBeta.mock.calls[0][1];
  expect(fd.get("source")).toBe("beta-page-terraforge");
  expect(validateBeta(fd)).toMatchObject({ ok: true, value: { source: "beta-page-terraforge", platform: "android" } });
  window.history.replaceState(null, "", "/");
});

it("BetaForm ignores a ?from= tag that is not a plain slug", async () => {
  window.history.replaceState(null, "", "/beta/g?from=<script>");
  render(<BetaForm game="g" platforms={["android"]} source="beta-page" />);
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Join the beta" }));
  await screen.findByRole("status");
  expect(joinBeta.mock.calls[0][1].get("source")).toBe("beta-page");
  window.history.replaceState(null, "", "/");
});

it("BetaForm on the tester page fills the email from ?email= and drops it from the URL", async () => {
  window.history.replaceState(null, "", "/beta/prefill?email=Name+tag@Gmail.com&from=launch");
  render(<BetaForm game="g" platforms={["android"]} source="beta-page" />);
  expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue("name+tag@gmail.com");
  expect(window.location.search).toBe("?from=launch");
  await userEvent.click(screen.getByRole("button", { name: "Join the beta" }));
  await screen.findByRole("status");
  expect(joinBeta.mock.calls[0][1].get("email")).toBe("name+tag@gmail.com");
  expect(joinBeta.mock.calls[0][1].get("source")).toBe("beta-page-launch");
  window.history.replaceState(null, "", "/");
});

it("BetaForm leaves the email empty for an invalid ?email=, and off the tester page", async () => {
  window.history.replaceState(null, "", "/beta/bad?email=not-an-email");
  const { unmount } = render(<BetaForm game="g" platforms={["android"]} source="beta-page" />);
  expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue("");
  expect(window.location.search).toBe("");
  unmount();
  window.history.replaceState(null, "", "/elsewhere?email=a@b.co");
  render(<BetaForm game="g" platforms={["android"]} />);
  expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue("");
  expect(window.location.search).toBe("?email=a@b.co");
  window.history.replaceState(null, "", "/");
});

it("BetaForm shows a platform select only with more than one platform", async () => {
  const { unmount } = render(<BetaForm game="g" platforms={["ios", "android"]} />);
  expect(await optionLabels("Platform")).toEqual(["iOS", "Android"]);
  unmount();
  render(<BetaForm game="g" platforms={["ios"]} />);
  expect(screen.queryByRole("combobox")).toBeNull();
});

it("BetaForm sends the chosen platform and keeps it after a failed submit", async () => {
  joinBeta.mockResolvedValue({ status: "error", error: "Nope" });
  render(<BetaForm game="g" platforms={["ios", "android"]} />);
  await choose("Platform", "Android");
  await userEvent.type(screen.getByRole("textbox", { name: "Email address" }), "a@b.co");
  await userEvent.click(screen.getByRole("button", { name: "Join the beta" }));
  await screen.findByRole("alert");
  expect(joinBeta.mock.calls[0][1].get("platform")).toBe("android");
  expect(screen.getByRole("combobox", { name: "Platform" })).toHaveTextContent("Android");
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

it("ContactForm has a Send message button and a hidden honeypot", async () => {
  render(<ContactForm />);
  expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
  const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]')!;
  expect(honeypot).toHaveAttribute("tabindex", "-1");
  expect(honeypot).toHaveAttribute("autocomplete", "off");
  expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  expect(await optionLabels("Topic")).toEqual([
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
  await choose("Topic", "Press");
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
  await choose("Topic", "Business");
  await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "Hi there");
  await userEvent.click(screen.getByRole("button", { name: "Send message" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Nope");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Ann");
  expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("a@b.co");
  expect(screen.getByRole("combobox", { name: "Topic" })).toHaveTextContent("Business");
  expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Hi there");
});
