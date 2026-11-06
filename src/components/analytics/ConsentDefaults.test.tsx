import { render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: ({ id, strategy, children }: { id: string; strategy: string; children: string }) => (
    <script id={id} data-strategy={strategy} dangerouslySetInnerHTML={{ __html: children }} />
  ),
}));

import { ConsentDefaults } from "./ConsentDefaults";

type Layer = ArrayLike<unknown>[];

function runDefaults(): Record<string, string> {
  const { container } = render(<ConsentDefaults />);
  const code = container.querySelector("script#consent-default")?.innerHTML ?? "";
  new Function(code)();
  const layer = (window as unknown as { dataLayer: Layer }).dataLayer;
  const entry = Array.from(layer[0]);
  expect(entry.slice(0, 2)).toEqual(["consent", "default"]);
  return entry[2] as Record<string, string>;
}

beforeEach(() => {
  delete (window as { dataLayer?: unknown }).dataLayer;
  delete window.gtag;
});
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it("renders the Consent Mode defaults as a beforeInteractive script", () => {
  const { container } = render(<ConsentDefaults />);
  expect(container.querySelector("script#consent-default")).toHaveAttribute("data-strategy", "beforeInteractive");
});

it("defaults to denied when no choice is stored", () => {
  expect(runDefaults()).toEqual({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
});

it("defaults to granted for a returning visitor who accepted", () => {
  localStorage.setItem("io-consent", "granted");
  expect(runDefaults()).toEqual({ analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
});

it("stays denied for a stored decline", () => {
  localStorage.setItem("io-consent", "denied");
  expect(runDefaults().analytics_storage).toBe("denied");
});

it("stays denied when storage throws", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(runDefaults().analytics_storage).toBe("denied");
});
