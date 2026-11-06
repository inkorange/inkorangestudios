"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { readConsent, subscribeConsent, type Consent } from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Consent Mode v2: everything denied until the visitor chooses.
const CONSENT_DEFAULT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});`;

export type AnalyticsProps = {
  gtmId?: string;
};

export function Analytics({ gtmId }: AnalyticsProps) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => null);

  useEffect(() => {
    if (!consent) return;
    const value: Consent = consent;
    window.gtag?.("consent", "update", {
      analytics_storage: value,
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
    });
  }, [consent]);

  if (!gtmId) return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- App Router: valid in the root layout; the rule targets the Pages Router _document */}
      <Script id="consent-default" strategy="beforeInteractive">
        {CONSENT_DEFAULT}
      </Script>
      {consent === "granted" ? <GoogleTagManager gtmId={gtmId} /> : null}
    </>
  );
}
