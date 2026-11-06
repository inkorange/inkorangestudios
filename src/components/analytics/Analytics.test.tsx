import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { writeConsent } from "@/lib/consent";

vi.mock("@next/third-parties/google", () => ({
  GoogleTagManager: ({ gtmId }: { gtmId: string }) => <div data-testid="gtm" data-id={gtmId} />,
}));

import { Analytics } from "./Analytics";

const gtag = vi.fn();
beforeEach(() => {
  gtag.mockReset();
  window.gtag = gtag;
});
afterEach(() => localStorage.clear());

it("renders nothing without a gtmId", () => {
  const { container } = render(<Analytics />);
  expect(container).toBeEmptyDOMElement();
});

it("does not load GTM without consent", () => {
  const { queryByTestId } = render(<Analytics gtmId="GTM-TEST" />);
  expect(queryByTestId("gtm")).toBeNull();
});

it("creates dataLayer and a gtag shim if the defaults script did not run", () => {
  delete window.gtag;
  delete (window as { dataLayer?: unknown }).dataLayer;
  localStorage.setItem("io-consent", "denied");
  render(<Analytics gtmId="GTM-TEST" />);
  const layer = (window as unknown as { dataLayer: unknown[] }).dataLayer;
  expect(layer).toHaveLength(1);
  expect(Array.from(layer[0] as ArrayLike<unknown>).slice(0, 2)).toEqual(["consent", "update"]);
});

it("loads GTM and updates consent once granted", () => {
  localStorage.setItem("io-consent", "granted");
  const { getByTestId } = render(<Analytics gtmId="GTM-TEST" />);
  expect(getByTestId("gtm")).toHaveAttribute("data-id", "GTM-TEST");
  expect(gtag).toHaveBeenCalledWith("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  });
});

it("reacts to a later choice, and sends denied updates", () => {
  const { queryByTestId } = render(<Analytics gtmId="GTM-TEST" />);
  act(() => writeConsent("granted"));
  expect(queryByTestId("gtm")).not.toBeNull();
  act(() => writeConsent("denied"));
  expect(gtag).toHaveBeenLastCalledWith("consent", "update", expect.objectContaining({ analytics_storage: "denied" }));
});
