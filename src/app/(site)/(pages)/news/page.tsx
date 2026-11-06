import type { Metadata } from "next";
import { Container, Grid, NewsCard, PillLinks, Section, SectionHeader, Text } from "@/components/ui";
import { getPosts } from "@/lib/sanity/content";
import { pageMetadata } from "@/lib/seo";
import type { PostSummary } from "@/lib/sanity/types";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "News — inkOrange Studios",
  description: "Updates, devlogs and patch notes from inkOrange Studios.",
  path: "/news",
});

type Props = { searchParams: Promise<{ game?: string | string[] }> };

const gameHref = (slug: string) => `/news?game=${encodeURIComponent(slug)}`;

/** Games that have posts, in the order their newest post appears. */
function gamesWithPosts(posts: PostSummary[]) {
  const seen = new Map<string, string>();
  for (const post of posts) if (post.game && !seen.has(post.game.slug)) seen.set(post.game.slug, post.game.name);
  return [...seen].map(([slug, name]) => ({ slug, name }));
}

export default async function News({ searchParams }: Props) {
  const [{ game }, posts] = await Promise.all([searchParams, getPosts()]);
  const games = gamesWithPosts(posts);
  // Only a single, known game filters; anything else (unknown slug, ?game=a&game=b) shows all.
  const selected = typeof game === "string" && games.some((g) => g.slug === game) ? game : null;
  const shown = selected ? posts.filter((post) => post.game?.slug === selected) : posts;

  return (
    <Section>
      <Container>
        <SectionHeader as="h1" title="News">
          {games.length > 0 ? (
            <PillLinks
              label="Filter news by game"
              items={[{ label: "All", href: "/news" }, ...games.map((g) => ({ label: g.name, href: gameHref(g.slug) }))]}
              current={selected ? gameHref(selected) : "/news"}
            />
          ) : null}
        </SectionHeader>
        {shown.length > 0 ? (
          <Grid min="card" gap={6}>
            {shown.map((post) => (
              <NewsCard key={post.slug} href={`/news/${post.slug}`} image={post.image} date={post.date} kind={post.kind} title={post.title} />
            ))}
          </Grid>
        ) : (
          <Text tone="ink-2">No news yet.</Text>
        )}
      </Container>
    </Section>
  );
}
