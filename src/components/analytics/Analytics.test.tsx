import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

// Like the real component: GTM's bootstrap pushes the gtm.js event once it mounts.
vi.mock("@next/third-parties/google", () => ({
  GoogleTagManager: function GoogleTagManager({ gtmId }: { gtmId: string }) {
    useEffect(() => {
      (window as unknown as { dataLayer: unknown[] }).dataLayer.push({ event: "gtm.js" });
    }, []);
    return <div data-testid="gtm" data-id={gtmId} />;
  },
}));

// Fresh modules per test: consent.ts remembers what it pushed on this "page view".
let Analytics: typeof import("./Analytics").Analytics;
let writeConsent: typeof import("@/lib/consent").writeConsent;

type Layer = unknown[];
const layer = () => (window as unknown as { dataLayer: Layer }).dataLayer;
const isUpdate = (e: unknown) => typeof e === "object" && e !== null && "length" in e && Array.from(e as ArrayLike<unknown>).slice(0, 2).join() === "consent,update";
const isGtmJs = (e: unknown) => (e as { event?: string })?.event === "gtm.js";

beforeEach(async () => {
  vi.resetModules();
  ({ Analytics } = await import("./Analytics"));
  ({ writeConsent } = await import("@/lib/consent"));
  delete window.gtag;
  (window as unknown as { dataLayer: Layer }).dataLayer = [];
});
afterEach(() => localStorage.clear());

it("renders nothing without a gtmId", () => {
  const { container } = render(<Analytics />);
  expect(container).toBeEmptyDOMElement();
});

it("does not load GTM without consent", () => {
  const { queryByTestId } = render(<Analytics gtmId="GTM-TEST" />);
  expect(queryByTestId("gtm")).toBeNull();
  expect(layer()).toHaveLength(0);
});

it("creates dataLayer and a gtag shim if the defaults script did not run", () => {
  delete (window as { dataLayer?: unknown }).dataLayer;
  localStorage.setItem("io-consent", "denied");
  render(<Analytics gtmId="GTM-TEST" />);
  expect(layer()).toHaveLength(1);
  expect(isUpdate(layer()[0])).toBe(true);
});

it("returning visitor: the granted update is in dataLayer before GTM's gtm.js event", () => {
  localStorage.setItem("io-consent", "granted");
  const { getByTestId } = render(<Analytics gtmId="GTM-TEST" />);
  expect(getByTestId("gtm")).toHaveAttribute("data-id", "GTM-TEST");
  const updateAt = layer().findIndex(isUpdate);
  const gtmAt = layer().findIndex(isGtmJs);
  expect(updateAt).toBeGreaterThanOrEqual(0);
  expect(gtmAt).toBeGreaterThan(updateAt);
  expect(Array.from(layer()[updateAt] as ArrayLike<unknown>)[2]).toEqual({
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
});

it("Accept: the update is pushed synchronously by the choice, once, before gtm.js", () => {
  const { queryByTestId } = render(<Analytics gtmId="GTM-TEST" />);
  act(() => {
    writeConsent("granted");
    // Synchronous: already in dataLayer before React re-renders.
    expect(layer().filter(isUpdate)).toHaveLength(1);
  });
  expect(queryByTestId("gtm")).not.toBeNull();
  expect(layer().filter(isUpdate)).toHaveLength(1);
  expect(layer().findIndex(isGtmJs)).toBeGreaterThan(layer().findIndex(isUpdate));
});

it("a later Decline sends a denied update", () => {
  const gtag = vi.fn();
  window.gtag = gtag;
  render(<Analytics gtmId="GTM-TEST" />);
  act(() => writeConsent("granted"));
  act(() => writeConsent("denied"));
  expect(gtag).toHaveBeenLastCalledWith("consent", "update", expect.objectContaining({ analytics_storage: "denied" }));
});
