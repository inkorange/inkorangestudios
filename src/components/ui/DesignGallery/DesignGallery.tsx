"use client";

import { useState, type ReactNode } from "react";
import { openConsent } from "@/lib/consent";
import type { FormState } from "@/lib/signups/types";
import type { Faq, Featured, GameSummary, Media, PortableTextBlock, PostSummary } from "@/lib/sanity/types";
import tokenFile from "@/styles/tokens.json";
import { Accordion } from "../Accordion/Accordion";
import { BetaHero } from "../BetaHero/BetaHero";
import { Breadcrumb } from "../Breadcrumb/Breadcrumb";
import { Button } from "../Button/Button";
import { CalloutBand } from "../CalloutBand/CalloutBand";
import { Chip } from "../Chip/Chip";
import { ConsentBanner } from "../ConsentBanner/ConsentBanner";
import { Container } from "../Container/Container";
import { Display, Highlight } from "../Display/Display";
import { EmailSignupForm } from "../EmailSignupForm/EmailSignupForm";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import { FactList } from "../FactList/FactList";
import { FaqList } from "../FaqList/FaqList";
import { FeatureList } from "../FeatureList/FeatureList";
import { FilterPills } from "../FilterPills/FilterPills";
import { FormMessage } from "../FormMessage/FormMessage";
import { FramedPhoto } from "../FramedPhoto/FramedPhoto";
import { GameGrid } from "../GameGrid/GameGrid";
import { GameLayout } from "../GameLayout/GameLayout";
import { GameTile } from "../GameTile/GameTile";
import { GameTitle } from "../GameTitle/GameTitle";
import { Grid } from "../Grid/Grid";
import { GuideLines } from "../GuideLines/GuideLines";
import { Heading } from "../Heading/Heading";
import { Honeypot } from "../Honeypot/Honeypot";
import { Icon, type IconName, type IconSize } from "../Icon/Icon";
import { IconButton } from "../IconButton/IconButton";
import { InfoCard } from "../InfoCard/InfoCard";
import { LegalEmpty } from "../LegalEmpty/LegalEmpty";
import { LinkList } from "../LinkList/LinkList";
import { Logo } from "../Logo/Logo";
import { MediaViewer } from "../MediaViewer/MediaViewer";
import { MoreGames } from "../MoreGames/MoreGames";
import { NavPillBar } from "../NavPillBar/NavPillBar";
import { NewsCard } from "../NewsCard/NewsCard";
import { ToolCard } from "../ToolCard/ToolCard";
import { NewsRail } from "../NewsRail/NewsRail";
import { NotFoundMessage } from "../NotFoundMessage/NotFoundMessage";
import { PageHero } from "../PageHero/PageHero";
import { PillLinks } from "../PillLinks/PillLinks";
import { Placeholder } from "../Placeholder/Placeholder";
import { Prose } from "../Prose/Prose";
import { RichText } from "../RichText/RichText";
import { Section } from "../Section/Section";
import { SectionHeader } from "../SectionHeader/SectionHeader";
import { Select } from "../Select/Select";
import { ShowcaseHero } from "../ShowcaseHero/ShowcaseHero";
import { SiteFooter } from "../SiteFooter/SiteFooter";
import { SiteHeader } from "../SiteHeader/SiteHeader";
import { SpotlightRail } from "../SpotlightRail/SpotlightRail";
import { Stack } from "../Stack/Stack";
import { Statement } from "../Statement/Statement";
import { StickyPlayBar } from "../StickyPlayBar/StickyPlayBar";
import { StoreBadges } from "../StoreBadges/StoreBadges";
import { StoreCard } from "../StoreCard/StoreCard";
import { StudioTeaser } from "../StudioTeaser/StudioTeaser";
import { Text } from "../Text/Text";
import { TextArea } from "../TextArea/TextArea";
import { TextField } from "../TextField/TextField";
import { Turnstile } from "../Turnstile/Turnstile";
import { UpdateRow } from "../UpdateRow/UpdateRow";
import { ValueList } from "../ValueList/ValueList";
import styles from "./DesignGallery.module.scss";

// ---------------------------------------------------------------------------------------------
// Tokens (src/styles/tokens.json, generated from tokens.scss by scripts/tokens-json.mjs)

type Token = (typeof tokenFile.tokens)[number];
const TOKENS: readonly Token[] = tokenFile.tokens;

const TYPE_GROUPS = ["font", "text", "weight", "leading", "tracking"];
const NAMED_GROUPS = ["color", "texture", ...TYPE_GROUPS, "space", "radius", "duration", "ease", "z"];

const inGroups = (...groups: string[]) => TOKENS.filter((t) => groups.includes(t.group));
/** Layout widths, component sizes and anything else without a dedicated table. */
const otherTokens = () => TOKENS.filter((t) => !NAMED_GROUPS.includes(t.group));

/** "fluid(68, 112)" -> "68 → 112px"; anything else is shown as compiled. */
function displayValue(token: Token): string {
  const fluid = token.source.match(/^fluid\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\)$/);
  return fluid ? `${fluid[1]} → ${fluid[2]}px` : token.value;
}

function TokenLabel({ token }: { token: Token }) {
  return (
    <span className={styles.label}>
      <code className={styles.name}>{token.name}</code>
      <code className={styles.value} title={token.value}>
        {displayValue(token)}
      </code>
    </span>
  );
}

function Swatches({ tokens }: { tokens: readonly Token[] }) {
  return (
    <ul className={styles.swatches} role="list">
      {tokens.map((t) => (
        <li key={t.name} className={styles.swatch} data-token={t.name}>
          <span
            className={styles.chip}
            data-kind={t.group === "texture" ? "image" : "color"}
            style={{ "--sample": `var(${t.name})` }}
            aria-hidden="true"
          />
          <TokenLabel token={t} />
        </li>
      ))}
    </ul>
  );
}

type SampleKind = "font" | "size" | "weight" | "leading" | "tracking" | "space" | "radius" | "motion" | "plain";

const SAMPLE_TEXT = "Games that make you think.";

function sampleFor(t: Token, kind: SampleKind): ReactNode {
  switch (kind) {
    case "font":
    case "size":
    case "weight":
    case "leading":
    case "tracking":
      return (
        <span className={styles.type} data-kind={kind} style={{ "--sample": `var(${t.name})` }}>
          {kind === "leading" ? `${SAMPLE_TEXT} ${SAMPLE_TEXT}` : SAMPLE_TEXT}
        </span>
      );
    case "space":
      return <span className={styles.bar} style={{ "--sample": `var(${t.name})` }} aria-hidden="true" />;
    case "radius":
      return <span className={styles.corner} style={{ "--sample": `var(${t.name})` }} aria-hidden="true" />;
    case "motion":
      return (
        <span className={styles.track} data-kind={t.group} style={{ "--sample": `var(${t.name})` }} aria-hidden="true">
          <span className={styles.dot} />
        </span>
      );
    default:
      return null;
  }
}

function TokenRows({ tokens, kind }: { tokens: readonly Token[]; kind: (t: Token) => SampleKind }) {
  return (
    <ul className={styles.rows} role="list">
      {tokens.map((t) => {
        const sample = sampleFor(t, kind(t));
        return (
          <li key={t.name} className={styles.row} data-token={t.name} data-motion={kind(t) === "motion" || undefined}>
            <TokenLabel token={t} />
            {sample ? <span className={styles.sample}>{sample}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

const typeKind = (t: Token): SampleKind =>
  t.group === "font" ? "font" : t.group === "text" ? "size" : (t.group as SampleKind);

// ---------------------------------------------------------------------------------------------
// Sample content

const block = (key: string, text: string, style = "normal"): PortableTextBlock =>
  ({ _type: "block", _key: key, style, markDefs: [], children: [{ _type: "span", _key: `${key}s`, text, marks: [] }] }) as PortableTextBlock;

const RICH: PortableTextBlock[] = [
  block("h", "A heading inside rich text", "h2"),
  block("p", "Body copy from the CMS uses the long-form leading, so posts and legal pages read comfortably."),
  {
    _type: "block",
    _key: "l",
    style: "normal",
    markDefs: [{ _type: "link", _key: "m", href: "/news" }],
    children: [
      { _type: "span", _key: "l1", text: "Links like ", marks: [] },
      { _type: "span", _key: "l2", text: "all the news", marks: ["m"] },
      { _type: "span", _key: "l3", text: " are underlined in the link color.", marks: [] },
    ],
  } as PortableTextBlock,
  { ...block("b1", "Bullet one"), listItem: "bullet", level: 1 } as PortableTextBlock,
  { ...block("b2", "Bullet two"), listItem: "bullet", level: 1 } as PortableTextBlock,
  block("q", "A quote from a playtester.", "blockquote"),
];

const GAMES: GameSummary[] = [
  { slug: "terraforge", name: "TerraForge", status: "out-now", genre: "Sandbox", platformLabel: "Web", cover: null, stores: [] },
  { slug: "space-cowboy", name: "Space Cowboy", status: "coming-soon", genre: "Arcade", platformLabel: "iOS · Android", cover: null, stores: [] },
  { slug: "tiny-tides", name: "Tiny Tides", status: "in-development", genre: "Puzzle", platformLabel: "Web", cover: null, stores: [] },
  { slug: "secret", name: "Untitled", status: "announcing-soon", genre: "", platformLabel: "", cover: null, stores: [] },
];

const FEATURED: Featured[] = [
  {
    slug: "terraforge",
    name: "TerraForge",
    status: "out-now",
    genre: "Sandbox",
    platformLabel: "Web",
    blurb: "Shape a living planet one brush stroke at a time.",
    art: null, icon: null,
    cta: { label: "Play free in browser", href: "/design" },
    detailHref: "/design",
  },
  {
    slug: "space-cowboy",
    name: "Space Cowboy",
    status: "coming-soon",
    genre: "Arcade",
    platformLabel: "iOS · Android",
    blurb: "Rope asteroids, herd comets, keep the ranch alive.",
    art: null, icon: null,
    cta: { label: "Join the beta", href: "/design" },
    detailHref: "/design",
  },
];

const POSTS: PostSummary[] = [
  { format: "article", slug: "a", title: "New terrain tools land in TerraForge", date: "2026-11-05", kind: "patch-notes", excerpt: null, image: null, game: null },
  {
    format: "link",
    id: "b",
    url: "https://example.com/inkorange",
    source: "Example Gazette",
    title: "The two-person studio teaching kids to build planets",
    date: "2026-10-21",
    kind: "update",
    excerpt: null,
    image: null,
    game: null,
  },
  { format: "article", slug: "c", title: "Space Cowboy beta sign-ups are open", date: "2026-10-02", kind: "announcement", excerpt: null, image: null, game: null },
];

const FACTS = [
  { label: "Platform", value: "Web" },
  { label: "Genre", value: "Sandbox" },
  { label: "Price", value: "Free" },
];

const FEATURES = [
  { title: "Paint the planet", body: "Raise mountains and carve rivers with one brush." },
  { title: "Watch it live", body: "Weather and wildlife react to every change." },
];

const VALUES = [
  { title: "Play first", body: "Fun in the first minute." },
  { title: "Smart, not stuffy", body: "Learn by experimenting." },
  { title: "Play anywhere", body: "Web, iOS and Android." },
];

const MEDIA: Media[] = [
  { kind: "trailer", label: "Trailer", poster: null, url: "https://vimeo.com/000000000", duration: "1:30" },
  { kind: "image", label: "Screenshot 1", image: null },
  { kind: "image", label: "Screenshot 2", image: null },
];

const FAQS: Faq[] = [
  { id: "1", question: "Is TerraForge free?", answer: [block("a1", "Yes, it plays free in your browser.")], game: { slug: "terraforge", name: "TerraForge" } },
  { id: "2", question: "How do I report a bug?", answer: [block("a2", "Use the form on the Support page.")], game: null },
];

const ICONS: IconName[] = ["chevron-left", "chevron-right", "play", "globe", "phone", "menu", "close", "arrow-right"];
const ICON_SIZES: IconSize[] = [16, 18, 20, 26, 34];

async function demoAction(): Promise<FormState> {
  return { status: "ok" };
}

// ---------------------------------------------------------------------------------------------
// Layout helpers

type Tone = "paper" | "card" | "sand" | "ink" | "accent";

function Frame({ tone = "paper", label, children }: { tone?: Tone; label?: string; children: ReactNode }) {
  return (
    <div className={styles.frame} data-tone={tone}>
      {label ? <p className={styles.caption}>{label}</p> : null}
      {children}
    </div>
  );
}

function Box({ children }: { children: ReactNode }) {
  return <div className={styles.box}>{children}</div>;
}

function FilterPillsDemo() {
  const options = ["All", "Out now", "Coming soon"] as const;
  const [value, setValue] = useState<(typeof options)[number]>("All");
  return <FilterPills options={options} value={value} onChange={setValue} label="Filter games" />;
}

function SpotlightRailDemo() {
  const [active, setActive] = useState(0);
  return <SpotlightRail games={FEATURED} activeIndex={active} onPick={setActive} />;
}

// ---------------------------------------------------------------------------------------------
// Components, one entry per folder in src/components/ui (the test enforces it).

type Entry = { name: string; note?: string; render: () => ReactNode };

const COMPONENTS: Entry[] = [
  {
    name: "Accordion",
    render: () => (
      <Stack gap={3}>
        <Accordion title="Game details">
          <FactList items={FACTS} />
        </Accordion>
        <Accordion title="Open by default" defaultOpen>
          <Text>Native details and summary.</Text>
        </Accordion>
      </Stack>
    ),
  },
  { name: "Breadcrumb", render: () => <Breadcrumb items={[{ label: "Games", href: "/design" }, { label: "TerraForge" }]} /> },
  {
    name: "Button",
    render: () => (
      <Stack gap={4}>
        <Stack direction="row" gap={3} wrap align="center">
          <Button variant="accent">Accent</Button>
          <Button variant="ink">Ink</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="accent" icon="play">
            With icon
          </Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
        </Stack>
        <Stack direction="row" gap={3} wrap align="center">
          <Button variant="ink" size="s">
            Size s
          </Button>
          <Button variant="ink">Size m</Button>
          <Button variant="ink" size="l">
            Size l
          </Button>
          <Button variant="outline" href="/design">
            Link
          </Button>
        </Stack>
        <Frame tone="ink" label="On ink">
          <Stack direction="row" gap={3} wrap>
            <Button variant="accent">Accent</Button>
            <Button variant="outline-on-dark">Outline on dark</Button>
          </Stack>
        </Frame>
        <Frame tone="accent" label="On accent">
          <Stack direction="row" gap={3} wrap>
            <Button variant="ink">Ink</Button>
            <Button variant="on-light">On light</Button>
          </Stack>
        </Frame>
        <Button variant="accent" block>
          Block
        </Button>
      </Stack>
    ),
  },
  {
    name: "BetaHero",
    note: "The tester page's top: notice, then the dark pitch card. Shown with no art (dark placeholder). Renders its own h1.",
    render: () => (
      <BetaHero
        notice="Android only for now. Sign up with the Google account you use for the Play Store on your Android phone."
        noticeIcon="android"
        eyebrow="From the makers of TerraForge"
        title="Play Space Cowboy before anyone else."
        lead="A story-driven puzzle game: plan the perfect shot, slingshot around obstacles and hit the target."
        perk="Testers get the full game free."
        action={
          <EmailSignupForm
            action={demoAction}
            label="Your Google Play email"
            placeholder="you@gmail.com"
            submitLabel="Become a tester"
            tone="on-dark"
            successMessage="Thanks!"
          />
        }
        note="We'll add you to the test and email you a link to install it from Google Play."
        art={null}
        artLabel="Space Cowboy key art"
      />
    ),
  },
  {
    name: "CalloutBand",
    render: () => (
      <Stack gap={4}>
        <CalloutBand
          eyebrow="Now recruiting testers"
          title="Play Space Cowboy before anyone else."
          body="Join the beta and help shape the game."
          action={<Button variant="ink">Join the beta</Button>}
          paint
        />
        <CalloutBand title="Without eyebrow, body or paint." action={<Button variant="on-light">Action</Button>} />
      </Stack>
    ),
  },
  {
    name: "Chip",
    render: () => (
      <Stack gap={4}>
        <Stack direction="row" gap={2} wrap>
          <Chip tone="accent">Out now</Chip>
          <Chip tone="ink">Coming soon</Chip>
          <Chip tone="outline">Sandbox</Chip>
          <Chip tone="accent" size="s">
            Size s
          </Chip>
        </Stack>
        <Frame tone="ink" label="On ink">
          <Stack direction="row" gap={2} wrap>
            <Chip tone="outline-on-dark">Outline on dark</Chip>
            <Chip tone="plain-on-dark">Plain on dark</Chip>
          </Stack>
        </Frame>
      </Stack>
    ),
  },
  {
    name: "ConsentBanner",
    note: "Fixed to the bottom of the viewport; shown until a choice is stored.",
    render: () => (
      <>
        <Button variant="outline" onClick={openConsent}>
          Show the consent banner
        </Button>
        <ConsentBanner />
      </>
    ),
  },
  {
    name: "Container",
    render: () => (
      <Stack gap={3}>
        <Container>
          <Box>width content: --content-max</Box>
        </Container>
        <Container width="narrow">
          <Box>width narrow: --content-narrow</Box>
        </Container>
      </Stack>
    ),
  },
  {
    name: "Display",
    render: () => (
      <Stack gap={6}>
        <Display size="hero">Hero</Display>
        <Display size="xl">Display xl</Display>
        <Display size="l">
          Display l with <Highlight paint>painted highlight</Highlight>
        </Display>
        <Display size="m">
          Display m with <Highlight>flat highlight</Highlight>
        </Display>
        <Frame tone="ink" label="On ink">
          <Display size="m" tone="on-dark">
            On dark
          </Display>
        </Frame>
      </Stack>
    ),
  },
  {
    name: "EmailSignupForm",
    note: "Submits to a demo action that always succeeds.",
    render: () => (
      <Stack gap={4}>
        <Frame tone="ink" label="tone on-dark">
          <EmailSignupForm action={demoAction} label="Email" placeholder="you@example.com" submitLabel="Subscribe" tone="on-dark" successMessage="Thanks! You're on the list." />
        </Frame>
        <Frame tone="card" label="tone on-card, stacked">
          <EmailSignupForm
            action={demoAction}
            label="Email"
            placeholder="you@example.com"
            submitLabel="Notify me"
            tone="on-card"
            layout="stacked"
            successMessage="We'll email you at launch."
          />
        </Frame>
        <Frame tone="accent" label="tone on-accent, with extra fields">
          <EmailSignupForm
            action={demoAction}
            label="Email"
            placeholder="you@example.com"
            submitLabel="Join the beta"
            tone="on-accent"
            successMessage="You're in."
            extraFields={<Select label="Platform" hideLabel name="platform" tone="on-accent" options={[{ value: "ios", label: "iOS" }, { value: "android", label: "Android" }]} />}
          />
        </Frame>
      </Stack>
    ),
  },
  {
    name: "Eyebrow",
    render: () => (
      <Stack gap={3}>
        <Eyebrow>ink-3 (default)</Eyebrow>
        <Eyebrow tone="link">The studio</Eyebrow>
        <Frame tone="ink">
          <Eyebrow tone="on-dark-4">on-dark-4</Eyebrow>
        </Frame>
        <Frame tone="accent">
          <Eyebrow tone="on-accent">on-accent</Eyebrow>
        </Frame>
      </Stack>
    ),
  },
  { name: "FactList", render: () => <FactList items={FACTS} /> },
  { name: "FaqList", note: "Grouped by game once any question has one.", render: () => <FaqList items={FAQS} /> },
  { name: "FeatureList", render: () => <FeatureList items={FEATURES} /> },
  { name: "FilterPills", render: () => <FilterPillsDemo /> },
  {
    name: "FormMessage",
    render: () => (
      <Stack gap={3}>
        <FormMessage status="success">Thanks! You&apos;re on the list.</FormMessage>
        <FormMessage status="error">Something went wrong. Try again.</FormMessage>
      </Stack>
    ),
  },
  { name: "FramedPhoto", render: () => <FramedPhoto photo={null} label="Studio photo" /> },
  { name: "GameGrid", render: () => <GameGrid games={GAMES} /> },
  {
    name: "GameLayout",
    note: "Slots filled with placeholders; see a real game page for the full composition.",
    render: () => (
      <GameLayout
        title={<Heading as="h3" size="m">title slot</Heading>}
        media={<Placeholder tone="dark" ratio="16/7.5" radius="3xl" label="media slot" />}
        store={<Box>store slot</Box>}
        about={<Box>about slot</Box>}
        features={<Box>features slot</Box>}
        details={<Box>details slot (phone only)</Box>}
        updates={<Box>updates slot</Box>}
        cards={<Box>cards slot</Box>}
      />
    ),
  },
  {
    name: "GameTile",
    render: () => (
      <Grid min="tile-s">
        <GameTile name="TerraForge" href="/design" cover={null} status="out-now" meta="Sandbox · Web" />
        <GameTile name="Space Cowboy" href="/design" cover={null} status="coming-soon" meta="Arcade · iOS" />
        <GameTile name="Tiny Tides" href="/design" cover={null} status="in-development" meta="Puzzle · Web" size="s" />
      </Grid>
    ),
  },
  {
    name: "GameTitle",
    render: () => (
      <GameTitle
        name="TerraForge"
        status="out-now"
        tags={["Sandbox", "Web"]}
        crumbs={[{ label: "Games", href: "/design" }, { label: "TerraForge" }]}
        lead="Shape a living planet one brush stroke at a time."
      />
    ),
  },
  {
    name: "Grid",
    render: () => (
      <Grid min="thumb" gap={3}>
        {["1", "2", "3", "4", "5", "6"].map((n) => (
          <Placeholder key={n} ratio="1/1" label={`min thumb ${n}`} />
        ))}
      </Grid>
    ),
  },
  {
    name: "GuideLines",
    render: () => (
      <GuideLines>
        <div className={styles.guides}>
          <Text tone="ink-2">Construction lines sit behind their children.</Text>
        </div>
      </GuideLines>
    ),
  },
  {
    name: "Heading",
    render: () => (
      <Stack gap={3}>
        <Heading as="h3" size="l">
          Heading l
        </Heading>
        <Heading as="h3" size="m">
          Heading m
        </Heading>
        <Heading as="h3" size="s">
          Heading s
        </Heading>
        <Heading as="h3" size="title">
          Title
        </Heading>
        <Heading as="h3" size="title-s">
          Title s
        </Heading>
      </Stack>
    ),
  },
  {
    name: "Honeypot",
    note: "Invisible by design: a visually hidden, aria-hidden spam-trap input is rendered below.",
    render: () => <Honeypot />,
  },
  {
    name: "Icon",
    render: () => (
      <Stack gap={4}>
        <Stack direction="row" gap={4} wrap align="center">
          {ICONS.map((name) => (
            <span key={name} className={styles.cell}>
              <Icon name={name} size={26} />
              <code className={styles.value}>{name}</code>
            </span>
          ))}
        </Stack>
        <Stack direction="row" gap={4} align="end">
          {ICON_SIZES.map((size) => (
            <span key={size} className={styles.cell}>
              <Icon name="play" size={size} />
              <code className={styles.value}>{size}</code>
            </span>
          ))}
        </Stack>
      </Stack>
    ),
  },
  {
    name: "IconButton",
    render: () => (
      <Stack direction="row" gap={4} wrap align="center">
        <IconButton icon="chevron-left" label="Previous" />
        <IconButton icon="chevron-right" label="Next" size="l" />
        <Frame tone="ink">
          <Stack direction="row" gap={3}>
            <IconButton icon="chevron-left" label="Previous on dark" tone="dark" />
            <IconButton icon="menu" label="Open menu" tone="dark" />
          </Stack>
        </Frame>
      </Stack>
    ),
  },
  {
    name: "InfoCard",
    render: () => (
      <Grid min="card">
        <InfoCard title="Press kit" body="Logo, key art, screenshots and fact sheet." link={{ label: "Download →", href: "/design" }} />
        <InfoCard title="Need help?" body="Report a bug or send feedback." link={{ label: "Get support →", href: "/design" }} layout="row" />
      </Grid>
    ),
  },
  { name: "LegalEmpty", note: "Renders its own h1 and narrow section.", render: () => <LegalEmpty title="Privacy policy" /> },
  {
    name: "LinkList",
    render: () => (
      <LinkList
        label="Game help"
        items={[
          { label: "TerraForge help", href: "/design?help=terraforge" },
          { label: "Space Cowboy help", href: "/design?help=space-cowboy" },
        ]}
      />
    ),
  },
  {
    name: "Logo",
    render: () => (
      <Stack gap={4}>
        <Stack direction="row" gap={8} wrap align="end">
          <Logo size="s" />
          <Logo />
          <Logo size="l" href="/design" />
        </Stack>
        <Logo animate />
        <Frame tone="ink" label="On ink">
          <Logo />
        </Frame>
      </Stack>
    ),
  },
  { name: "MediaViewer", note: "Missing art shows the dark placeholder; nothing plays until pressed.", render: () => <MediaViewer items={MEDIA} title="TerraForge" /> },
  { name: "MoreGames", render: () => <MoreGames games={GAMES.slice(1)} action={{ label: "All games →", href: "/design" }} /> },
  {
    name: "NavPillBar",
    render: () => (
      <Stack gap={3}>
        <NavPillBar active="games" />
        <NavPillBar active="news" current="true" />
      </Stack>
    ),
  },
  {
    name: "NewsCard",
    render: () => (
      <Grid min="card" gap={6}>
        <NewsCard href="/design" image={null} date="2026-11-05" kind="update" title="An update headline" />
        <NewsCard href="/design" image={null} date="2026-10-21" kind="devlog" title="A devlog headline that runs a little longer" />
        <NewsCard href="https://example.com/inkorange" image={null} date="2026-10-14" kind="update" title="An article about us on another site" source="Example Gazette" />
      </Grid>
    ),
  },
  { name: "NewsRail", render: () => <NewsRail posts={POSTS} /> },
  {
    name: "ToolCard",
    note: "Out now with one extra link, and in development (status chip only, no button). Tools open in a new tab.",
    render: () => (
      <Grid min="tool" gap={6}>
        <ToolCard
          tool={{
            name: "A science tool",
            status: "out-now",
            summary: "One or two sentences on what it teaches and how.",
            url: "https://example.com",
            image: null,
            links: [{ label: "Read: how it was built", href: "https://example.com/article" }],
          }}
        />
        <ToolCard tool={{ name: "A tool on the way", status: "in-development", summary: "Still being built: no button yet.", url: null, image: null, links: [] }} />
      </Grid>
    ),
  },
  { name: "NotFoundMessage", note: "With logo, as on the 404 outside the site shell. Renders its own h1.", render: () => <NotFoundMessage logo /> },
  { name: "PageHero", render: () => <PageHero eyebrow="Support" title="How can we help?" intro="Answers to common questions, and a way to reach us." /> },
  {
    name: "PillLinks",
    note: "Filter pills as links (the news filter); the current pill has aria-current.",
    render: () => (
      <PillLinks
        label="Filter news by game"
        items={[
          { label: "All", href: "/design" },
          { label: "TerraForge", href: "/design?game=terraforge" },
          { label: "Space Cowboy", href: "/design?game=space-cowboy" },
        ]}
        current="/design"
      />
    ),
  },
  {
    name: "Placeholder",
    render: () => (
      <Grid min="thumb" gap={3}>
        <Placeholder ratio="3/4" label="3/4" />
        <Placeholder ratio="16/9" label="16/9" radius="xl" />
        <Placeholder ratio="16/10" label="16/10" radius="2xl" />
        <Placeholder ratio="1/1" label="1/1" radius="none" />
        <Placeholder ratio="16/7.5" tone="dark" label="dark 16/7.5" radius="3xl" />
      </Grid>
    ),
  },
  {
    name: "Prose",
    render: () => <Prose title="Terms of use" meta="Last updated Nov 5, 2026" body={[block("pr", "Long-form body copy in the narrow column.")]} />,
  },
  { name: "RichText", render: () => <RichText value={RICH} /> },
  {
    name: "Section",
    render: () => (
      <Stack gap={2}>
        <Section space="tight">
          <Container>
            <Text>tone paper, space tight</Text>
          </Container>
        </Section>
        <Section tone="sand" space="tight">
          <Container>
            <Text>tone sand</Text>
          </Container>
        </Section>
        <Section tone="ink" space="tight">
          <Container>
            <Text>tone ink</Text>
          </Container>
        </Section>
      </Stack>
    ),
  },
  {
    name: "SectionHeader",
    render: () => (
      <Stack gap={8}>
        <SectionHeader title="News" action={{ label: "All news →", href: "/design" }} />
        <SectionHeader title="All games" size="m">
          <FilterPillsDemo />
        </SectionHeader>
        <SectionHeader title="No rule" size="m" rule={false} />
      </Stack>
    ),
  },
  {
    name: "Select",
    render: () => (
      <Grid min="card">
        <Select label="Topic" name="topic" options={[{ value: "bug", label: "Bug report" }, { value: "idea", label: "Idea" }]} />
        <Frame tone="card">
          <Select label="On card" name="card" tone="on-card" options={[{ value: "a", label: "Option" }]} />
        </Frame>
        <Frame tone="ink">
          <Select label="On dark" name="dark" tone="on-dark" options={[{ value: "a", label: "Option" }]} />
        </Frame>
      </Grid>
    ),
  },
  { name: "ShowcaseHero", note: "Owns an h1 (the active game's name). Never auto-advances.", render: () => <ShowcaseHero games={FEATURED} /> },
  {
    name: "SiteFooter",
    render: () => (
      <Stack gap={4}>
        <SiteFooter
          newsletter={<EmailSignupForm action={demoAction} label="Email" placeholder="you@example.com" submitLabel="Subscribe" tone="on-dark" successMessage="Thanks!" />}
          socialLinks={[{ label: "YouTube", href: "https://youtube.com" }]}
          supportEmail="support@example.com"
        />
        <SiteFooter variant="compact" newsletter={null} socialLinks={[]} />
      </Stack>
    ),
  },
  {
    name: "SiteHeader",
    render: () => (
      <Stack gap={4}>
        <SiteHeader active="games" />
        <SiteHeader variant="game" active="games" />
      </Stack>
    ),
  },
  { name: "SpotlightRail", note: "Desktop only (hidden below lg).", render: () => <SpotlightRailDemo /> },
  {
    name: "Stack",
    render: () => (
      <Stack gap={4}>
        <Stack direction="row" gap={2}>
          <Box>row</Box>
          <Box>gap 2</Box>
        </Stack>
        <Stack gap={1}>
          <Box>column</Box>
          <Box>gap 1</Box>
        </Stack>
      </Stack>
    ),
  },
  {
    name: "Statement",
    render: () => (
      <Statement
        title={
          <Display size="l">
            An independent studio making games that <Highlight>make you think.</Highlight>
          </Display>
        }
        body="Sandboxes, puzzlers, simulations and whatever we dream up next."
      />
    ),
  },
  {
    name: "StickyPlayBar",
    note: "Phone only: hidden from lg. Narrow the window to see it.",
    render: () => <StickyPlayBar title="TerraForge" meta="Free · Web" action={{ label: "Play now", href: "/design" }} />,
  },
  {
    name: "StoreBadges",
    render: () => (
      <StoreBadges
        label="App stores"
        stores={[
          { platform: "Android", href: "https://play.google.com/store" },
          { platform: "iOS", href: "https://apps.apple.com" },
        ]}
      />
    ),
  },
  {
    name: "StoreCard",
    render: () => (
      <div className={styles.narrow}>
        <StoreCard
          priceLabel="Free"
          primary={{ label: "Play free in browser", href: "/design" }}
          notifyTitle="iOS · coming soon"
          notify={<EmailSignupForm action={demoAction} label="Email" placeholder="you@example.com" submitLabel="Notify me" tone="on-card" successMessage="We'll email you." />}
          facts={FACTS}
        />
      </div>
    ),
  },
  {
    name: "StudioTeaser",
    render: () => (
      <StudioTeaser
        photo={null}
        eyebrow="The studio"
        title="A small studio with a big backlog of ideas."
        body="Founded in 2026."
        values={VALUES}
        action={{ label: "About the studio", href: "/design" }}
      />
    ),
  },
  {
    name: "Text",
    render: () => (
      <Stack gap={3}>
        <Text size="lead" weight="medium">
          Lead, medium
        </Text>
        <Text size="body-l">Body l</Text>
        <Text>Body (default)</Text>
        <Text size="body-s" tone="ink-2">
          Body s, ink-2
        </Text>
        <Text size="meta" tone="ink-3">
          Meta, ink-3
        </Text>
        <Text weight="semibold">Semibold</Text>
        <Frame tone="ink">
          <Stack gap={2}>
            <Text tone="on-dark">on-dark</Text>
            <Text tone="on-dark-2">on-dark-2</Text>
            <Text tone="on-dark-3">on-dark-3</Text>
          </Stack>
        </Frame>
      </Stack>
    ),
  },
  {
    name: "TextArea",
    render: () => (
      <Grid min="card">
        <TextArea label="Message" name="message" rows={3} />
        <TextArea label="With error" name="message-error" rows={3} error="Tell us a little more." />
      </Grid>
    ),
  },
  {
    name: "TextField",
    render: () => (
      <Grid min="card">
        <TextField label="Name" name="name" placeholder="Your name" />
        <TextField label="Email" name="email" type="email" error="Enter a valid email address." />
        <TextField label="Small" name="small" size="s" />
        <Frame tone="card">
          <TextField label="On card" name="card" tone="on-card" />
        </Frame>
        <Frame tone="ink">
          <TextField label="On dark" name="dark" tone="on-dark" placeholder="you@example.com" />
        </Frame>
        <TextField label="Hidden label" hideLabel name="hidden" placeholder="Label is visually hidden" />
      </Grid>
    ),
  },
  {
    name: "Turnstile",
    note: "Renders nothing unless the Turnstile site key is set outside `next dev` (CAPTCHA_WIDGET), so it is usually empty here.",
    render: () => <Turnstile />,
  },
  {
    name: "UpdateRow",
    render: () => (
      <div>
        <UpdateRow href="/design" date="2026-11-05" title="Patch 1.2: new biomes" />
        <UpdateRow href="/design" date="2026-10-21" title="Devlog: building the brush" />
        <UpdateRow href="https://example.com/inkorange" date="2026-10-14" title="An article about us on another site" source="Example Gazette" />
      </div>
    ),
  },
  { name: "ValueList", render: () => <ValueList items={VALUES} /> },
];

/** The component folders the gallery shows; compared with src/components/ui by the test. */
export const GALLERY_COMPONENTS: readonly string[] = COMPONENTS.map((c) => c.name);

// ---------------------------------------------------------------------------------------------

function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.group} aria-label={title}>
      <Heading as="h2" size="m">
        {title}
      </Heading>
      {children}
    </section>
  );
}

const slug = (name: string) => `c-${name.toLowerCase()}`;

/**
 * The /design page: every token in tokens.scss (via tokens.json) and every ui component in its
 * main variants. Internal and noindex; components render as-is, so it holds several h1s.
 */
export function DesignGallery() {
  return (
    <div className={styles.root}>
      <header className={styles.intro}>
        <Logo size="s" href="/" />
        <Display as="h1" size="m">
          Design system
        </Display>
        <Text tone="ink-2">
          Every token and component on the inkOrange Studios site. DESIGN.md is the rulebook; this page is the swatch book.
        </Text>
        <nav aria-label="Gallery contents">
          <ul className={styles.toc} role="list">
            {[
              ["t-color", "Color"],
              ["t-type", "Typography"],
              ["t-space", "Spacing"],
              ["t-layout", "Layout and sizes"],
              ["t-radius", "Radius"],
              ["t-motion", "Motion"],
              ["t-layers", "Layers"],
              ["t-components", "Components"],
            ].map(([id, label]) => (
              <li key={id}>
                <a className={styles.link} href={`#${id}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <Group id="t-color" title="Color">
        <Swatches tokens={inGroups("color", "texture")} />
      </Group>

      <Group id="t-type" title="Typography">
        <TokenRows tokens={inGroups(...TYPE_GROUPS)} kind={typeKind} />
      </Group>

      <Group id="t-space" title="Spacing">
        <TokenRows tokens={inGroups("space")} kind={() => "space"} />
      </Group>

      <Group id="t-layout" title="Layout and sizes">
        <TokenRows tokens={otherTokens()} kind={() => "plain"} />
      </Group>

      <Group id="t-radius" title="Radius">
        <TokenRows tokens={inGroups("radius")} kind={() => "radius"} />
      </Group>

      <Group id="t-motion" title="Motion">
        <Text size="body-s" tone="ink-2">
          Hover a row to run it. Every duration is 0ms under reduced motion.
        </Text>
        <TokenRows tokens={inGroups("duration", "ease")} kind={() => "motion"} />
      </Group>

      <Group id="t-layers" title="Layers">
        <TokenRows tokens={inGroups("z")} kind={() => "plain"} />
      </Group>

      <Group id="t-components" title="Components">
        <ul className={styles.index} role="list" aria-label="Component index">
          {COMPONENTS.map((c) => (
            <li key={c.name}>
              <a className={styles.link} href={`#${slug(c.name)}`}>
                {c.name}
              </a>
            </li>
          ))}
        </ul>
        {COMPONENTS.map((c) => (
          <section key={c.name} id={slug(c.name)} className={styles.specimen} aria-label={c.name}>
            <Heading as="h3" size="title-s">
              {c.name}
            </Heading>
            {c.note ? <p className={styles.note}>{c.note}</p> : null}
            <div className={styles.stage}>{c.render()}</div>
          </section>
        ))}
      </Group>
    </div>
  );
}
