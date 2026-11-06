const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });

/** ISO date -> "NOV 5, 2026", always in UTC so server timezone never shifts the day. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatter.format(d).toUpperCase();
}
