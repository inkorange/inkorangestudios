import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { tokenValue } from "@/lib/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "inkOrange",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "browser",
    background_color: tokenValue("--color-paper"),
    theme_color: tokenValue("--color-paper"),
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
