export const NAV_ITEMS = [
  { key: "games", label: "Games", href: "/#games" },
  { key: "studio", label: "Studio", href: "/about" },
  { key: "news", label: "News", href: "/news" },
  { key: "press", label: "Press", href: "/#press" },
  { key: "support", label: "Support", href: "/support" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

export type HeaderVariant = "default" | "game";
/** `page` when the URL is the item's own page; `true` when it is somewhere inside that section. */
export type NavCurrent = "page" | "true";

const SECTION_PREFIXES: [string, NavKey][] = [
  ["/games", "games"],
  ["/about", "studio"],
  ["/news", "news"],
  ["/press", "press"],
  ["/support", "support"],
];

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export type NavState = { active: NavKey | undefined; current: NavCurrent; variant: HeaderVariant };

/** The header state for a URL path: which nav item is current (and how), and whether it's a game page. */
export function navStateForPath(path: string | null): NavState {
  if (!path) return { active: undefined, current: "page", variant: "default" };
  // The home page is the games showcase: inside Games, not the Games page.
  if (path === "/") return { active: "games", current: "true", variant: "default" };
  const match = SECTION_PREFIXES.find(([prefix]) => under(path, prefix));
  const current: NavCurrent = match && path !== match[0] ? "true" : "page";
  const variant: HeaderVariant = path.startsWith("/games/") ? "game" : "default";
  return { active: match?.[1], current, variant };
}
