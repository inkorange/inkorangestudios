import type { Metadata } from "next";
import { NotFoundMessage } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found — inkOrange Studios" };

/**
 * The 404 for URLs that match no route. It renders in the root layout only, outside the `(site)`
 * shell, so it brings its own minimal chrome: the logo linking home. `notFound()` inside the site
 * (a missing game or post) lands on `(site)/not-found.tsx` instead, under the site header.
 */
export default function NotFound() {
  return (
    <main>
      <NotFoundMessage logo />
    </main>
  );
}
