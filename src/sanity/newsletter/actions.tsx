import { EnvelopeIcon } from "@sanity/icons/Envelope";
import { PlayIcon } from "@sanity/icons/Play";
import { RocketIcon } from "@sanity/icons/Rocket";
import { Button, Flex, Stack, Text } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { useEffect, useState } from "react";
import { useClient, type DocumentActionComponent, type SanityClient, type SanityDocument } from "sanity";
import { DeliveryStatus, LOAD_ERROR, formatDate } from "./DeliveryStatus";
import { API_VERSION, publishedId, useDelivery, type Delivery } from "./useDelivery";

export type RequestKind = "test" | "count" | "broadcast" | "resume";

/**
 * Asks the server to act on an issue. The request is created published (no draft) under the
 * private `newsletter.` path; the signed webhook fires once on create and the server handles it once.
 */
export function createRequest(client: SanityClient, issueId: string, kind: RequestKind, revision: string) {
  return client.create({
    _id: `newsletter.request.${crypto.randomUUID()}`,
    _type: "studioNewsletterRequest",
    issueId: publishedId(issueId),
    kind,
    revision,
    requestedAt: new Date().toISOString(),
  });
}

/** Why "Send to subscribers" is unavailable, or null when it can be used. */
export function sendDisabledReason(
  doc: { draft: SanityDocument | null; published: SanityDocument | null },
  delivery: Delivery | null,
): string | null {
  if (!doc.published) return "Publish the issue first";
  if (doc.draft) return "Publish your changes first";
  const status = delivery?.status;
  if (status === "sent") return `Already sent on ${formatDate(delivery?.sentAt)}`;
  if (status === "sending") return "Sending is in progress";
  if (status === "failed") return "Sending failed: use Resume sending";
  return null;
}

const STALE_MS = 15 * 60_000;

/** Resume is offered after any failure, or when a send has written nothing for 15 minutes. */
export function canResume(delivery: Delivery | null, now: number): boolean {
  if (delivery?.status === "failed") return true;
  if (delivery?.status !== "sending" || !delivery._updatedAt) return false;
  const updated = Date.parse(delivery._updatedAt);
  return !Number.isNaN(updated) && now - updated > STALE_MS;
}

/** The current time, refreshed every 30 seconds while `active` (so a stuck send's Resume appears on its own). */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

export const SendTestAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION });
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const revision = props.draft?._rev ?? props.published?._rev;

  return {
    label: "Send test",
    icon: EnvelopeIcon,
    disabled: !revision || busy,
    title: revision ? "Email this issue (with unpublished changes) to the test inbox" : "Save the issue first",
    onHandle: () => {
      if (!revision) return;
      setBusy(true);
      createRequest(client, props.id, "test", revision)
        .then(
          () => toast.push({ status: "success", title: "Test on its way to your inbox" }),
          (e) => toast.push({ status: "error", title: "Couldn't request a test", description: errorText(e) }),
        )
        .finally(() => setBusy(false));
    },
  };
};
SendTestAction.displayName = "SendTestAction";

export const SendToSubscribersAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION });
  const toast = useToast();
  const { delivery, loading, error } = useDelivery(props.id);
  // The countedAt seen when the dialog opened: a count is fresh once it changes.
  const [opened, setOpened] = useState<{ countedAt: string | undefined } | null>(null);
  const [busy, setBusy] = useState(false);
  // After Send, hold the action off until the server next writes the delivery doc (sending, or a refusal).
  const [requested, setRequested] = useState<{ updatedAt: string | undefined } | null>(null);

  const revision = props.published?._rev;
  const subject = typeof props.published?.subject === "string" ? props.published.subject : "this issue";
  const waitingForServer = requested !== null && delivery?._updatedAt === requested.updatedAt;
  const reason = error
    ? LOAD_ERROR
    : loading
      ? "Checking delivery status…"
      : (sendDisabledReason(props, delivery) ?? (waitingForServer ? "Sending has been requested" : null));

  const close = () => {
    setOpened(null);
    setBusy(false);
  };

  const countedAt = delivery?.countedAt;
  const fresh = opened !== null && !!countedAt && countedAt !== opened.countedAt;
  const n = delivery?.audienceCount ?? 0;
  const canSend = fresh && n > 0 && !reason && !busy && !!revision;

  const send = () => {
    if (!canSend || !revision) return;
    setBusy(true);
    createRequest(client, props.id, "broadcast", revision).then(
      () => {
        setRequested({ updatedAt: delivery?._updatedAt });
        close();
        toast.push({ status: "success", title: `Sending "${subject}" to ${n} subscribers` });
      },
      (e) => {
        setBusy(false);
        toast.push({ status: "error", title: "Couldn't start sending", description: errorText(e) });
      },
    );
  };

  let body: string;
  if (!fresh) body = "Counting…";
  else if (n === 0) body = "There are no confirmed subscribers yet.";
  else body = `Send "${subject}" to ${n} confirmed ${n === 1 ? "subscriber" : "subscribers"}?`;

  return {
    label: "Send to subscribers",
    icon: RocketIcon,
    tone: "primary",
    disabled: !!reason && opened === null,
    title: reason ?? undefined,
    onHandle: () => {
      if (reason || !revision) return;
      setOpened({ countedAt });
      createRequest(client, props.id, "count", revision).catch((e) => {
        toast.push({ status: "error", title: "Couldn't count subscribers", description: errorText(e) });
      });
    },
    dialog: opened && {
      type: "dialog",
      header: "Send to subscribers",
      onClose: close,
      content: (
        <Stack gap={4}>
          <DeliveryStatus delivery={delivery} loading={loading} error={error} />
          <Text size={2}>{body}</Text>
          {reason ? (
            <Text size={1} muted>
              {reason}
            </Text>
          ) : null}
        </Stack>
      ),
      footer: (
        <Flex gap={2} justify="flex-end" padding={3}>
          <Button mode="ghost" text="Cancel" onClick={close} />
          <Button tone="primary" text="Send" icon={RocketIcon} disabled={!canSend} loading={busy} onClick={send} />
        </Flex>
      ),
    },
  };
};
SendToSubscribersAction.displayName = "SendToSubscribersAction";

export const ResumeSendingAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: API_VERSION });
  const toast = useToast();
  const { delivery } = useDelivery(props.id);
  const now = useNow(delivery?.status === "sending");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!canResume(delivery, now)) return null;
  const revision = props.published?._rev ?? props.draft?._rev ?? "";

  return {
    label: "Resume sending",
    icon: PlayIcon,
    tone: "caution",
    disabled: busy,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: "confirm",
      tone: "caution",
      message:
        "Resume sending this issue? Batches that haven't gone out are sent now. A batch that may already have gone out is never sent again.",
      confirmButtonText: "Resume",
      cancelButtonText: "Cancel",
      onCancel: () => setOpen(false),
      onConfirm: () => {
        setOpen(false);
        setBusy(true);
        createRequest(client, props.id, "resume", revision)
          .then(
            () => toast.push({ status: "success", title: "Resuming the send" }),
            (e) => toast.push({ status: "error", title: "Couldn't resume", description: errorText(e) }),
          )
          .finally(() => setBusy(false));
      },
    },
  };
};
ResumeSendingAction.displayName = "ResumeSendingAction";

/** Appended to the default actions (Publish, Duplicate, …) for `studioNewsletterIssue` only. */
export const newsletterActions: DocumentActionComponent[] = [
  SendTestAction,
  SendToSubscribersAction,
  ResumeSendingAction,
];
