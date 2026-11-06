import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyOwner } from "./notify";

const msg = { subject: "New signup", replyTo: "a@b.co", lines: ["Email: a@b.co", "Game: x"] };

describe("notifyOwner", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("POSTMARK_SERVER_TOKEN", "tok");
    vi.stubEnv("FEEDBACK_FROM_EMAIL", "from@x.co");
    vi.stubEnv("FEEDBACK_NOTIFY_EMAIL", "me@x.co");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does nothing when the token is missing", async () => {
    vi.stubEnv("POSTMARK_SERVER_TOKEN", "");
    await notifyOwner(msg);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does nothing when any env var is whitespace-only", async () => {
    vi.stubEnv("FEEDBACK_NOTIFY_EMAIL", "   ");
    await notifyOwner(msg);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts one Postmark email", async () => {
    await notifyOwner(msg);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.postmarkapp.com/email");
    expect(init.headers["X-Postmark-Server-Token"]).toBe("tok");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      From: "from@x.co",
      To: "me@x.co",
      ReplyTo: "a@b.co",
      MessageStream: "outbound",
      TextBody: "Email: a@b.co\nGame: x",
    });
    expect(body.Subject.startsWith("[inkOrange] ")).toBe(true);
  });

  it("caps the subject at 180 chars", async () => {
    await notifyOwner({ ...msg, subject: "s".repeat(500) });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).Subject).toHaveLength(180);
  });

  it("swallows fetch rejection", async () => {
    fetchMock.mockRejectedValue(new Error("down"));
    await expect(notifyOwner(msg)).resolves.toBeUndefined();
  });
});
