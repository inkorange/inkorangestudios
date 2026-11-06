"use client";

import { GoogleTagManager } from "@next/third-parties/google";
import { useEffect, useSyncExternalStore } from "react";
import { applyConsent, readAppliedConsent, readConsent, subscribeAppliedConsent, subscribeConsent } from "@/lib/consent";

export type AnalyticsProps = {
  gtmId?: string;
};

/**
 * Loads GTM only after consent is granted AND the granted Consent Mode update
 * is in `dataLayer`, so GTM's `gtm.js` event (the page view) never fires under
 * denied. The defaults come from `ConsentDefaults` in the root layout (granted
 * there already for a returning visitor who accepted); a choice in the banner
 * pushes its update synchronously in `writeConsent`. This component pushes the
 * stored choice on load (skipped if already pushed) and then mounts GTM.
 */
export function Analytics({ gtmId }: AnalyticsProps) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => null);
  const applied = useSyncExternalStore(subscribeAppliedConsent, readAppliedConsent, () => null);

  useEffect(() => {
    if (consent) applyConsent(consent);
  }, [consent]);

  if (!gtmId) return null;

  return consent === "granted" && applied === "granted" ? <GoogleTagManager gtmId={gtmId} /> : null;
}
