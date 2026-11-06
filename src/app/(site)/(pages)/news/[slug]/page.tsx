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

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = `${post.title} — inkOrange Studios`;
  const description = post.excerpt ?? undefined;
  const image = post.image;
  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.date,
      ...(image ? { images: [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] } : {}),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [post, games] = await Promise.all([getPost(slug), getGames()]);
  if (!post) notFound();

  const game = post.game ? games.find((g) => g.slug === post.game?.slug) : undefined;

  return (
    <>
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
