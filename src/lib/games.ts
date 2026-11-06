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
