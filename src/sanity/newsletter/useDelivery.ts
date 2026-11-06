import { useEffect, useState } from "react";
import { useClient } from "sanity";

/** Same API version as the site's client (src/lib/sanity/client.ts is server-only, so it's repeated here). */
export const API_VERSION = "2026-11-01";

/** The server-written delivery document (`newsletter.delivery.<issueId>`). Every field is optional until the server writes it. */
export type Delivery = {
  _id?: string;
  _updatedAt?: string;
  status?: "idle" | "sending" | "sent" | "failed";
  audienceCount?: number;
  countedAt?: string;
  lastTest?: { at?: string; revision?: string };
  sentAt?: string;
  recipientCount?: number;
  failedCount?: number;
  uncertainCount?: number;
  error?: string | null;
};

/** The published id of a draft (`drafts.x`) or release version (`versions.<release>.x`). The server ignores anything else. */
export function publishedId(id: string): string {
  return id.replace(/^drafts\./, "").replace(/^versions\.[^.]+\./, "");
}

export function deliveryId(issueId: string): string {
  return `newsletter.delivery.${publishedId(issueId)}`;
}

const QUERY = /* groq */ `*[_id == $id][0]`;
const LISTEN = /* groq */ `*[_id == $id]`;

type ListenEvent = { type?: string; transition?: string; result?: Delivery };

/** The issue's delivery document: fetched once, then kept live with `client.listen`. */
export function useDelivery(issueId: string): { delivery: Delivery | null; loading: boolean } {
  const client = useClient({ apiVersion: API_VERSION });
  const id = deliveryId(issueId);
  const [state, setState] = useState<{ id: string; delivery: Delivery | null; loading: boolean }>({
    id,
    delivery: null,
    loading: true,
  });

  useEffect(() => {
    let live = false; // once a live event lands, a slower initial fetch must not overwrite it
    let cancelled = false;
    const subscription = client.listen<Delivery>(LISTEN, { id }, { includeResult: true, visibility: "query" }).subscribe(
      (event: ListenEvent) => {
        if (event.type !== "mutation") return;
        live = true;
        const delivery = event.transition === "disappear" ? null : (event.result ?? null);
        setState({ id, delivery, loading: false });
      },
    );
    client.fetch<Delivery | null>(QUERY, { id }).then(
      (delivery) => {
        if (!cancelled && !live) setState({ id, delivery: delivery ?? null, loading: false });
      },
      () => {
        if (!cancelled && !live) setState({ id, delivery: null, loading: false });
      },
    );
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [client, id]);

  // A different issue in the same component: don't show the previous issue's status.
  return state.id === id ? { delivery: state.delivery, loading: state.loading } : { delivery: null, loading: true };
}
