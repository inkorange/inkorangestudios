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

/** How long to wait before re-listening after the listener errors. */
export const RETRY_MS = 5_000;

export type DeliveryState = {
  delivery: Delivery | null;
  /** Nothing known yet: no fetch or live event has landed. */
  loading: boolean;
  /** The live status couldn't be loaded or the listener dropped: what's shown may be stale. */
  error: boolean;
};

/**
 * The issue's delivery document, kept live. Listens for `welcome` and `mutation`: every `welcome`
 * (first connect and every reconnect) refetches, so writes made while disconnected aren't lost.
 * A listener error is shown as `error` and the listener is re-established after RETRY_MS.
 */
export function useDelivery(issueId: string): DeliveryState {
  const client = useClient({ apiVersion: API_VERSION });
  const id = deliveryId(issueId);
  const [state, setState] = useState<DeliveryState & { id: string }>({
    id,
    delivery: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;
    let mutations = 0; // a fetch started before the latest live event must not overwrite it
    let fetches = 0; // only the latest fetch may land
    let subscription: { unsubscribe(): void } | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;

    // Keep the last known delivery (for this issue only) but flag it as possibly stale.
    const fail = () =>
      setState((prev) => ({ id, delivery: prev.id === id ? prev.delivery : null, loading: false, error: true }));

    const refetch = () => {
      const fetchNo = ++fetches;
      const seenMutations = mutations;
      const stale = () => cancelled || fetchNo !== fetches || seenMutations !== mutations;
      client.fetch<Delivery | null>(QUERY, { id }).then(
        (delivery) => {
          if (!stale()) setState({ id, delivery: delivery ?? null, loading: false, error: false });
        },
        () => {
          if (!stale()) fail();
        },
      );
    };

    const connect = () => {
      retry = null;
      subscription = client
        .listen<Delivery>(LISTEN, { id }, { includeResult: true, visibility: "query", events: ["welcome", "mutation"] })
        .subscribe({
          next: (event: ListenEvent) => {
            if (event.type === "welcome") return refetch();
            if (event.type !== "mutation") return;
            mutations++;
            const delivery = event.transition === "disappear" ? null : (event.result ?? null);
            setState({ id, delivery, loading: false, error: false });
          },
          error: () => {
            if (cancelled) return;
            fail();
            retry = setTimeout(connect, RETRY_MS);
          },
        });
    };

    connect();
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      subscription?.unsubscribe();
    };
  }, [client, id]);

  // A different issue in the same component: don't show the previous issue's status.
  return state.id === id
    ? { delivery: state.delivery, loading: state.loading, error: state.error }
    : { delivery: null, loading: true, error: false };
}
