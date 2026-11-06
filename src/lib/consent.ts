export type Consent = "granted" | "denied";

/** localStorage key for the visitor's choice. Also read by the ConsentDefaults inline script. */
export const CONSENT_STORAGE_KEY = "io-consent";
const KEY = CONSENT_STORAGE_KEY;
const CHANGE_EVENT = "io:consent-change";
const OPEN_EVENT = "io:consent-open";
const APPLIED_EVENT = "io:consent-applied";

export const CONSENT_OPEN_EVENT = OPEN_EVENT;

// Used when localStorage is blocked, so the choice still holds for this page view.
let memory: Consent | null = null;
// The last value pushed to Consent Mode on this page view.
let applied: Consent | null = null;

declare global {
  interface Window {
    // dataLayer is declared by @next/third-parties as Object[].
    gtag?: (...args: unknown[]) => void;
  }
}

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(KEY);
    if (value === "granted" || value === "denied") return value;
    return memory;
  } catch {
    return memory;
  }
}

/**
 * Push a Consent Mode `update` (creating `dataLayer` and a `gtag` shim if the
 * defaults script didn't run). Skipped when this value was already pushed on
 * this page view. Analytics mounts GTM only once the update is applied.
 */
export function applyConsent(consent: Consent): void {
  if (applied === consent) return;
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
  applied = consent;
  window.dispatchEvent(new Event(APPLIED_EVENT));
}

/** The value last pushed with `applyConsent`, or null. For useSyncExternalStore. */
export function readAppliedConsent(): Consent | null {
  return applied;
}

export function subscribeAppliedConsent(callback: () => void): () => void {
  window.addEventListener(APPLIED_EVENT, callback);
  return () => window.removeEventListener(APPLIED_EVENT, callback);
}

/** Store the choice and push the Consent Mode update synchronously, before anyone re-renders. */
export function writeConsent(consent: Consent): void {
  try {
    window.localStorage.setItem(KEY, consent);
    memory = null;
  } catch {
    memory = consent;
    // Storage blocked: the in-memory copy above keeps the choice for this page view.
  }
  applyConsent(consent);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Ask the banner to reopen (used by the footer "Cookie settings" button). */
export function openConsent(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** For useSyncExternalStore. Fires on writes in this tab and in other tabs. */
export function subscribeConsent(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
