"use client";

import { useEffect, useRef, useState } from "react";
import { publicEnv } from "@/lib/env-public";
import { CAPTCHA_WIDGET } from "@/lib/signups/captchaEnabled";
import { FormMessage } from "../FormMessage/FormMessage";
import styles from "./Turnstile.module.scss";

const LOAD_ERROR = "We couldn't load the human check. Please refresh or try again later.";

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
      appearance?: "always" | "execute" | "interaction-only";
      "before-interactive-callback"?: () => void;
      "after-interactive-callback"?: () => void;
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function api(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

let loading: Promise<void> | null = null;

/** Loads api.js once for every widget on the page. Rejects (and lets a later mount retry) if it fails. */
function ensureScript(): Promise<void> {
  if (api()) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    const script = s;
    const fail = () => {
      loading = null;
      script.remove();
      reject(new Error("Turnstile script failed to load"));
    };
    script.addEventListener("load", () => (api() ? resolve() : fail()), { once: true });
    script.addEventListener("error", fail, { once: true });
  });
  return loading;
}

/** True when a widget will render, i.e. a token must be earned before submit. */
export function turnstileActive(): boolean {
  return CAPTCHA_WIDGET && Boolean(publicEnv.turnstileSiteKey);
}

export type TurnstileProps = {
  /** Reports whether a token is currently held (false while waiting/expired). */
  onTokenChange?: (hasToken: boolean) => void;
  /** Change after each submit result so the single-use token is renewed. */
  resetKey?: unknown;
};

/**
 * Cloudflare Turnstile, silent unless a visitor has to interact (`interaction-only`). Writes
 * the token into a hidden `captchaToken` input so the surrounding form's FormData carries it. Renders nothing when
 * CAPTCHA_WIDGET is false (tests, `next dev`, no site key).
 */
export function Turnstile({ resetKey, onTokenChange }: TurnstileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState("");
  // The script or the widget failed: say so instead of leaving submit silently disabled.
  const [failed, setFailed] = useState(false);
  // Silent by default: the widget only appears if Cloudflare needs the visitor to interact.
  const [interactive, setInteractive] = useState(false);
  const siteKey = CAPTCHA_WIDGET ? publicEnv.turnstileSiteKey : undefined;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;
    ensureScript().then(
      () => {
        const t = api();
        if (cancelled || !t || !ref.current || widgetId.current) return;
        widgetId.current = t.render(ref.current, {
          sitekey: siteKey,
          "refresh-expired": "auto",
          "response-field": false,
          appearance: "interaction-only",
          "before-interactive-callback": () => setInteractive(true),
          "after-interactive-callback": () => setInteractive(false),
          callback: (value) => {
            setFailed(false);
            setToken(value);
          },
          "expired-callback": () => setToken(""),
          "error-callback": () => {
            setToken("");
            setFailed(true);
          },
        });
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
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

  useEffect(() => {
    if (siteKey) onTokenChange?.(token !== "");
  }, [siteKey, token, onTokenChange]);

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
    <div className={styles.root} data-visible={interactive || failed}>
      <div ref={ref} />
      <input type="hidden" name="captchaToken" value={token} />
      {failed ? <FormMessage status="error">{LOAD_ERROR}</FormMessage> : null}
    </div>
  );
}
