import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/ContactForm";
import { Container, FramedPhoto, Heading, PageHero, Section, Stack, Text, ValueList } from "@/components/ui";
import { getSettings } from "@/lib/sanity/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "About — inkOrange Studios",
  description: "inkOrange Studios is a small, independent game studio with a big backlog of ideas. Meet the studio and get in touch.",
  path: "/about",
});

const STORY =
  "Founded in New York in 2020 by design engineer Chris West, inkOrange Studios builds games that are easy to pick up and worth figuring out. Every title runs on SpaceUI, our own open-source design system.";

const VALUES = [
  { title: "Play first", body: "Fun in the first minute." },
  { title: "Smart, not stuffy", body: "Learn by experimenting." },
  { title: "Play anywhere", body: "Web, iOS and Android." },
];

export default async function About() {
  const settings = await getSettings();
  const photo = settings.studioPhoto;

  return (
    <>
      <Section>
        <Container>
          <Stack gap={10}>
            <PageHero eyebrow="THE STUDIO" title="A small studio with a big backlog of ideas." />
            <FramedPhoto photo={photo} label="Studio photo" />
            <Text size="lead" tone="ink-2">
              {STORY}
            </Text>
            <ValueList items={VALUES} />
          </Stack>
        </Container>
      </Section>

      <Section tone="sand" id="contact">
        <Container width="narrow">
          <Stack gap={6}>
            <Heading as="h2" size="l">
              Get in touch
            </Heading>
            <Text tone="ink-2">Questions, press, partnerships or just saying hi — we read everything.</Text>
            <ContactForm />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
