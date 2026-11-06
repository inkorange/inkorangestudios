import { DesktopIcon } from "@sanity/icons/Desktop";
import { MobileDeviceIcon } from "@sanity/icons/MobileDevice";
import { Box, Button, Card, Flex, Inline, Spinner, Stack, Text } from "@sanity/ui";
import { useEffect, useState } from "react";
import { useClient, type SanityDocument } from "sanity";
import { publicEnv } from "@/lib/env-public";
import { renderIssue } from "@/lib/newsletter/email/render";
import { ISSUE_QUERY, SETTINGS_QUERY, resolveIssue } from "@/lib/newsletter/issue";
import { DeliveryStatus } from "./DeliveryStatus";
import { API_VERSION, publishedId, useDelivery } from "./useDelivery";

export const MAILING_ADDRESS_PLACEHOLDER = "(add your mailing address in Settings)";

/** Iframe widths: the email's 600px column with a margin, and a typical phone. */
const WIDTHS = { desktop: 640, phone: 390 } as const;
type Width = keyof typeof WIDTHS;

type Preview =
  | { state: "loading" }
  | { state: "ready"; html: string }
  | { state: "empty" }
  | { state: "error"; message: string };

type Props = {
  documentId: string;
  document: { draft: SanityDocument | null; published: SanityDocument | null };
};

/** The email HTML as a test send renders it, or null when the issue has nothing to render yet. */
export function renderPreview(raw: unknown, settings: { mailingAddress?: string | null } | null): string | null {
  const issue = resolveIssue(raw, {
    siteUrl: publicEnv.siteUrl,
    images: { projectId: publicEnv.sanityProjectId, dataset: publicEnv.sanityDataset },
  });
  if (!issue) return null;
  const mailingAddress = settings?.mailingAddress?.trim() || MAILING_ADDRESS_PLACEHOLDER;
  return renderIssue(issue, { siteUrl: publicEnv.siteUrl, mailingAddress, viewInBrowserUrl: null, unsubscribe: "note" }).html;
}

/** The "Email preview" document view: the issue (its draft if there is one) and the delivery status, live. */
export function EmailPreview({ documentId, document }: Props) {
  const client = useClient({ apiVersion: API_VERSION });
  const id = publishedId(documentId);
  const { delivery, loading } = useDelivery(id);
  const [width, setWidth] = useState<Width>("desktop");
  const [preview, setPreview] = useState<Preview>({ state: "loading" });
  // Refetch whenever the draft or published revision changes.
  const revision = document.draft?._rev ?? document.published?._rev ?? "";

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      client.fetch(ISSUE_QUERY, { id }, { perspective: "drafts" }),
      client.fetch(SETTINGS_QUERY, {}, { perspective: "published" }),
    ]).then(
      ([raw, settings]) => {
        if (cancelled) return;
        const html = renderPreview(raw, settings);
        setPreview(html ? { state: "ready", html } : { state: "empty" });
      },
      (e: unknown) => {
        if (!cancelled) setPreview({ state: "error", message: e instanceof Error ? e.message : "Couldn't load the issue." });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [client, id, revision]);

  return (
    <Flex direction="column" height="fill">
      <Stack gap={3} padding={3}>
        <DeliveryStatus delivery={delivery} loading={loading} />
        <Inline gap={2}>
          <Button
            icon={DesktopIcon}
            text="Desktop"
            mode={width === "desktop" ? "default" : "ghost"}
            selected={width === "desktop"}
            onClick={() => setWidth("desktop")}
          />
          <Button
            icon={MobileDeviceIcon}
            text="Phone"
            mode={width === "phone" ? "default" : "ghost"}
            selected={width === "phone"}
            onClick={() => setWidth("phone")}
          />
        </Inline>
      </Stack>
      <Card flex={1} tone="transparent" overflow="auto" borderTop>
        {preview.state === "ready" ? (
          <Flex justify="center" height="fill" padding={3}>
            <iframe
              title="Email preview"
              sandbox=""
              srcDoc={preview.html}
              width={WIDTHS[width]}
              frameBorder={0}
            />
          </Flex>
        ) : (
          <Box padding={4}>
            {preview.state === "loading" ? <Spinner muted /> : null}
            {preview.state === "empty" ? (
              <Text muted>Add a subject and at least one section to preview this issue.</Text>
            ) : null}
            {preview.state === "error" ? <Text muted>{preview.message}</Text> : null}
          </Box>
        )}
      </Card>
    </Flex>
  );
}
