"use client";

import { openConsent } from "@/lib/consent";
import styles from "./SiteFooter.module.scss";

export function CookieSettingsButton() {
  return (
    <button type="button" className={styles.action} onClick={openConsent}>
      Cookie settings
    </button>
  );
}
