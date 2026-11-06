import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.siteUrl.replace(/\/+$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/design", "/api"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
