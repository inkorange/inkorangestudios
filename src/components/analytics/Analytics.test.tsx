import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { writeConsent } from "@/lib/consent";

vi.mock("@next/third-parties/google", () => ({
  GoogleTagManager: ({ gtmId }: { gtmId: string }) => <div data-testid="gtm" data-id={gtmId} />,
}));
vi.mock("next/script", () => ({
  default: ({ id, strategy, children }: { id: string; strategy: string; children: string }) => (
    <script id={id} data-strategy={strategy} dangerouslySetInnerHTML={{ __html: children }} />
  ),
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

it("sets denied defaults before interactive and does not load GTM without consent", () => {
  const { container, queryByTestId } = render(<Analytics gtmId="GTM-TEST" />);
  const script = container.querySelector("script#consent-default");
  expect(script).toHaveAttribute("data-strategy", "beforeInteractive");
  expect(script?.innerHTML).toContain("'consent','default'");
  expect(script?.innerHTML).toContain("analytics_storage:'denied'");
  expect(queryByTestId("gtm")).toBeNull();
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
