import { afterEach, expect, it, vi } from "vitest";
import { openConsent, readConsent, subscribeConsent, writeConsent } from "./consent";

afterEach(() => localStorage.clear());

it("reads null until a choice is stored", () => {
  expect(readConsent()).toBeNull();
  writeConsent("granted");
  expect(readConsent()).toBe("granted");
  expect(localStorage.getItem("io-consent")).toBe("granted");
});

it("ignores unknown stored values", () => {
  localStorage.setItem("io-consent", "maybe");
  expect(readConsent()).toBeNull();
});

it("notifies subscribers on write and on open", () => {
  const cb = vi.fn();
  const off = subscribeConsent(cb);
  writeConsent("denied");
  expect(cb).toHaveBeenCalledTimes(1);
  off();
  writeConsent("granted");
  expect(cb).toHaveBeenCalledTimes(1);
});

it("openConsent dispatches io:consent-open", () => {
  const cb = vi.fn();
  window.addEventListener("io:consent-open", cb);
  openConsent();
  expect(cb).toHaveBeenCalledOnce();
  window.removeEventListener("io:consent-open", cb);
});

it("keeps the choice in memory when localStorage is blocked", () => {
  const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  writeConsent("denied");
  expect(readConsent()).toBe("denied");
  set.mockRestore();
  get.mockRestore();
  writeConsent("granted"); // storage works again: clears the in-memory copy
});
