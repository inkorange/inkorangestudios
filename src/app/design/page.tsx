import type { Metadata } from "next";
import { DesignGallery } from "@/components/ui";

/**
 * The design-system gallery. Lives outside `(site)` on purpose: no site header or footer around
 * it (the gallery shows both as specimens). Internal: noindex and disallowed in robots.ts.
 */
export const metadata: Metadata = {
  title: "Design system — inkOrange Studios",
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  return (
    <main>
      <DesignGallery />
    </main>
  );
}
