import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

type Opts = { sitekey: string; callback: (t: string) => void; "response-field"?: boolean };
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function mockRequired(required: boolean) {
  vi.doMock("@/lib/signups/captchaEnabled", () => ({ CAPTCHA_REQUIRED: required }));
  vi.doMock("@/lib/env-public", () => ({ publicEnv: { turnstileSiteKey: "site-key" } }));
}
function stubApi() {
  const opts: Opts[] = [];
  const api = {
    render: vi.fn((_el: HTMLElement, o: Opts) => {
      opts.push(o);
      return `w${opts.length}`;
    }),
    remove: vi.fn(),
    reset: vi.fn(),
  };
  (window as unknown as { turnstile?: typeof api }).turnstile = api;
  return { api, opts };
}
const tokens = (c: HTMLElement) =>
  Array.from(c.querySelectorAll<HTMLInputElement>('input[name="captchaToken"]')).map((i) => i.value);

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.doUnmock("@/lib/signups/captchaEnabled");
  vi.doUnmock("@/lib/env-public");
  delete (window as unknown as { turnstile?: unknown }).turnstile;
  document.head.querySelectorAll("script").forEach((s) => s.remove());
});

it("renders nothing and loads no script when CAPTCHA is not required", async () => {
  mockRequired(false);
  const { Turnstile } = await import("./Turnstile");
  const { container } = render(<Turnstile />);
  expect(container).toBeEmptyDOMElement();
  expect(document.querySelector('script[src*="turnstile"]')).toBeNull();
});

it("renders explicitly with the site key, without Cloudflare's own response field", async () => {
  mockRequired(true);
  const { api, opts } = stubApi();
  const { Turnstile } = await import("./Turnstile");
  render(<Turnstile />);
  await waitFor(() => expect(api.render).toHaveBeenCalledOnce());
  expect(opts[0].sitekey).toBe("site-key");
  expect(opts[0]["response-field"]).toBe(false);
});

it("writes the callback token into the hidden captchaToken input", async () => {
  mockRequired(true);
  const { opts } = stubApi();
  const { Turnstile } = await import("./Turnstile");
  const { container } = render(<Turnstile />);
  await waitFor(() => expect(opts).toHaveLength(1));
  expect(tokens(container)).toEqual([""]);
  act(() => opts[0].callback("tok-1"));
  expect(tokens(container)).toEqual(["tok-1"]);
});

it("loads the script once for two instances and keeps their tokens independent", async () => {
  mockRequired(true);
  const { Turnstile } = await import("./Turnstile");
  const { container } = render(<><Turnstile /><Turnstile /></>);
  expect(document.querySelectorAll(`script[src="${SRC}"]`)).toHaveLength(1);
  const { api, opts } = stubApi();
  act(() => { document.querySelector(`script[src="${SRC}"]`)!.dispatchEvent(new Event("load")); });
  await waitFor(() => expect(api.render).toHaveBeenCalledTimes(2));
  act(() => opts[0].callback("a"));
  act(() => opts[1].callback("b"));
  expect(tokens(container)).toEqual(["a", "b"]);
});

it("removes the widget on unmount", async () => {
  mockRequired(true);
  const { api } = stubApi();
  const { Turnstile } = await import("./Turnstile");
  const { unmount } = render(<Turnstile />);
  await waitFor(() => expect(api.render).toHaveBeenCalledOnce());
  unmount();
  expect(api.remove).toHaveBeenCalledWith("w1");
});

it("resets the widget and clears the token when resetKey changes", async () => {
  mockRequired(true);
  const { api, opts } = stubApi();
  const { Turnstile } = await import("./Turnstile");
  const { container, rerender } = render(<Turnstile resetKey={1} />);
  await waitFor(() => expect(opts).toHaveLength(1));
  act(() => opts[0].callback("tok"));
  rerender(<Turnstile resetKey={2} />);
  expect(api.reset).toHaveBeenCalledWith("w1");
  expect(tokens(container)).toEqual([""]);
});

it("reports token readiness", async () => {
  mockRequired(true);
  const { opts } = stubApi();
  const { Turnstile } = await import("./Turnstile");
  const onTokenChange = vi.fn();
  render(<Turnstile onTokenChange={onTokenChange} />);
  await waitFor(() => expect(opts).toHaveLength(1));
  expect(onTokenChange).toHaveBeenLastCalledWith(false);
  act(() => opts[0].callback("tok"));
  expect(onTokenChange).toHaveBeenLastCalledWith(true);
});
