import type { ReactNode } from "react";

export type IconName = "chevron-left" | "chevron-right" | "play" | "globe" | "phone" | "menu" | "close" | "arrow-right";
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
};

export function Icon({ name, size = 18 }: IconProps) {
  const filled = name === "play";
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
