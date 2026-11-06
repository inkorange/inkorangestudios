import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/signups/captchaEnabled");
  vi.doUnmock("@/lib/env");
  document.head.querySelectorAll("script").forEach((s) => s.remove());
});

it("renders nothing and loads no script when CAPTCHA is not required", async () => {
  const { Turnstile } = await import("./Turnstile");
  const { container } = render(<Turnstile />);
  expect(container).toBeEmptyDOMElement();
  expect(document.querySelector('script[src*="turnstile"]')).toBeNull();
});
it("renders the token field and loads the explicit script when required", async () => {
  vi.doMock("@/lib/signups/captchaEnabled", () => ({ CAPTCHA_REQUIRED: true }));
  vi.doMock("@/lib/env", () => ({ publicEnv: { turnstileSiteKey: "site-key" } }));
  const { Turnstile } = await import("./Turnstile");
  const { container } = render(<Turnstile />);
  const hidden = container.querySelector('input[type="hidden"][name="captchaToken"]');
  expect(hidden).not.toBeNull();
  expect(document.querySelector('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]')).not.toBeNull();
});
