import type { Metadata } from "next";
import { Button, Container, PageHero, Section, Stack } from "@/components/ui";
import { confirmSubscription } from "@/lib/newsletter/subscribers";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Confirm your subscription — inkOrange Studios",
  description: "Confirm your inkOrange Studios newsletter subscription.",
  path: "/newsletter/confirm",
  noindex: true,
});

const COPY = {
  confirmed: { title: "You're subscribed", intro: "Thanks for confirming. Studio notes will land in your inbox." },
  expired: { title: "Link expired", intro: "This link has expired. Sign up again in the footer." },
  invalid: { title: "Link not valid", intro: "This link isn't valid." },
} as const;

export default async function NewsletterConfirm({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const outcome = await confirmSubscription(token);
  const { title, intro } = COPY[outcome];

  return (
    <Section>
      <Container width="narrow">
        <Stack gap={8}>
          <PageHero title={title} intro={intro} />
          <Button variant="accent" href="/">
            Back to the home page
          </Button>
        </Stack>
      </Container>
    </Section>
  );
}
