import type { FormState } from "./types";

export const MAX_EMAIL = 254;
export const MAX_MESSAGE = 5000;
export const MAX_NAME = 120;

export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; spam?: true };

/** Map a failed validation to the form state: spam looks like success, so bots learn nothing. */
export function rejection(v: { error: string; spam?: true }): FormState {
  return v.spam ? { status: "ok" } : { status: "error", error: v.error };
}

// Deliberately loose: something, an @, something, a dot, something. `,;<>` are
// rejected so one value can never become several ReplyTo addresses.
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const SLUG = /^[a-z0-9-]{1,64}$/;
const TOPICS = ["general", "support", "press", "business"] as const;
export type ContactTopic = (typeof TOPICS)[number];

const SPAM: { ok: false; error: string; spam: true } = { ok: false, error: "", spam: true };

/** Trim + lower-case so " Name@Gmail.com " and "name@gmail.com" are one signup. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > MAX_EMAIL || !EMAIL.test(email)) return null;
  return email;
}

function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function isSpam(fd: FormData): boolean {
  return text(fd, "website") !== "";
}

function email(fd: FormData): Validation<string> {
  const raw = text(fd, "email");
  if (!raw) return { ok: false, error: "Enter your email address." };
  const e = normalizeEmail(raw);
  return e ? { ok: true, value: e } : { ok: false, error: "That doesn't look like an email address." };
}

function slug(fd: FormData, key: string): string | null {
  const v = text(fd, key);
  return SLUG.test(v) ? v : null;
}

export function validateNewsletter(fd: FormData): Validation<{ email: string; source: string }> {
  if (isSpam(fd)) return SPAM;
  const e = email(fd);
  if (!e.ok) return e;
  return { ok: true, value: { email: e.value, source: slug(fd, "source") ?? "footer" } };
}

export function validateBeta(
  fd: FormData,
): Validation<{ email: string; game: string; platform: string | null; source: string }> {
  if (isSpam(fd)) return SPAM;
  const e = email(fd);
  if (!e.ok) return e;
  const game = slug(fd, "game");
  if (!game) return { ok: false, error: "Something went wrong. Please try again." };
  return {
    ok: true,
    value: { email: e.value, game, platform: slug(fd, "platform"), source: slug(fd, "source") ?? "callout" },
  };
}

export function validateLaunchAlert(
  fd: FormData,
): Validation<{ email: string; game: string; platform: string }> {
  if (isSpam(fd)) return SPAM;
  const e = email(fd);
  if (!e.ok) return e;
  const game = slug(fd, "game");
  const platform = slug(fd, "platform");
  if (!game || !platform) return { ok: false, error: "Something went wrong. Please try again." };
  return { ok: true, value: { email: e.value, game, platform } };
}

export function validateContact(
  fd: FormData,
): Validation<{ name: string; email: string; topic: ContactTopic; message: string }> {
  if (isSpam(fd)) return SPAM;
  const name = text(fd, "name");
  if (!name || name.length > MAX_NAME) return { ok: false, error: "Tell us your name." };
  const e = email(fd);
  if (!e.ok) return e;
  const message = text(fd, "message");
  if (!message) return { ok: false, error: "Write a message first." };
  if (message.length > MAX_MESSAGE) return { ok: false, error: "That message is too long." };
  const t = text(fd, "topic");
  const topic = (TOPICS as readonly string[]).includes(t) ? (t as ContactTopic) : "general";
  return { ok: true, value: { name, email: e.value, topic, message } };
}
