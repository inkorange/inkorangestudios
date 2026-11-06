"use client";

import { useEffect, useRef, useState } from "react";
import { publicEnv } from "@/lib/env";
import { CAPTCHA_REQUIRED } from "@/lib/signups/captchaEnabled";
import styles from "./Turnstile.module.scss";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      "refresh-expired"?: "auto" | "manual" | "never";
      "response-field"?: boolean;
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function api(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function ensureScript(): Promise<void> {
  if (api()) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export type TurnstileProps = {
  /** Change after each submit result so the single-use token is renewed. */
  resetKey?: unknown;
};

/**
 * Cloudflare Turnstile. Writes the token into a hidden `captchaToken` input so
 * the surrounding form's FormData carries it. Renders nothing when
 * CAPTCHA_REQUIRED is false (tests, `next dev`, no keys).
 */
export function Turnstile({ resetKey }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const siteKey = CAPTCHA_REQUIRED ? publicEnv.turnstileSiteKey : undefined;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;
    void ensureScript().then(() => {
      const t = api();
      if (cancelled || !t || !ref.current || widgetId.current) return;
      widgetId.current = t.render(ref.current, {
        sitekey: siteKey,
        "refresh-expired": "auto",
        "response-field": false,
        callback: (value) => setToken(value),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    });
    return () => {
      cancelled = true;
      const t = api();
      if (widgetId.current && t) {
        try {
          t.remove(widgetId.current);
        } catch {
          // widget already gone
        }
      }
      widgetId.current = null;
    };
  }, [siteKey]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = api();
    if (!widgetId.current || !t) return;
    setToken("");
    t.reset(widgetId.current);
  }, [resetKey]);

  if (!siteKey) return null;
  return (
    <div className={styles.root}>
      <div ref={ref} />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
