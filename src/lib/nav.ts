export const NAV_ITEMS = [
  { key: "games", label: "Games", href: "/#games" },
  { key: "studio", label: "Studio", href: "/about" },
  { key: "news", label: "News", href: "/news" },
  { key: "press", label: "Press", href: "/#press" },
  { key: "support", label: "Support", href: "/support" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

export type HeaderVariant = "default" | "game";

const SECTION_PREFIXES: [string, NavKey][] = [
  ["/games", "games"],
  ["/about", "studio"],
  ["/news", "news"],
  ["/press", "press"],
  ["/support", "support"],
];

const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** The header state for a URL path: which nav item is current, and whether it's a game page. */
export function navStateForPath(path: string | null): { active: NavKey | undefined; variant: HeaderVariant } {
  if (!path) return { active: undefined, variant: "default" };
  // The home page is the games showcase.
  if (path === "/") return { active: "games", variant: "default" };
  const match = SECTION_PREFIXES.find(([prefix]) => under(path, prefix));
  const variant: HeaderVariant = path.startsWith("/games/") ? "game" : "default";
  return { active: match?.[1], variant };
}
