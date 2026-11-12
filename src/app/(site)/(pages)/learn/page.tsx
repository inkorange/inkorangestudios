import type { Metadata } from "next";
import { Container, Grid, PageHero, Section, Stack, Text, ToolCard } from "@/components/ui";
import { getTools } from "@/lib/sanity/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Educational tools — inkOrange Studios",
  description: "Free interactive science tools for curious classrooms. They run in any browser, with no accounts and no cost.",
  path: "/learn",
});

export default async function Learn() {
  const tools = await getTools();

  return (
    <Section>
      <Container>
        <Stack gap={10}>
          <PageHero
            eyebrow="EDUCATIONAL TOOLS"
            title="Free tools for curious classrooms."
            intro="Interactive science tools that run in any browser. No accounts, no cost."
          />
          {tools.length > 0 ? (
            <Grid min="tool">
              {tools.map((tool) => (
                <ToolCard key={tool.name} tool={tool} headingLevel="h2" />
              ))}
            </Grid>
          ) : (
            <Text tone="ink-2">New tools are on the way. Check back soon.</Text>
          )}
        </Stack>
      </Container>
    </Section>
  );
}
