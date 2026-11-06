import { Card, Stack, Text } from "@sanity/ui";
import type { Delivery } from "./useDelivery";

export type DeliveryTone = "default" | "primary" | "positive" | "caution" | "critical";

export function formatDate(iso: string | undefined): string {
  if (!iso) return "an unknown date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "an unknown date";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** What the banner says about a delivery document, and how loudly. */
export function describeDelivery(d: Delivery | null): { lines: string[]; tone: DeliveryTone } {
  const lines: string[] = [];
  let tone: DeliveryTone = "default";

  if (d?.status === "sending") {
    lines.push("Sending…");
    tone = "primary";
  } else if (d?.status === "sent") {
    lines.push(`Sent to ${d.recipientCount ?? 0} on ${formatDate(d.sentAt)}`);
    tone = "positive";
  } else if (d?.status === "failed") {
    // From the status alone: a later test send may have cleared `error`.
    lines.push("Sending failed — press Resume sending");
    tone = "critical";
  } else {
    lines.push("Not sent to subscribers yet");
  }

  if (d?.failedCount) {
    lines.push(`${d.failedCount} failed`);
    if (tone !== "critical") tone = "caution";
  }
  if (d?.uncertainCount) {
    lines.push(`${d.uncertainCount} uncertain (may not have arrived; never re-sent)`);
    if (tone !== "critical") tone = "caution";
  }
  if (d?.error) {
    lines.push(d.error);
    tone = "critical";
  }
  if (d?.lastTest?.at) lines.push(`Last test sent ${formatDate(d.lastTest.at)}`);

  return { lines, tone };
}

/** Live delivery status, shown above the email preview and in the "Send to subscribers" dialog. */
export function DeliveryStatus({ delivery, loading = false }: { delivery: Delivery | null; loading?: boolean }) {
  if (loading) {
    return (
      <Card padding={3} radius={2} border>
        <Text size={1} muted>
          Checking delivery status…
        </Text>
      </Card>
    );
  }
  const { lines, tone } = describeDelivery(delivery);
  return (
    <Card padding={3} radius={2} border tone={tone} role="status">
      <Stack gap={3}>
        {lines.map((line, i) => (
          <Text key={i} size={1} weight={i === 0 ? "semibold" : undefined}>
            {line}
          </Text>
        ))}
      </Stack>
    </Card>
  );
}
