import { NotFoundMessage } from "@/components/ui";

/**
 * `notFound()` from a site page (a missing game or post). It renders inside `(site)/layout.tsx`,
 * so the site header is already above it (no second logo); the leaf layouts' footer is not.
 */
export default function SiteNotFound() {
  return (
    <main>
      <NotFoundMessage />
    </main>
  );
}
