export type Consent = "granted" | "denied";

const KEY = "io-consent";
const CHANGE_EVENT = "io:consent-change";
const OPEN_EVENT = "io:consent-open";

export const CONSENT_OPEN_EVENT = OPEN_EVENT;

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(consent: Consent): void {
  try {
    window.localStorage.setItem(KEY, consent);
  } catch {
    // Storage blocked: the choice still applies for this page view via the event.
  }
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
