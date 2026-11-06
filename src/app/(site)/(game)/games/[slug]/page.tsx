import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetaForm } from "@/components/forms/BetaForm";
import { LaunchAlertForm } from "@/components/forms/LaunchAlertForm";
import { JsonLd } from "@/components/site/JsonLd";
import {
  Accordion,
  Button,
  CalloutBand,
  Container,
  FactList,
  FeatureList,
  FramedPhoto,
  GameLayout,
  GameTitle,
  Heading,
  InfoCard,
  MediaViewer,
  MoreGames,
  RichText,
  Section,
  SectionHeader,
  Stack,
  StoreCard,
  Text,
  UpdateRow,
} from "@/components/ui";
import { publicEnv } from "@/lib/env";
import { videoGameJsonLd } from "@/lib/jsonLd";
import { splitLead } from "@/lib/portableText";
import { getGame, getGames, getGameSlugs, getPosts } from "@/lib/sanity/content";
import type { Game } from "@/lib/sanity/types";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getGameSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return notFoundMetadata;
  return pageMetadata({
    title: `${game.name} — inkOrange Studios`,
    description: game.blurb || `${game.name}, a game by inkOrange Studios.`,
    path: `/games/${game.slug}`,
    image: game.keyArt,
  });
}

/** The beta tester band: the signup while testing is open, a closed notice once it ends. */
function BetaBand({ game }: { game: Game }) {
  const beta = game.beta;
  if (!beta) return null;
  if (beta.state === "open") {
    return (
      <CalloutBand
        eyebrow="NOW RECRUITING TESTERS"
        title={beta.title ?? `Play ${game.name} before anyone else.`}
        body={beta.body ?? "Join the beta and help shape the game before launch."}
        action={<BetaForm game={game.slug} platforms={beta.platforms} source="game-page" />}
      />
    );
  }
  const cta = game.primaryCta;
  return (
    <CalloutBand
      eyebrow="BETA TESTING"
      title={beta.title ?? "Testing is now closed."}
      body={beta.body ?? `Thanks to everyone who helped test ${game.name}. General release is open.`}
      action={
        cta ? (
          <Button variant="ink" size="l" href={cta.href} external={/^https?:/.test(cta.href)}>
            {cta.label}
          </Button>
        ) : undefined
      }
    />
  );
}

export default async function GamePage({ params }: Props) {
  const { slug } = await params;
  const [game, posts, games] = await Promise.all([getGame(slug), getPosts(2, slug), getGames()]);
  if (!game) notFound();

  const { lead, rest } = splitLead(game.description);
  const hasAbout = Boolean(lead) || rest.length > 0;
  // A trailer takes the key art's place under the title (the key art becomes its poster when it has none).
  const showKeyArt = !game.media.some((m) => m.kind === "trailer");
  const hasStore = Boolean(game.priceLabel || game.primaryCta || game.notify || game.facts.length > 0);
  const others = games.filter((other) => other.slug !== game.slug);

  return (
    <>
      <JsonLd data={videoGameJsonLd(game, publicEnv.siteUrl)} />
      <GameLayout
        title={
          <GameTitle
            name={game.name}
            status={game.status}
            tags={game.genres}
            platforms={game.platforms}
            crumbs={[{ label: "Games", href: "/#games" }, { label: game.name }]}
            lead={game.blurb || undefined}
          />
        }
        art={showKeyArt && game.keyArt ? <FramedPhoto photo={game.keyArt} label="Key art" natural priority /> : null}
        media={game.media.length > 0 ? <MediaViewer items={game.media} title={game.name} /> : null}
        store={
          hasStore ? (
            <StoreCard
              priceLabel={game.priceLabel ?? undefined}
              primary={game.primaryCta}
              notifyTitle={game.notify ? `${game.notify.platform} · coming soon` : undefined}
              notify={game.notify ? <LaunchAlertForm game={game.slug} platform={game.notify.platform} /> : undefined}
              facts={game.facts}
              phoneFacts={false}
            />
          ) : null
        }
        about={
          hasAbout ? (
            <Stack gap={4}>
              <Heading as="h2" size="m">
                About the game
              </Heading>
              {lead ? (
                <Text size="lead" weight="medium">
                  {lead}
                </Text>
              ) : null}
              {rest.length > 0 ? <RichText value={rest} /> : null}
            </Stack>
          ) : null
        }
        features={
          game.features.length > 0 ? (
            <Stack gap={6}>
              <Heading as="h2" size="m">
                Features
              </Heading>
              <FeatureList items={game.features} />
            </Stack>
          ) : null
        }
        details={
          game.facts.length > 0 ? (
            <Accordion title="Game details">
              <FactList items={game.facts} />
            </Accordion>
          ) : null
        }
        updates={
          posts.length > 0 ? (
            <>
              <SectionHeader
                title="Latest updates"
                rule={false}
                action={{ label: `All ${game.name} news →`, href: `/news?game=${encodeURIComponent(game.slug)}` }}
              />
              {posts.map((post) => (
                <UpdateRow key={post.slug} href={`/news/${post.slug}`} date={post.date} title={post.title} />
              ))}
            </>
          ) : null
        }
        beta={game.beta ? <BetaBand game={game} /> : null}
        cards={
          <>
            {game.pressKitUrl ? (
              <InfoCard
                title="Press kit"
                body="Logo, key art, screenshots, trailer and fact sheet."
                link={{ label: "Download →", href: game.pressKitUrl }}
                layout="auto"
              />
            ) : null}
            <InfoCard title="Need help?" body="Report a bug or send feedback." link={{ label: "Get support →", href: "/support" }} layout="auto" />
          </>
        }
        more={
          others.length > 0 ? (
            <Section tone="sand">
              <Container>
                <MoreGames games={others} />
              </Container>
            </Section>
          ) : null
        }
      />
    </>
  );
}
