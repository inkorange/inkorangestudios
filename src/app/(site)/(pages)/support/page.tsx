import type { Metadata } from "next";
import { Container, FaqList, Heading, InfoCard, LinkList, PageHero, Section, Stack, Text } from "@/components/ui";
import { getFaqs, getGames, getSettings } from "@/lib/sanity/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Support — inkOrange Studios",
  description: "Help with our games, and answers to common questions.",
};

export default async function Support() {
  const [faqs, games, settings] = await Promise.all([getFaqs(), getGames(), getSettings()]);

  return (
    <Section>
      <Container width="narrow">
        <Stack gap={10}>
          <PageHero title="Support" intro="Help with our games, and answers to common questions." />

          {faqs.length > 0 ? <FaqList items={faqs} /> : <Text tone="ink-2">FAQs are coming soon.</Text>}

          {games.length > 0 ? (
            <Stack gap={4}>
              <Heading as="h2" size="m">
                Game help
              </Heading>
              <LinkList label="Game help" items={games.map((g) => ({ label: g.name, href: `/games/${g.slug}` }))} />
            </Stack>
          ) : null}

          <InfoCard title="Still stuck?" body="Tell us what happened and we'll help." link={{ label: "Send us a message", href: "/about#contact" }} />

          {settings.supportEmail ? (
            <Text tone="ink-2">
              Or email <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>.
            </Text>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
