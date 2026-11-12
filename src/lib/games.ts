export type GameStatus = "out-now" | "coming-soon" | "in-development" | "announcing-soon";

const LABELS: Record<GameStatus, { full: string; short: string }> = {
  "out-now": { full: "OUT NOW", short: "OUT NOW" },
  "coming-soon": { full: "COMING SOON", short: "SOON" },
  "in-development": { full: "IN DEVELOPMENT", short: "IN DEV" },
  "announcing-soon": { full: "ANNOUNCING SOON", short: "TBA" },
};

export function statusLabel(status: GameStatus, short = false): string {
  return short ? LABELS[status].short : LABELS[status].full;
}

const BETA_PLATFORMS: Record<string, string> = { ios: "iOS", android: "Android" };

/** "ios" -> "iOS": the beta platform values the Studio stores, as people read them. */
export function betaPlatformLabel(value: string): string {
  return BETA_PLATFORMS[value] ?? value;
}

/** The platforms a game can be on, in display order. The Studio stores these exact values. */
export const PLATFORMS = ["Android", "iOS", "Web"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** A stored value as a known platform (case and spacing forgiven), or null for anything else ("Android (soon)"). */
export function toPlatform(value: unknown): Platform | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return PLATFORMS.find((p) => p.toLowerCase() === v) ?? null;
}

/** What each platform's store link says: the badge's alt text, and the phone play bar's button. */
export const STORE_LINK_LABELS: Record<Platform, { badge: string; short: string }> = {
  Android: { badge: "Get it on Google Play", short: "Google Play" },
  iOS: { badge: "Download on the App Store", short: "App Store" },
  Web: { badge: "Play in your browser", short: "Play in browser" },
};

/** What a tester signup asks for, by the platforms its beta is open on. */
export type BetaSignupCopy = {
  /** The warning at the top of the tester page; null when the beta is on both phones. */
  notice: string | null;
  /** The email field's (visually hidden) label. */
  label: string;
  placeholder: string;
  /** What happens after signing up: under the form, and the success message. */
  next: string;
};

export function betaSignupCopy(platforms: string[]): BetaSignupCopy {
  const only = platforms.length === 1 ? platforms[0] : null;
  if (only === "android") {
    return {
      notice:
        "Android only for now. Sign up with the Google account you use for the Play Store on your Android phone.",
      label: "Your Google Play email",
      placeholder: "you@gmail.com",
      next: "We'll add you to the test and email you a link to install it from Google Play.",
    };
  }
  if (only === "ios") {
    return {
      notice: "iPhone only for now. To join, enter the email address of your Apple ID.",
      label: "Your Apple ID email",
      placeholder: "you@example.com",
      next: "We'll email you a TestFlight invite to install it on your iPhone.",
    };
  }
  return {
    notice: null,
    label: "Email address",
    placeholder: "you@example.com",
    next: "We'll email you when a beta spot opens.",
  };
}
