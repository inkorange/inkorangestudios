import type { Metadata } from "next";
import { BetaForm } from "@/components/forms/BetaForm";
import {
  CalloutBand,
  Container,
  Display,
  GameGrid,
  Highlight,
  NewsRail,
  Section,
  SectionHeader,
  ShowcaseHero,
  Statement,
  StudioTeaser,
} from "@/components/ui";
import { JsonLd } from "@/components/site/JsonLd";
import { publicEnv } from "@/lib/env";
import { siteJsonLd } from "@/lib/jsonLd";
import { getFeatured, getGames, getPosts, getSettings } from "@/lib/sanity/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({ title: "inkOrange Studios — Games that make you think", path: "/" });

const VALUES = [
  { title: "Play first", body: "Fun in the first minute." },
  { title: "Smart, not stuffy", body: "Learn by experimenting." },
  { title: "Play anywhere", body: "Web, iOS and Android." },
];

export default async function Home() {
  const [featured, games, posts, settings] = await Promise.all([getFeatured(), getGames(), getPosts(3), getSettings()]);
  const callout = settings.betaCallout;
  const beta = callout?.title && callout.game ? { ...callout, title: callout.title, game: callout.game } : null;

  return (
    <>
      <JsonLd data={siteJsonLd(publicEnv.siteUrl, settings)} />
      {featured.length > 0 ? (
        <Section space="none">
          <Container>
            <ShowcaseHero games={featured} />
          </Container>
        </Section>
      ) : null}

      <Section space="top">
        <Container>
          <Statement
            title={
              // Without featured games there is no hero, so the one-liner is the page's h1.
              <Display as={featured.length > 0 ? "h2" : "h1"} size="l">
                An independent studio making games that <Highlight paint>make you think.</Highlight>
              </Display>
            }
            body="Sandboxes, puzzlers, simulations and whatever we dream up next — for web, iOS and Android."
          />
        </Container>
      </Section>

      <Section id="games">
        <Container>
          <GameGrid games={games} />
        </Container>
      </Section>

      {beta ? (
        <Section id="beta" space="bottom">
          <Container>
            <CalloutBand
              eyebrow={beta.eyebrow}
              title={beta.title}
              body={beta.body}
              action={<BetaForm game={beta.game.slug} platforms={beta.platforms} />}
            />
          </Container>
        </Section>
      ) : null}

      <Section tone="sand" id="studio">
        <Container>
          <StudioTeaser
            photo={settings.studioPhoto}
            eyebrow="The studio"
            title="A small studio with a big backlog of ideas."
            body={settings.foundedLine}
            values={VALUES}
            action={{ label: "About the studio", href: "/about" }}
          />
        </Container>
      </Section>

      {posts.length > 0 ? (
        <Section id="news">
          <Container>
            <SectionHeader title="News" action={{ label: "All news →", href: "/news" }} />
            <NewsRail posts={posts} />
          </Container>
        </Section>
      ) : null}
    </>
  );
}
