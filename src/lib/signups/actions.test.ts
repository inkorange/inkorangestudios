import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const insert = vi.fn();
const from = vi.fn();
const verifyTurnstile = vi.fn();
const notifyOwner = vi.fn();
const headerGet = vi.fn();

vi.mock("next/headers", () => ({ headers: async () => ({ get: headerGet }) }));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: () => ({ from }) }));
vi.mock("@/lib/signups/turnstile", () => ({ verifyTurnstile: (...a: unknown[]) => verifyTurnstile(...a) }));
vi.mock("@/lib/signups/notify", () => ({ notifyOwner: (...a: unknown[]) => notifyOwner(...a) }));

import { subscribeNewsletter } from "@/app/actions/newsletter";
import { joinBeta } from "@/app/actions/beta";
import { requestLaunchAlert } from "@/app/actions/launchAlert";
import { sendContactMessage } from "@/app/actions/contact";

const idle = { status: "idle" } as const;
const OK = { status: "ok" };
const HUMAN = { status: "error", error: "Please complete the human check and try again." };
const FAIL = { status: "error", error: "Something went wrong. Please try again." };

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  headerGet.mockReturnValue(" 1.2.3.4 , 5.6.7.8");
  verifyTurnstile.mockResolvedValue(true);
  notifyOwner.mockResolvedValue(undefined);
  upsert.mockReturnValue({ select: async () => ({ data: [{ id: "1" }], error: null }) });
  insert.mockReturnValue({ select: async () => ({ data: [{ id: "1" }], error: null }) });
  from.mockReturnValue({ upsert, insert });
});

describe("joinBeta", () => {
  const fd = () =>
    form({ email: " Me@X.co ", game: "terraforge", platform: "android", captchaToken: "t" });

  it("stores, notifies once with replyTo, returns ok", async () => {
    expect(await joinBeta(idle, fd())).toEqual(OK);
    expect(from).toHaveBeenCalledWith("studio_beta_signups");
    expect(upsert).toHaveBeenCalledWith(
      { email: "me@x.co", game: "terraforge", platform: "android", source: "callout" },
      { onConflict: "email,game", ignoreDuplicates: true },
    );
    expect(verifyTurnstile).toHaveBeenCalledWith("t", "1.2.3.4");
    expect(notifyOwner).toHaveBeenCalledTimes(1);
    expect(notifyOwner).toHaveBeenCalledWith({
      subject: "New beta tester: me@x.co (terraforge)",
      replyTo: "me@x.co",
      lines: [
        "Email: me@x.co",
        "Game: terraforge",
        "Platform: android",
        "Signed up from: callout",
        "",
        "Reply to this email to send them the beta invite.",
      ],
    });
  });

  it("duplicate is a silent success with no notification", async () => {
    upsert.mockReturnValue({ select: async () => ({ data: [], error: null }) });
    expect(await joinBeta(idle, fd())).toEqual(OK);
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("says 'not specified' without a platform", async () => {
    await joinBeta(idle, form({ email: "a@b.co", game: "g" }));
    expect(notifyOwner.mock.calls[0][0].lines).toContain("Platform: not specified");
  });

  it("supabase error -> error state, no notify, email not logged", async () => {
    upsert.mockReturnValue({ select: async () => ({ data: null, error: { message: "boom" } }) });
    expect(await joinBeta(idle, fd())).toEqual(FAIL);
    expect(notifyOwner).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[signups] insert failed", "studio_beta_signups", "boom");
  });

  it("still ok when notifyOwner throws", async () => {
    notifyOwner.mockRejectedValue(new Error("x"));
    expect(await joinBeta(idle, fd())).toEqual(OK);
  });

  it("failed human check -> error and no DB call", async () => {
    verifyTurnstile.mockResolvedValue(false);
    expect(await joinBeta(idle, fd())).toEqual(HUMAN);
    expect(from).not.toHaveBeenCalled();
  });

  it("honeypot -> ok, nothing happens", async () => {
    const f = fd();
    f.set("website", "spam");
    expect(await joinBeta(idle, f)).toEqual(OK);
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it("validation error is returned", async () => {
    expect(await joinBeta(idle, form({ email: "nope", game: "g" }))).toEqual({
      status: "error",
      error: "That doesn't look like an email address.",
    });
  });
});

describe("subscribeNewsletter", () => {
  it("stores with source, never notifies", async () => {
    expect(await subscribeNewsletter(idle, form({ email: "a@b.co", source: "home" }))).toEqual(OK);
    expect(from).toHaveBeenCalledWith("studio_newsletter_signups");
    expect(upsert).toHaveBeenCalledWith(
      { email: "a@b.co", source: "home" },
      { onConflict: "email", ignoreDuplicates: true },
    );
    expect(notifyOwner).not.toHaveBeenCalled();
  });
  it("defaults source to footer; no x-forwarded-for passes undefined ip", async () => {
    headerGet.mockReturnValue(null);
    await subscribeNewsletter(idle, form({ email: "a@b.co" }));
    expect(upsert.mock.calls[0][0].source).toBe("footer");
    expect(verifyTurnstile).toHaveBeenCalledWith("", undefined);
  });
  it("supabase error -> error state", async () => {
    upsert.mockReturnValue({ select: async () => ({ data: null, error: { message: "x" } }) });
    expect(await subscribeNewsletter(idle, form({ email: "a@b.co" }))).toEqual(FAIL);
  });
  it("failed human check -> error and no DB call", async () => {
    verifyTurnstile.mockResolvedValue(false);
    expect(await subscribeNewsletter(idle, form({ email: "a@b.co" }))).toEqual(HUMAN);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("requestLaunchAlert", () => {
  it("stores with composite conflict, never notifies", async () => {
    const r = await requestLaunchAlert(idle, form({ email: "a@b.co", game: "g", platform: "ios" }));
    expect(r).toEqual(OK);
    expect(from).toHaveBeenCalledWith("studio_launch_alerts");
    expect(upsert).toHaveBeenCalledWith(
      { email: "a@b.co", game: "g", platform: "ios" },
      { onConflict: "email,game,platform", ignoreDuplicates: true },
    );
    expect(notifyOwner).not.toHaveBeenCalled();
  });
  it("supabase error -> error state", async () => {
    upsert.mockReturnValue({ select: async () => ({ data: null, error: { message: "x" } }) });
    expect(await requestLaunchAlert(idle, form({ email: "a@b.co", game: "g", platform: "ios" }))).toEqual(FAIL);
  });
  it("failed human check -> no DB call", async () => {
    verifyTurnstile.mockResolvedValue(false);
    expect(await requestLaunchAlert(idle, form({ email: "a@b.co", game: "g", platform: "ios" }))).toEqual(HUMAN);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("sendContactMessage", () => {
  const fd = () =>
    form({ name: "Ada", email: "Ada@X.co", topic: "press", message: "Hello there" });

  it("inserts, notifies with the message in lines", async () => {
    expect(await sendContactMessage(idle, fd())).toEqual(OK);
    expect(from).toHaveBeenCalledWith("studio_contact_messages");
    expect(insert).toHaveBeenCalledWith({
      name: "Ada",
      email: "ada@x.co",
      topic: "press",
      message: "Hello there",
    });
    expect(upsert).not.toHaveBeenCalled();
    expect(notifyOwner).toHaveBeenCalledWith({
      subject: "Contact (press): Ada",
      replyTo: "ada@x.co",
      lines: ["From: Ada <ada@x.co>", "Topic: press", "", "Hello there"],
    });
  });
  it("supabase error -> error state, no notify", async () => {
    insert.mockReturnValue({ select: async () => ({ data: null, error: { message: "x" } }) });
    expect(await sendContactMessage(idle, fd())).toEqual(FAIL);
    expect(notifyOwner).not.toHaveBeenCalled();
  });
  it("failed human check -> no DB call", async () => {
    verifyTurnstile.mockResolvedValue(false);
    expect(await sendContactMessage(idle, fd())).toEqual(HUMAN);
    expect(from).not.toHaveBeenCalled();
  });
  it("still ok when notifyOwner throws", async () => {
    notifyOwner.mockRejectedValue(new Error("x"));
    expect(await sendContactMessage(idle, fd())).toEqual(OK);
  });
});
