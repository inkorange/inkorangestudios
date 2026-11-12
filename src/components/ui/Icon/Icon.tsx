import type { ReactNode } from "react";

export type IconName = "chevron-left" | "chevron-right" | "play" | "globe" | "phone" | "menu" | "close" | "arrow-right" | "check" | "apple" | "android" | "zoom-in" | "expand" | "plus" | "minus" | "external";
export type IconSize = 16 | 18 | 20 | 26 | 34;

export type IconProps = {
  name: IconName;
  size?: IconSize;
};

const paths: Record<IconName, ReactNode> = {
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  play: <path d="M8 5v14l11-7z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
  check: <path d="M20 6 9 17l-5-5" />,
  "zoom-in": (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4M11 8v6M8 11h6" />
    </>
  ),
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  external: <path d="M7 17 17 7M8 7h9v9" />,
  // Platform logos (filled): the Apple mark for iOS and the Android robot's head.
  apple: (
    <path d="M15.6 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8zM13.3 5.9c.6-.8 1.1-1.8.9-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.7-1 2.8 1 .1 2.1-.5 2.8-1.3z" />
  ),
  android: (
    <>
      <path
        fillRule="evenodd"
        d="M2.5 18a9.5 9.5 0 0 1 19 0zM8 13.3a1.2 1.2 0 1 0 0 2.4a1.2 1.2 0 1 0 0-2.4zM16 13.3a1.2 1.2 0 1 0 0 2.4a1.2 1.2 0 1 0 0-2.4z"
      />
      <path d="M7.6 10.2 5.6 6.4M16.4 10.2l2-3.8" fill="none" stroke="currentColor" strokeWidth={1.6} />
    </>
  ),
};

const FILLED: ReadonlySet<IconName> = new Set(["play", "apple", "android"]);

export function Icon({ name, size = 18 }: IconProps) {
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? undefined : "currentColor"}
      strokeWidth={filled ? undefined : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
