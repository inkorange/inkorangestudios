import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BetaForm } from "@/components/forms/BetaForm";
import {
  BetaHero,
  Button,
  Container,
  Display,
  FeatureList,
  Heading,
  MediaViewer,
  Section,
  Stack,
  Statement,
  ValueList,
} from "@/components/ui";
import { betaSignupCopy } from "@/lib/games";
import { getGame, getGames } from "@/lib/sanity/content";
import type { Game } from "@/lib/sanity/types";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

/** A game with a tester page: its tester signup is on (open or closed). */
async function findGame(
  slug: string,
): Promise<(Game & { beta: NonNullable<Game["beta"]> }) | null> {
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
  const form = open ? (
    <BetaForm
      game={game.slug}
      platforms={platforms}
      source="beta-page"
      tone="on-dark"
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
            noticeIcon={
              only === "android"
                ? "android"
                : only === "ios"
                  ? "apple"
                  : undefined
            }
            eyebrow={
              game.slug === "terraforge"
                ? "NOW RECRUITING TESTERS"
                : "FROM THE MAKERS OF TERRAFORGE"
            }
            title={
              open
                ? (beta.title ?? `Play ${game.name} before anyone else.`)
                : (beta.title ?? "Testing is now closed.")
            }
            lead={
              open
                ? game.blurb || undefined
                : (beta.body ??
                  `Thanks to everyone who helped test ${game.name}.`)
            }
            action={
              open ? (
                form
              ) : (
                <Button variant="accent" size="l" href={`/games/${game.slug}`}>
                  {`See ${game.name}`}
                </Button>
              )
            }
            perk={open ? beta.perk : null}
            note={open ? copy.next : undefined}
            art={game.keyArt ?? game.coverArt}
            artLabel={`${game.name} key art`}
          />
        </Container>
      </Section>
      {open && beta.why ? (
        <Section tone="sand" space="tight">
          <Container>
            <Stack gap={10}>
              <Statement
                title={<Display size="l">{beta.why.title}</Display>}
                body={beta.why.body ?? ""}
              />
              {beta.why.reasons.length > 0 ? (
                <ValueList items={beta.why.reasons} phone="stack" />
              ) : null}
            </Stack>
          </Container>
        </Section>
      ) : null}
      {game.media.length > 0 || game.features.length > 0 ? (
        <Section space="tight">
          <Container>
            <Stack gap={14}>
              {game.media.length > 0 ? (
                <MediaViewer items={game.media} title={game.name} />
              ) : null}
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
    </>
  );
}
