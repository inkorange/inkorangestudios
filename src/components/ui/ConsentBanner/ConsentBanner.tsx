"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CONSENT_OPEN_EVENT, readConsent, subscribeConsent, writeConsent, type Consent } from "@/lib/consent";
import { Button } from "../Button/Button";
import styles from "./ConsentBanner.module.scss";

// On the server (and during hydration) report a stored choice so nothing flashes.
const serverSnapshot = (): Consent => "denied";

export function ConsentBanner() {
  const stored = useSyncExternalStore(subscribeConsent, readConsent, serverSnapshot);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  if (stored !== null && !reopened) return null;

  const choose = (consent: Consent) => {
    writeConsent(consent);
    setReopened(false);
  };

  return (
    <section className={styles.root} aria-label="Cookie consent">
      <p className={styles.text}>We use cookies to understand how the site is used. You can change this anytime in Cookie settings.</p>
      <div className={styles.actions}>
        <Button variant="accent" size="s" onClick={() => choose("granted")}>
          Accept
        </Button>
        <Button variant="outline-on-dark" size="s" onClick={() => choose("denied")}>
          Decline
        </Button>
      </div>
    </section>
  );
}
