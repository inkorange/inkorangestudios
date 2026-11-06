import { describe, expect, it } from "vitest";
import {
  MAX_EMAIL,
  normalizeEmail,
  validateBeta,
  validateContact,
  validateLaunchAlert,
  validateNewsletter,
} from "./validate";

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
};

describe("normalizeEmail", () => {
  it("trims and lower-cases", () => {
    expect(normalizeEmail("  Name@Gmail.com ")).toBe("name@gmail.com");
  });
  it("rejects junk and non-strings", () => {
    expect(normalizeEmail("nope")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });
  it("rejects over-length", () => {
    expect(normalizeEmail("a".repeat(MAX_EMAIL - 12) + "@example.com")).not.toBeNull();
    expect(normalizeEmail("a".repeat(MAX_EMAIL - 12 + 1) + "@example.com")).toBeNull();
  });
});

describe("validateNewsletter", () => {
  it("normalizes and defaults source", () => {
    expect(validateNewsletter(form({ email: " A@B.co " }))).toEqual({
      ok: true,
      value: { email: "a@b.co", source: "footer" },
    });
  });
  it("errors", () => {
    expect(validateNewsletter(form({}))).toEqual({ ok: false, error: "Enter your email address." });
    expect(validateNewsletter(form({ email: "x" }))).toEqual({
      ok: false,
      error: "That doesn't look like an email address.",
    });
  });
  it("treats a filled honeypot as spam", () => {
    expect(validateNewsletter(form({ email: "a@b.co", website: "http://x" }))).toEqual({
      ok: false,
      error: "spam",
    });
  });
});

describe("validateBeta", () => {
  it("accepts a valid slug game", () => {
    const r = validateBeta(form({ email: "a@b.co", game: "terraforge", platform: "android" }));
    expect(r).toEqual({
      ok: true,
      value: { email: "a@b.co", game: "terraforge", platform: "android", source: "callout" },
    });
  });
  it("rejects a bad game", () => {
    expect(validateBeta(form({ email: "a@b.co", game: "Space Cowboy!" })).ok).toBe(false);
  });
  it("honeypot", () => {
    expect(validateBeta(form({ email: "a@b.co", game: "g", website: "x" }))).toEqual({
      ok: false,
      error: "spam",
    });
  });
});

describe("validateLaunchAlert", () => {
  it("requires game and platform slugs", () => {
    expect(validateLaunchAlert(form({ email: "a@b.co", game: "g", platform: "ios" })).ok).toBe(true);
    expect(validateLaunchAlert(form({ email: "a@b.co", game: "g" })).ok).toBe(false);
    expect(validateLaunchAlert(form({ email: "a@b.co", game: "g", platform: "i os" })).ok).toBe(false);
  });
});

describe("validateContact", () => {
  const base = { name: "Ann", email: "a@b.co", message: "Hi" };
  it("accepts and defaults topic", () => {
    expect(validateContact(form({ ...base, topic: "weird" }))).toEqual({
      ok: true,
      value: { ...base, topic: "general" },
    });
    const r = validateContact(form({ ...base, topic: "press" }));
    expect(r.ok && r.value.topic).toBe("press");
  });
  it("errors", () => {
    expect(validateContact(form({ ...base, name: " " }))).toEqual({ ok: false, error: "Tell us your name." });
    expect(validateContact(form({ ...base, message: "  " }))).toEqual({
      ok: false,
      error: "Write a message first.",
    });
    expect(validateContact(form({ ...base, message: "x".repeat(5001) }))).toEqual({
      ok: false,
      error: "That message is too long.",
    });
    expect(validateContact(form({ ...base, email: "" })).ok).toBe(false);
  });
});
