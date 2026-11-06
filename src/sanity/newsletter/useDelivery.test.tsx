import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Observer = { next: (e: unknown) => void; error: (e: unknown) => void };

/** A minimal stand-in for the client's listen() Observable: push events, welcomes and errors by hand. */
const observers = new Set<Observer>();
const stream = {
  subscribe: (observer: Observer) => {
    observers.add(observer);
    return { unsubscribe: () => observers.delete(observer) };
  },
};
const emit = (e: unknown) => act(() => [...observers].forEach((o) => o.next(e)));
const welcome = () => emit({ type: "welcome", listenerName: "l" });
/** Like RxJS, an errored subscription is dead: it gets no further events. */
const fail = () =>
  act(() => {
    const dead = [...observers];
    observers.clear();
    dead.forEach((o) => o.error(new Error("channel closed")));
  });

const client = {
  fetch: vi.fn(),
  listen: vi.fn<(query: string, params: object, opts: { events?: string[] }) => typeof stream>(() => stream),
};
vi.mock("sanity", () => ({ useClient: () => client }));

const { RETRY_MS, deliveryId, publishedId, useDelivery } = await import("./useDelivery");

/** A promise the test resolves later, to order a slow fetch against live events. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

beforeEach(() => {
  client.fetch.mockReset();
  client.listen.mockClear();
  observers.clear();
});
afterEach(() => {
  vi.useRealTimers();
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
  it("listens for welcome and mutation, fetches on welcome, then follows live updates", async () => {
    client.fetch.mockResolvedValue({ _id: "newsletter.delivery.abc", status: "idle" });
    const { result } = renderHook(() => useDelivery("drafts.abc"));
    expect(result.current).toEqual({ delivery: null, loading: true, error: false });
    expect(client.listen.mock.calls[0][1]).toEqual({ id: "newsletter.delivery.abc" });
    expect(client.listen.mock.calls[0][2].events).toEqual(["welcome", "mutation"]);
    expect(client.fetch).not.toHaveBeenCalled();

    welcome();
    await waitFor(() => expect(result.current.delivery?.status).toBe("idle"));
    expect(result.current.loading).toBe(false);
    expect(client.fetch.mock.calls[0][1]).toEqual({ id: "newsletter.delivery.abc" });

    emit({ type: "mutation", transition: "update", result: { _id: "newsletter.delivery.abc", status: "sending" } });
    expect(result.current.delivery?.status).toBe("sending");

    emit({ type: "mutation", transition: "disappear" });
    expect(result.current.delivery).toBeNull();
  });

  it("refetches on every welcome, so writes made during a reconnect aren't lost", async () => {
    client.fetch.mockResolvedValueOnce({ status: "sending" }).mockResolvedValueOnce({ status: "sent", recipientCount: 9 });
    const { result } = renderHook(() => useDelivery("abc"));
    welcome();
    await waitFor(() => expect(result.current.delivery?.status).toBe("sending"));
    welcome(); // reconnected: the "sent" write happened while disconnected
    await waitFor(() => expect(result.current.delivery?.status).toBe("sent"));
    expect(client.fetch).toHaveBeenCalledTimes(2);
  });

  it("a slow fetch doesn't overwrite a newer live event", async () => {
    const slow = deferred<unknown>();
    client.fetch.mockReturnValue(slow.promise);
    const { result } = renderHook(() => useDelivery("abc"));
    welcome();
    emit({ type: "mutation", transition: "update", result: { status: "sent" } });
    await act(async () => slow.resolve({ status: "idle" }));
    expect(result.current.delivery?.status).toBe("sent");
  });

  it("treats a missing delivery doc as none", async () => {
    client.fetch.mockResolvedValue(null);
    const { result } = renderHook(() => useDelivery("abc"));
    welcome();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current).toEqual({ delivery: null, loading: false, error: false });
  });

  it("flags a failed fetch as an error, not as 'nothing sent'", async () => {
    client.fetch.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useDelivery("abc"));
    welcome();
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
  });

  it("flags a listener error, keeps the last known delivery, and re-listens after RETRY_MS", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    client.fetch.mockResolvedValue({ status: "sending" });
    const { result } = renderHook(() => useDelivery("abc"));
    welcome();
    await act(async () => {}); // let the fetch land
    expect(result.current.delivery?.status).toBe("sending");

    fail();
    expect(result.current.error).toBe(true);
    expect(result.current.delivery?.status).toBe("sending");
    expect(client.listen).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(RETRY_MS));
    expect(client.listen).toHaveBeenCalledTimes(2);

    client.fetch.mockResolvedValue({ status: "sent" });
    welcome();
    await act(async () => {});
    expect(result.current).toMatchObject({ delivery: { status: "sent" }, error: false });
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useDelivery("abc"));
    expect(observers.size).toBe(1);
    unmount();
    expect(observers.size).toBe(0);
  });

  it("cancels a pending retry on unmount", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { unmount } = renderHook(() => useDelivery("abc"));
    fail();
    unmount();
    act(() => vi.advanceTimersByTime(RETRY_MS * 2));
    expect(client.listen).toHaveBeenCalledTimes(1);
  });
});
