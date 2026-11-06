"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import { useEffect, useSyncExternalStore } from "react";
import { readConsent, subscribeConsent } from "@/lib/consent";

declare global {
  interface Window {
    // dataLayer is declared by @next/third-parties as Object[].
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsProps = {
  gtmId?: string;
};

/**
 * Loads GTM only after consent is granted and forwards every choice to Consent
 * Mode. The denied defaults come from `ConsentDefaults`, rendered in the root
 * layout; this component also guarantees `dataLayer` and `gtag` exist so an
 * update (for example a later Decline) always lands.
 */
export function Analytics({ gtmId }: AnalyticsProps) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => null);

  useEffect(() => {
    if (!consent) return;
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params -- GTM requires the arguments object, not an array
        window.dataLayer?.push(arguments);
      };
    }
    window.gtag("consent", "update", {
      analytics_storage: consent,
      ad_storage: consent,
      ad_user_data: consent,
      ad_personalization: consent,
    });
  }, [consent]);

  if (!gtmId) return null;

  return consent === "granted" ? <GoogleTagManager gtmId={gtmId} /> : null;
}
