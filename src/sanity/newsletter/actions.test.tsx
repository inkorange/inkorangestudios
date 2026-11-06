import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@sanity/ui";
import { buildTheme } from "@sanity/ui/theme";
import type { ReactNode } from "react";
import type { DocumentActionComponent, DocumentActionProps, SanityDocument } from "sanity";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Delivery } from "./useDelivery";

const client = { create: vi.fn() };
const toast = { push: vi.fn() };
let delivery: { delivery: Delivery | null; loading: boolean } = { delivery: null, loading: false };

vi.mock("sanity", () => ({ useClient: () => client }));
vi.mock("@sanity/ui/toast", () => ({ useToast: () => toast }));
vi.mock("./useDelivery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./useDelivery")>()),
  useDelivery: () => delivery,
}));

const {
  ResumeSendingAction,
  SendTestAction,
  SendToSubscribersAction,
  canResume,
  createRequest,
  sendDisabledReason,
} = await import("./actions");

const theme = buildTheme();

function doc(id: string, rev: string, subject = "Spring news"): SanityDocument {
  return { _id: id, _type: "studioNewsletterIssue", _rev: rev, _createdAt: "", _updatedAt: "", subject };
}

function props(over: Partial<DocumentActionProps> = {}): DocumentActionProps {
  return {
    id: "issue-1",
    type: "studioNewsletterIssue",
    draft: null,
    published: doc("issue-1", "pub-rev"),
    version: null,
    liveEdit: false,
    liveEditSchemaType: false,
    ready: true,
    transactionSyncLock: null,
    onComplete: () => {},
    initialValueResolved: true,
    ...over,
  } as DocumentActionProps;
}

/** Renders an action the way the Studio does: called as a hook, its description turned into UI. */
function Harness({ action, actionProps }: { action: DocumentActionComponent; actionProps: DocumentActionProps }) {
  const d = action(actionProps);
  if (!d) return <p>hidden</p>;
  const dialog = d.dialog;
  let dialogNode: ReactNode = null;
  if (dialog && dialog.type === "confirm") {
    dialogNode = (
      <div role="dialog">
        {dialog.message}
        <button onClick={dialog.onCancel}>{dialog.cancelButtonText ?? "Cancel"}</button>
        <button onClick={dialog.onConfirm}>{dialog.confirmButtonText ?? "Confirm"}</button>
      </div>
    );
  } else if (dialog && (dialog.type === "dialog" || dialog.type === undefined)) {
    dialogNode = (
      <div role="dialog">
        {dialog.header}
        {dialog.content}
        {dialog.footer}
      </div>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <button disabled={d.disabled} title={typeof d.title === "string" ? d.title : undefined} onClick={d.onHandle}>
        {d.label}
      </button>
      {dialogNode}
    </ThemeProvider>
  );
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

beforeEach(() => {
  client.create.mockReset().mockResolvedValue({});
  toast.push.mockReset();
  delivery = { delivery: null, loading: false };
});

describe("createRequest", () => {
  it("creates a published request doc under the newsletter.request. path", async () => {
    await createRequest(client as never, "drafts.issue-1", "count", "rev-1");
    expect(client.create).toHaveBeenCalledTimes(1);
    const created = client.create.mock.calls[0][0];
    expect(created._id).toMatch(/^newsletter\.request\.[0-9a-f-]{36}$/);
    expect(created).toMatchObject({
      _type: "studioNewsletterRequest",
      issueId: "issue-1",
      kind: "count",
      revision: "rev-1",
    });
    expect(Number.isNaN(Date.parse(created.requestedAt))).toBe(false);
  });

  it("uses a fresh id for every request", async () => {
    await createRequest(client as never, "issue-1", "test", "r");
    await createRequest(client as never, "issue-1", "test", "r");
    expect(client.create.mock.calls[0][0]._id).not.toBe(client.create.mock.calls[1][0]._id);
  });
});

describe("sendDisabledReason", () => {
  const published = doc("issue-1", "pub-rev");

  it("is enabled when published, no draft, and delivery is absent or idle", () => {
    expect(sendDisabledReason({ draft: null, published }, null)).toBeNull();
    expect(sendDisabledReason({ draft: null, published }, { status: "idle" })).toBeNull();
  });

  it("asks to publish an unpublished issue", () => {
    expect(sendDisabledReason({ draft: doc("drafts.issue-1", "d"), published: null }, null)).toBe(
      "Publish the issue first",
    );
  });

  it("asks to publish changes when a draft exists", () => {
    expect(sendDisabledReason({ draft: doc("drafts.issue-1", "d"), published }, null)).toBe(
      "Publish your changes first",
    );
  });

  it("says when it was already sent", () => {
    expect(sendDisabledReason({ draft: null, published }, { status: "sent", sentAt: "2026-11-02T10:00:00Z" })).toMatch(
      /^Already sent on .*2026/,
    );
  });

  it("is disabled while sending", () => {
    expect(sendDisabledReason({ draft: null, published }, { status: "sending" })).toBe("Sending is in progress");
  });

  it("is disabled after a failed send (resume instead)", () => {
    expect(sendDisabledReason({ draft: null, published }, { status: "failed" })).toMatch(/Resume sending/);
  });
});

describe("canResume", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  it("is offered for any failed delivery", () => {
    expect(canResume({ status: "failed" }, now)).toBe(true);
    expect(canResume({ status: "failed", recipientCount: 10 }, now)).toBe(true);
  });
  it("is offered for a send stuck for more than 15 minutes", () => {
    expect(canResume({ status: "sending", _updatedAt: "2026-11-06T11:44:00Z" }, now)).toBe(true);
    expect(canResume({ status: "sending", _updatedAt: "2026-11-06T11:50:00Z" }, now)).toBe(false);
  });
  it("is not offered otherwise", () => {
    expect(canResume(null, now)).toBe(false);
    expect(canResume({ status: "idle" }, now)).toBe(false);
    expect(canResume({ status: "sent" }, now)).toBe(false);
    expect(canResume({ status: "sending" }, now)).toBe(false);
  });
});

describe("Send test", () => {
  it("creates a test request with the draft's revision and confirms with a toast", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        action={SendTestAction}
        actionProps={props({ id: "issue-1", draft: doc("drafts.issue-1", "draft-rev") })}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Send test" }));
    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({ issueId: "issue-1", kind: "test", revision: "draft-rev" }),
    );
    expect(toast.push).toHaveBeenCalledWith(expect.objectContaining({ title: "Test on its way to your inbox" }));
  });

  it("uses the published revision without a draft", async () => {
    const user = userEvent.setup();
    render(<Harness action={SendTestAction} actionProps={props()} />);
    await user.click(screen.getByRole("button", { name: "Send test" }));
    expect(client.create).toHaveBeenCalledWith(expect.objectContaining({ kind: "test", revision: "pub-rev" }));
  });

  it("is disabled for an unsaved issue", () => {
    render(<Harness action={SendTestAction} actionProps={props({ published: null })} />);
    expect(screen.getByRole("button", { name: "Send test" })).toBeDisabled();
  });
});

describe("Send to subscribers", () => {
  it("is disabled with a reason when a draft exists", () => {
    render(
      <Harness action={SendToSubscribersAction} actionProps={props({ draft: doc("drafts.issue-1", "d") })} />,
    );
    const button = screen.getByRole("button", { name: "Send to subscribers" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Publish your changes first");
  });

  it("is disabled with a reason when already sent", () => {
    delivery = { delivery: { status: "sent", sentAt: "2026-11-02T10:00:00Z", recipientCount: 5 }, loading: false };
    render(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    const button = screen.getByRole("button", { name: "Send to subscribers" });
    expect(button).toBeDisabled();
    expect(button.getAttribute("title")).toMatch(/^Already sent on/);
  });

  it("is disabled with a reason while sending", () => {
    delivery = { delivery: { status: "sending", _updatedAt: minutesAgo(1) }, loading: false };
    render(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    const button = screen.getByRole("button", { name: "Send to subscribers" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", "Sending is in progress");
  });

  it("counts on open, waits for a fresh count, then broadcasts the published revision", async () => {
    const user = userEvent.setup();
    delivery = {
      delivery: { _id: "newsletter.delivery.issue-1", status: "idle", audienceCount: 3, countedAt: minutesAgo(60) },
      loading: false,
    };
    const actionProps = props({ published: doc("issue-1", "pub-rev", "Spring news") });
    const { rerender } = render(<Harness action={SendToSubscribersAction} actionProps={actionProps} />);

    await user.click(screen.getByRole("button", { name: "Send to subscribers" }));
    expect(client.create).toHaveBeenCalledTimes(1);
    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({ issueId: "issue-1", kind: "count", revision: "pub-rev" }),
    );
    // The old count is stale: keep waiting.
    expect(screen.getByText("Counting…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    delivery = {
      delivery: { _id: "newsletter.delivery.issue-1", status: "idle", audienceCount: 42, countedAt: new Date().toISOString() },
      loading: false,
    };
    rerender(<Harness action={SendToSubscribersAction} actionProps={actionProps} />);
    expect(screen.getByText('Send "Spring news" to 42 confirmed subscribers?')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(client.create).toHaveBeenCalledTimes(2);
    expect(client.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ issueId: "issue-1", kind: "broadcast", revision: "pub-rev" }),
    );
  });

  it("holds off after Send until the server writes the delivery doc, then follows it", async () => {
    const user = userEvent.setup();
    const before = { _id: "d", _updatedAt: minutesAgo(60), status: "idle" as const, countedAt: minutesAgo(60) };
    delivery = { delivery: before, loading: false };
    const { rerender } = render(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    await user.click(screen.getByRole("button", { name: "Send to subscribers" }));
    const counted = { ...before, _updatedAt: minutesAgo(0), audienceCount: 2, countedAt: new Date().toISOString() };
    delivery = { delivery: counted, loading: false };
    rerender(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByRole("button", { name: "Send to subscribers" })).toHaveAttribute(
      "title",
      "Sending has been requested",
    );

    // The server refused (e.g. no mailing address): status stays idle, the doc changes, the action is usable again.
    delivery = { delivery: { ...counted, _updatedAt: new Date(Date.now() + 1000).toISOString(), error: "No address" }, loading: false };
    rerender(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    expect(screen.getByRole("button", { name: "Send to subscribers" })).toBeEnabled();
  });

  it("Cancel closes the dialog without broadcasting", async () => {
    const user = userEvent.setup();
    render(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    await user.click(screen.getByRole("button", { name: "Send to subscribers" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(client.create).toHaveBeenCalledTimes(1);
    expect(client.create.mock.calls[0][0].kind).toBe("count");
  });

  it("won't send to nobody", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    await user.click(screen.getByRole("button", { name: "Send to subscribers" }));
    delivery = { delivery: { status: "idle", audienceCount: 0, countedAt: new Date().toISOString() }, loading: false };
    rerender(<Harness action={SendToSubscribersAction} actionProps={props()} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});

describe("Resume sending", () => {
  it("is hidden while a send is fresh", () => {
    delivery = { delivery: { status: "sending", _updatedAt: minutesAgo(5) }, loading: false };
    render(<Harness action={ResumeSendingAction} actionProps={props()} />);
    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("is hidden when idle or sent", () => {
    delivery = { delivery: { status: "sent" }, loading: false };
    render(<Harness action={ResumeSendingAction} actionProps={props()} />);
    expect(screen.getByText("hidden")).toBeInTheDocument();
  });

  it("is shown for a stuck send and creates a resume request on confirm", async () => {
    const user = userEvent.setup();
    delivery = { delivery: { status: "sending", _updatedAt: minutesAgo(20) }, loading: false };
    render(<Harness action={ResumeSendingAction} actionProps={props()} />);
    await user.click(screen.getByRole("button", { name: "Resume sending" }));
    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({ issueId: "issue-1", kind: "resume", revision: "pub-rev" }),
    );
  });

  it("is shown for a failed send", () => {
    delivery = { delivery: { status: "failed" }, loading: false };
    render(<Harness action={ResumeSendingAction} actionProps={props()} />);
    expect(screen.getByRole("button", { name: "Resume sending" })).toBeEnabled();
  });

  it("appears once a send has been quiet for 15 minutes", () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    try {
      delivery = { delivery: { status: "sending", _updatedAt: minutesAgo(10) }, loading: false };
      render(<Harness action={ResumeSendingAction} actionProps={props()} />);
      expect(screen.getByText("hidden")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(6 * 60_000));
      expect(screen.getByRole("button", { name: "Resume sending" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("icons", () => {
  it("come from @sanity/icons subpaths (the v5 root entry exports them as `never`, which only fails at bundle time)", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const dir = import.meta.dirname;
    for (const file of readdirSync(dir).filter((f) => /\.tsx?$/.test(f) && !f.includes(".test."))) {
      expect(readFileSync(`${dir}/${file}`, "utf8"), file).not.toMatch(/from "@sanity\/icons"/);
    }
  });
});
