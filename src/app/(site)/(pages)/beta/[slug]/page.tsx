import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetaForm } from "@/components/forms/BetaForm";
import { BetaHero, Button, CalloutBand, Container, FeatureList, Heading, MediaViewer, Section, Stack } from "@/components/ui";
import { betaSignupCopy } from "@/lib/games";
import { getGame, getGames } from "@/lib/sanity/content";
import type { Game } from "@/lib/sanity/types";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

/** A game with a tester page: its tester signup is on (open or closed). */
async function findGame(slug: string): Promise<(Game & { beta: NonNullable<Game["beta"]> }) | null> {
  const game = await getGame(slug);
  return game?.beta ? { ...game, beta: game.beta } : null;
}

export async function generateStaticParams() {
  // getGames has no tester settings; pages for games without one 404 on first visit.
  return (await getGames()).map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await findGame(slug);
  if (!game) return notFoundMetadata;
  return pageMetadata({
    title: `Become a ${game.name} beta tester — inkOrange Studios`,
    description: game.blurb || `Play ${game.name} before anyone else.`,
    path: `/beta/${game.slug}`,
    image: game.keyArt ?? game.coverArt,
  });
}

export default async function BetaPage({ params }: Props) {
  const { slug } = await params;
  const game = await findGame(slug);
  if (!game) notFound();

  const { beta } = game;
  const open = beta.state === "open";
  const platforms = open ? beta.platforms : [];
  const copy = betaSignupCopy(platforms);
  const only = platforms.length === 1 ? platforms[0] : null;
  const form = (tone: "on-dark" | "on-accent") =>
    open ? (
      <BetaForm
        game={game.slug}
        platforms={platforms}
        source="beta-page"
        tone={tone}
        layout="responsive"
        label={copy.label}
        placeholder={copy.placeholder}
        submitLabel="Become a tester"
        successMessage={`Thanks! ${copy.next}`}
      />
    ) : null;

  return (
    <>
      <Section space="tight">
        <Container>
          <BetaHero
            notice={open ? copy.notice : null}
            noticeIcon={only === "android" ? "android" : only === "ios" ? "apple" : undefined}
            eyebrow={game.slug === "terraforge" ? "NOW RECRUITING TESTERS" : "FROM THE MAKERS OF TERRAFORGE"}
            title={open ? (beta.title ?? `Play ${game.name} before anyone else.`) : (beta.title ?? "Testing is now closed.")}
            lead={open ? game.blurb || undefined : (beta.body ?? `Thanks to everyone who helped test ${game.name}.`)}
            action={
              open ? (
                form("on-dark")
              ) : (
                <Button variant="accent" size="l" href={`/games/${game.slug}`}>
                  {`See ${game.name}`}
                </Button>
              )
            }
            note={open ? copy.next : undefined}
            art={game.keyArt ?? game.coverArt}
            artLabel={`${game.name} key art`}
          />
        </Container>
      </Section>
      {game.media.length > 0 || game.features.length > 0 ? (
        <Section>
          <Container>
            <Stack gap={14}>
              {game.media.length > 0 ? <MediaViewer items={game.media} title={game.name} /> : null}
              {game.features.length > 0 ? (
                <Stack gap={6}>
                  <Heading as="h2" size="m">
                    {`Why play ${game.name}`}
                  </Heading>
                  <FeatureList items={game.features} />
                </Stack>
              ) : null}
              <Stack align="start">
                <Button variant="outline" href={`/games/${game.slug}`}>
                  {`More about ${game.name} →`}
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Section>
      ) : null}
      {open ? (
        <Section>
          <Container>
            <CalloutBand
              eyebrow="NOW RECRUITING TESTERS"
              paint
              title={`Help shape ${game.name}.`}
              body={beta.body ?? `Play it before launch and tell us what you think. ${copy.next}`}
              action={form("on-accent")}
            />
          </Container>
        </Section>
      ) : null}
    </>
  );
}
