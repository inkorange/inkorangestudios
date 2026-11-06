"use client";

type GlobalErrorProps = { error: unknown; retry: () => void; reset: () => void };

/**
 * Last resort when the root layout itself fails. It replaces the whole document,
 * without global styles or fonts, so it stays deliberately plain. Page-level
 * errors use the branded src/app/error.tsx instead.
 */
export default function GlobalError({ retry }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <title>Something went wrong — inkOrange Studios</title>
        <main>
          <h1>Something went wrong</h1>
          <p>We couldn&apos;t load inkOrange Studios. Please try again in a moment.</p>
          <button type="button" onClick={() => retry()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
