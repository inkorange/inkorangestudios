import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  Container,
  Display,
  Eyebrow,
  FramedPhoto,
  GameTile,
  Grid,
  RichText,
  Section,
  SectionHeader,
  Stack,
  Text,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getGames, getPost, getPosts } from "@/lib/sanity/content";
import { postKindLabel } from "@/lib/sanity/types";
import { JsonLd } from "@/components/site/JsonLd";
import { publicEnv } from "@/lib/env";
import { blogPostingJsonLd } from "@/lib/jsonLd";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPosts()).flatMap((post) => (post.format === "article" ? [{ slug: post.slug }] : []));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return notFoundMetadata;
  return pageMetadata({
    title: `${post.title} — inkOrange Studios`,
    description: post.excerpt ?? `${post.title}: news from inkOrange Studios.`,
    path: `/news/${post.slug}`,
    image: post.image,
    publishedTime: post.date,
  });
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [post, games] = await Promise.all([getPost(slug), getGames()]);
  if (!post) notFound();

  const game = post.game ? games.find((g) => g.slug === post.game?.slug) : undefined;

  return (
    <>
      <JsonLd data={blogPostingJsonLd(post, publicEnv.siteUrl)} />
      <Section space="top">
        <Container width="narrow">
          <Stack gap={8}>
            <Breadcrumb items={[{ label: "News", href: "/news" }, { label: post.title }]} />
            <Stack gap={4}>
              <Eyebrow>
                <time dateTime={post.date}>{formatDate(post.date)}</time> · {postKindLabel(post.kind)}
              </Eyebrow>
              <Display as="h1" size="m">
                {post.title}
              </Display>
            </Stack>
            {post.image ? <FramedPhoto photo={post.image} label="Cover art" /> : null}
            {post.body.length > 0 ? (
              <RichText value={post.body} />
            ) : post.excerpt ? (
              <Text size="lead" tone="ink-2">
                {post.excerpt}
              </Text>
            ) : null}
          </Stack>
        </Container>
      </Section>
      {game ? (
        <Section>
          <Container width="narrow">
            <SectionHeader title="The game" size="m" />
            <Grid min="tile-s">
              <GameTile
                name={game.name}
                href={`/games/${game.slug}`}
                cover={game.cover}
                status={game.status}
                meta={[game.genre, game.platformLabel].filter(Boolean).join(" · ")}
                size="s"
              />
            </Grid>
          </Container>
        </Section>
      ) : null}
    </>
  );
}
