"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button/Button";
import { NotFoundMessage } from "@/components/ui/NotFoundMessage/NotFoundMessage";

type ErrorPageProps = { error: unknown; retry: () => void; reset: () => void };

/**
 * Runtime errors below the root layout, e.g. Sanity unreachable with nothing
 * cached for this URL (content reads rethrow at runtime; see src/lib/sanity/content.ts).
 * It replaces the `(site)` shell, so it brings the logo linking home. `retry`
 * re-fetches and re-renders the segment.
 */
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <title>Something went wrong — inkOrange Studios</title>
      <NotFoundMessage
        logo
        title="Something went wrong"
        message="We couldn't load this page. Please try again in a moment."
        action={
          <Button variant="accent" onClick={() => retry()}>
            Try again
          </Button>
        }
      />
    </main>
  );
}
