export const NAV_ITEMS = [
  { key: "games", label: "Games", href: "/#games" },
  { key: "studio", label: "Studio", href: "/about" },
  { key: "news", label: "News", href: "/news" },
  { key: "press", label: "Press", href: "/#press" },
  { key: "support", label: "Support", href: "/support" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];
