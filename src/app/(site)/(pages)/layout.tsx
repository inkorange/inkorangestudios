import type { ReactNode } from "react";
import { SiteFooterBlock } from "@/components/site/SiteFooterBlock";

/** Every public page except game pages: the page in `<main>`, then the full footer. */
export default function PagesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <SiteFooterBlock variant="full" />
    </>
  );
}
