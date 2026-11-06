import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** A minimal stand-in for the client's listen() Observable. */
const listeners = new Set<(e: unknown) => void>();
const events = { next: (e: unknown) => listeners.forEach((l) => l(e)) };
const listenStream = {
  subscribe: (next: (e: unknown) => void) => {
    listeners.add(next);
    return { unsubscribe: () => listeners.delete(next) };
  },
};
const client = { fetch: vi.fn(), listen: vi.fn<(query: string, params: object) => typeof listenStream>(() => listenStream) };
vi.mock("sanity", () => ({ useClient: () => client }));

const { deliveryId, publishedId, useDelivery } = await import("./useDelivery");

beforeEach(() => {
  client.fetch.mockReset();
  client.listen.mockClear();
});

describe("ids", () => {
  it("strips draft and version prefixes", () => {
    expect(publishedId("drafts.abc")).toBe("abc");
    expect(publishedId("versions.r1.abc")).toBe("abc");
    expect(publishedId("abc")).toBe("abc");
  });
  it("names the delivery doc after the published issue id", () => {
    expect(deliveryId("drafts.abc")).toBe("newsletter.delivery.abc");
  });
});

describe("useDelivery", () => {
  it("fetches the delivery doc, then follows live updates", async () => {
    client.fetch.mockResolvedValue({ _id: "newsletter.delivery.abc", status: "idle" });
    const { result } = renderHook(() => useDelivery("drafts.abc"));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.delivery?.status).toBe("idle"));
    expect(result.current.loading).toBe(false);
    expect(client.fetch.mock.calls[0][1]).toEqual({ id: "newsletter.delivery.abc" });
    expect(client.listen.mock.calls[0][1]).toEqual({ id: "newsletter.delivery.abc" });

    act(() => events.next({ type: "mutation", transition: "update", result: { _id: "newsletter.delivery.abc", status: "sending" } }));
    expect(result.current.delivery?.status).toBe("sending");

    act(() => events.next({ type: "mutation", transition: "disappear" }));
    expect(result.current.delivery).toBeNull();
  });

  it("treats a missing delivery doc as none", async () => {
    client.fetch.mockResolvedValue(null);
    const { result } = renderHook(() => useDelivery("abc"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.delivery).toBeNull();
  });
});
