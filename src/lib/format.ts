const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });

export type DateCase = "upper" | "title";

/**
 * ISO date -> "NOV 5, 2026" (default, for mono metadata) or "Nov 5, 2026" (`case: "title"`, for
 * sentences such as "Last updated …"). Always UTC so server timezone never shifts the day.
 */
export function formatDate(iso: string, opts: { case?: DateCase } = {}): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const text = formatter.format(d);
  return opts.case === "title" ? text : text.toUpperCase();
}
