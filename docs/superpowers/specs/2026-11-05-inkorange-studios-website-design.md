# inkOrange Studios website — design

Date: 2026-11-05
Owner: Chris West (thrillgraphics@gmail.com)

## Intent

inkOrange Studios is Chris West's independent game studio (New York, founded
2020). This repo is the studio's public website: a showcase for its games
(TerraForge, Mission Control, Space Cowboy, Exoplanet Explorer, Strata, and
whatever comes next), a place for news and devlogs, and the front door for
players who want to test upcoming games, get the newsletter, or get in touch.

The look is already designed: the **"D · Light — warm paper"** direction in
the Claude design canvas "inkOrange Studios — Website Layouts"
(https://claude.ai/artifact/2B5zHbnXoyemRCyyLGpvjG). Four artboards are the
source of truth:

| Artboard | File in the artifact |
|---|---|
| D · Light — Game showcase home (1440) | `project/LightHome.dc.html` |
| D · Light — TerraForge store page (1440) | `project/LightTerraForge.dc.html` |
| D · Phone — Home (390) | `project/LightHomePhone.dc.html` |
| D · Phone — TerraForge (390) | `project/LightTerraForgePhone.dc.html` |

The other boards in that canvas (A Orbit, B Studio Home, C Horizon, the dark
TerraForge page) are rejected directions and must not be used.

The second half of the intent matters as much as the pages: Chris wants **a
proper design system**, extracted from these mockups, documented in a
`DESIGN.md`, and **enforced** so that every page — written by Chris, a future
contributor, or a later Claude session — is built from it and nothing else.

## Goals

1. Ship the site with the pages listed below, matching the Light mockups on
   desktop and phone.
2. A design system in this repo: tokens, components, `DESIGN.md`, a `/design`
   gallery page, and automated checks that fail the build on violations.
3. Games, news, and legal text are edited in Sanity Studio (embedded at
   `/studio`), not in code.
4. Every email form stores its submission in Supabase; the beta form and the
   contact form also email Chris via Postmark.

## Non-goals

- SpaceUI (`@inkorange/space-ui`). It is a dark, glassy system and is not used
  here, not as a dependency and not as a base. (The studio copy that says every
  title runs on SpaceUI can stay as content.)
- Sending newsletters. Newsletter addresses are collected and stored only;
  Chris hasn't chosen how to send them yet.
- A custom admin screen. Content is edited in Sanity Studio; signups are
  viewed in the Supabase dashboard.
- User accounts or logins on the public site.
- A standalone Press page or a standalone Studio page (see Pages).

## Anti-goals (failure even if it works)

- Pages that drift from the system: one-off hex colors, hand-sized fonts,
  inline `style=`, or a button styled locally instead of using `Button`.
- Any styling framework: no Tailwind, no CSS-in-JS, no utility classes. This is
  a native SCSS project.
- Signup forms that leak whether an email is already on a list ("you're
  already signed up").
- Losing a signup because an email failed to send.
- Mixing the inkOrange content with the portfolio's in Studio so it's hard to
  tell which is which.

## Decided by Chris

- **Stack:** Next.js (App Router), Supabase, Postmark, Sanity.
- **Styling:** native SCSS, one `.module.scss` per component, all values as CSS
  custom properties. No Tailwind or other libraries.
- **Design system:** built in this repo, with `DESIGN.md` "and all". Not SpaceUI.
- **Logo:** the supplied PNG (orange "inkOrange STUDIOS" with "ink" knocked
  out of a rounded block, transparent background, 2199×829). It replaces the
  text-built logo in the mockups. Saved at `public/brand/inkorange-logo.png`.
  The knocked-out "ink" letters show whatever is behind the logo (paper on
  light grounds, ink on dark). A vector (SVG) version would be better for
  crisp scaling; trace or request one during the build.
- **Brand style reference:** the studio intro animation —
  `~/web/planet-builder/src/app/(explorer)/assets/inkorange_studios_intro.mp4`
  (master, 6s, 1920×1080) and `studio-intro.mp4` (the lighter in-app copy).
  See "Brand motif".
- **Beta tester signup (Space Cowboy):** emails Chris at
  thrillgraphics@gmail.com via Postmark.
- **Newsletter:** collect only, for now.
- **Signup pattern:** lift it from `~/web/planet-builder` (see Signups).
- **Content:** Sanity, the **same project and same dataset** as
  `~/web/portfolio`, with new document types.
- **Own pages:** About, Support, Privacy, Terms (plus Home and game pages).
- **Contact form:** lives on About; sends an email through Postmark.

## Pages

| Route | Source | Content |
|---|---|---|
| `/` | LightHome + LightHomePhone | Showcase hero carousel (featured games) with spotlight rail; studio one-liner; "All games" grid with All / Out now / Coming soon filter; beta callout band; studio teaser (links to `/about`); latest 3 news cards; footer with newsletter |
| `/games/[slug]` | LightTerraForge + LightTerraForgePhone | One per Sanity game: breadcrumb, title + chips, media viewer (trailer + screenshots with thumbnail strip), About the game, Features, Latest updates (news tagged to the game), store card (price, primary CTA, optional "notify me" platform signup, facts list), press kit card, help card, "More from inkOrange" |
| `/about` | Expands the studio section | Studio story, photo, values (Play first / Smart, not stuffy / Play anywhere), **contact form** |
| `/support` | New, in the system's style | FAQs (Sanity), per-game help links, link to the About contact form, support email |
| `/privacy`, `/terms` | New, in the system's style | Long-form text from Sanity |
| `/news` | My call | List of all posts ("All news →" target) |
| `/news/[slug]` | My call | A single post (news cards need somewhere to open) |
| `/design` | Design system | Living gallery of tokens and components. Not linked from the nav; `noindex` |
| `/studio` | Sanity | Embedded Sanity Studio |

Nav items: Games (`/#games`), Studio (`/about`), News (`/news`), Press (press
kit block, `/#press` in the footer), Support (`/support`). The active-pill
state in the nav pill bar reflects the current section.

Phone behavior follows the phone boards: hamburger button opening a dark menu
sheet; hero becomes a stacked card with dots; game grid is 2 columns; news
becomes a horizontal scroller; game page reorders to media → title/CTA →
about → features → details accordion → updates → more games scroller →
press/help cards, with a **sticky play bar** at the bottom.

## Design system

### Brand motif (from the intro animation)

The intro tells the studio's story in four stages: **sketch → shade →
paint → digital**. On warm paper, faint blue-grey construction guide-lines
appear and the logo is drawn in thin pencil outline (orange for the "ink"
block, graphite for "Orange"); diagonal pencil cross-hatching fills it; a
watercolor wash of oranges and reds bleeds in with a few paint flecks; then it
resolves into flat digital orange on near-black, a gloss sweeps across, and
"STUDIOS" types in.

How this informs the system (my interpretation; Chris said "style
inspiration", not "copy it"):

- **The paper is the sketchbook.** The Light palette already is that paper.
  Add a faint construction-grid/guide-line token set (thin, low-contrast
  blue-grey lines) usable as a decorative background on select surfaces
  (e.g. hero edges, section dividers, the `/design` page, empty states).
- **Hatching = "not finished yet".** The mockups' diagonal-stripe art
  placeholder already reads as pencil hatching. Formalize it as the
  system's placeholder, and use it on purpose for in-development /
  coming-soon art.
- **Paint = warmth and emphasis.** A watercolor-wash texture (an image asset,
  not a CSS gradient pretending to be one) is available for the accent
  callout band and the highlighted phrase ("make you think."), used sparingly.
- **Digital = the finished, playable thing.** Dark ink surfaces (showcase
  hero, footer, sticky play bar) are the "digital" end state, where real game
  art lives.
- **Motion:** an optional, subtle "draw-on" reveal (outline stroke → fill)
  for the logo and display headings on first view, plus the gloss sweep on
  hover for primary CTAs. Motion tokens (durations, easings) live in
  `tokens.scss`. Everything is off under `prefers-reduced-motion`. No
  autoplaying video by default.

### Source of the tokens

Extracted from the four Light boards. Starting values:

- **Color:** paper `#F6F1E7` (page), card `#FFFDF8`, sand `#EDE5D6` (alt
  sections, small cards), stripe `#E6DCCB`, line `#DDD3C2`, line-strong
  `#CFC4B1`, ink `#1C1A17` (text, dark surfaces), ink-2 `#4A453E` (body
  secondary), ink-3 `#6B6358` (meta), ink-4 `#8C8478` (placeholder), accent
  `#E8900C`, link `#9A5200`, on-dark text `#F6F1E7` / `#D9D1C4` / `#C9C0B2` /
  `#A39A8C`, dark lines `#3A362F` / `#5A544B` / `#6B6358`, dark stripes
  `#2A2722` / `#24211D`.
- **Accent vs. logo:** the logo orange (sampled ≈ `#E08E00`) and the mockup
  accent `#E8900C` are close but not equal. Sample the logo PNG precisely and
  use that one value for `--color-accent` everywhere, so the logo and the UI
  match.
- **Type:** Barlow Condensed 700/800 uppercase (display + headings), Inter
  400/500/600 (body/UI), JetBrains Mono 400/500 (labels, chips, dates, tracked
  uppercase). Loaded with `next/font/google`. Desktop display sizes seen: 112,
  108, 72, 64, 56, 48, 44, 36, 28, 22; phone: 68, 56, 44, 40, 38, 36, 34, 21,
  20. Body: 21, 18, 17, 16, 15, 14, 13; mono: 13, 12, 11, 10.
- **Shape:** radii 28 (hero/callout), 24 (store card, phone hero), 20, 18 (tiles,
  cards), 16 (rail buttons, dashed box), 14, 10, and pill `999px`.
- **Layout:** content max-width 1320 with 24px gutters (12–20 on phone);
  section padding steps of 88/96 desktop, 36–48 phone.

The builder should **normalize** these into a deliberate scale (e.g. a fluid
display scale with `clamp()` so desktop and phone sizes come from one token
rather than two), not copy every literal. Normalization is the builder's call,
but the result must stay visually faithful to the boards.

### Structure

```
src/styles/
  tokens.scss        # :root custom properties — the ONLY place raw values live
  globals.scss       # reset, base element styles, font wiring
  _mixins.scss       # breakpoints, focus ring, visually-hidden, etc. (Sass mixins only, no values)
src/components/ui/   # the design system components, one folder each
  Button/Button.tsx + Button.module.scss
  ...
DESIGN.md            # repo root
```

Starting component list (builder may split or merge): Logo, Button (accent /
ink / outline-on-light / outline-on-dark; link and button variants; sizes),
IconButton (round), Chip (status-accent / status-ink / outline / mono-plain),
NavPillBar, SiteHeader (desktop pill nav + CTA; phone hamburger + sheet),
SiteFooter (with newsletter), Container, Section (paper / sand / ink
backgrounds), SectionHeader (title + rule + optional action), Eyebrow (mono
tracked label), Heading / Display, Text, ShowcaseHero (carousel), SpotlightRail,
FilterPills, GameTile (cover + status chip), NewsCard, UpdateRow, FeatureList
(numbered), StoreCard, FactList (`dl`), Accordion (phone game details),
InfoCard (press / help), CalloutBand (accent band), MediaViewer (trailer +
thumbs), StickyPlayBar, EmailSignupForm (inline pill input + button; light and
dark variants), ContactForm, TextField / TextArea, FormMessage (success /
error), Placeholder (the striped art placeholder, light and dark), RichText
(Portable Text renderer styled by the system).

### DESIGN.md

At the repo root. Plain-language rules for humans and agents: the principles
(warm paper, ink, one accent; condensed uppercase display; mono for metadata;
pills everywhere), every token with its intended use, the type scale, spacing,
radii, breakpoints, each component with when to use it and when not to, page
composition rules, accessibility rules (contrast, focus, tap targets ≥ 44px,
reduced motion), and the enforcement rules below with how to add a new
token or component properly. `CLAUDE.md`/`AGENTS.md` should point to it so
future sessions read it first.

### Enforcement

Automated, and run in `lint` and in CI/the build:

- **Stylelint** (with `stylelint-config-standard-scss`, plus a strict-value
  rule such as `stylelint-declaration-strict-value`): in every
  `*.module.scss`, color, background, border-color, font-size, font-family,
  font-weight, line-height, letter-spacing, border-radius, gap, margin,
  padding, box-shadow, z-index must use `var(--…)` (allow `0`, `auto`,
  `inherit`, `currentColor`, `transparent`, `100%`-style layout values where
  sensible). Raw hex/rgb/hsl anywhere outside `tokens.scss` is an error.
- **ESLint:** ban `style` props in TSX (allowing only a narrow escape hatch for
  CSS custom-property passing if needed, e.g. `--progress`), ban raw color
  literals in TS/TSX, and restrict imports so that files in `src/app/**`
  (pages) can't import `.module.scss` files — pages compose components from
  `src/components/**`, they don't style. Layout-only page wrappers, if needed,
  go through `Container`/`Section`/a small `Stack`/`Grid` primitive.
- **Tests:** a token-sync check that every token in `tokens.scss` is
  documented in `DESIGN.md` (and vice versa), so the doc can't rot.

## Content (Sanity)

Same project and dataset as `~/web/portfolio`, read through the same env vars
(`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`,
`SANITY_API_TOKEN`). The portfolio repo shows the setup to follow:
`next-sanity`, `@sanity/image-url`, `@portabletext/react`, Studio embedded at
`/studio` via `src/app/(site)/studio/[[...tool]]/page.tsx`.

New document types are **prefixed** so they can't collide with the
portfolio's (`project`, `product`, `caseStudy`, `progressUpdate`, `about`,
`affiliateProduct`). My call on names:

- `studioGame` — name, slug, status (`out-now` / `coming-soon` /
  `in-development` / `announcing-soon`), genres, platforms, short blurb, long
  description (Portable Text), key art, cover art (3:4), trailer (URL + poster
  + duration), screenshots (with captions), features (title + body, ordered),
  facts (key/value list), price label, primary CTA (label + URL), optional
  "notify me for platform X" (platform name, on/off), press-kit URL/file,
  featured flag + featured order (drives the home showcase), sort order.
- `studioPost` — title, slug, date, type (Update / Announcement / Devlog /
  Patch notes), related game (reference, optional), cover image, excerpt, body
  (Portable Text).
- `studioPage` — for Privacy and Terms (and any future plain page): title,
  slug, last-updated date, body.
- `studioFaq` — question, answer, optional related game, order.
- `studioSettings` (singleton) — support email, social links, beta callout
  copy + which game it's for, newsletter blurb.

**Where the Studio lives:** embed a Studio at `/studio` on this site
configured with only the `studio*` types (titled e.g. "inkOrange Studios").
Give this Studio its **own workspace name** (e.g. `inkorange`), not
`"default"`: the portfolio's Studio uses `"default"`, and deployed schemas are
stored per workspace, so a distinct name keeps the two from overwriting each
other. Confirm with read-only checks before deploying anything. Add the
site's origins (localhost and production) as Sanity CORS origins.

Initial content: seed the games and copy from the mockups (TerraForge with its
real blurb, features and facts; the other four with their mockup blurbs). The
TerraForge key art is an image in the design artifact (`/_blob/4e6d01f8…`);
retrieve it from the artifact's assets if possible, otherwise use the
Placeholder component until Chris supplies art. Bracketed mockup text like
`[PRICE]` or `[RELEASE DATE]` becomes empty/optional fields, never shipped
literally; components hide a field that's empty.

**Privacy, Terms and FAQs (Chris decided): Chris supplies the text.** The
builder ships the page templates and the Sanity types only, with no drafted
legal copy. Each page renders an obvious, non-public-looking empty state when
its document is missing (and is `noindex` until it has content). For Chris's
reference when writing: the site uses Supabase (stores emails/messages),
Postmark (sends mail), Cloudflare Turnstile (bot check), Google Tag Manager
(analytics, consent-gated) and Vercel (hosting).

## Signups and contact (Supabase + Postmark)

Copy the pattern from `~/web/planet-builder`:
`src/app/actions/testerSignup.ts`, `src/lib/testers/{validate,notify}.ts`,
`src/lib/feedback/turnstile.ts`, and the migration
`supabase/migrations/0021_explorer_testers.sql`. In short:

1. A server action validates input server-side (zod), even if the client
   validates too.
2. Cloudflare Turnstile verifies the person is human.
3. The row is upserted into a Supabase table with `ignoreDuplicates` on the
   lower-cased email, so repeat signups are a silent success.
4. RLS is on with no policies; only the service-role client writes.
5. If storing fails, the user sees an error. If it succeeds and the row is
   new, the Postmark email is sent best-effort; a mail failure never surfaces
   to the user.

Forms and tables (my call on table shape; one table per list keeps each
simple):

| Form | Where | Table | Email to Chris |
|---|---|---|---|
| Newsletter | Footer, every page | `studio_newsletter_signups` (email, source page, created_at) | No |
| Beta tester | Home callout ("Join the beta") — opens/links to a small form | `studio_beta_signups` (email, game, platform iOS/Android if asked, source, created_at) | **Yes** — Postmark to thrillgraphics@gmail.com, reply-to the tester |
| Platform launch alert | Game page store card ("Notify me") | `studio_launch_alerts` (email, game, platform, created_at; unique on email+game+platform) | No |
| Contact | `/about` | `studio_contact_messages` (name, email, topic, message, created_at) | **Yes** — Postmark to thrillgraphics@gmail.com, reply-to the sender |

Env vars (same names as planet-builder/portfolio so values can be copied),
plus `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_GTM_ID`:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `POSTMARK_SERVER_TOKEN`, `FEEDBACK_FROM_EMAIL`
(sender, must be a verified Postmark sender), `FEEDBACK_NOTIFY_EMAIL`
(= thrillgraphics@gmail.com), `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET_KEY`, plus the Sanity vars. Ship a `.env.example`.

**Supabase project (Chris decided):** the **existing shared project** used by
planet-builder and the portfolio. Consequences:

- All tables are prefixed `studio_` so they can't collide with `feedback`,
  `explorer_testers`, `news_articles`, `pitch_*`, `aff_*`, `comments`, etc.
- Migration SQL lives in `supabase/migrations/` in this repo for the record,
  but is **applied by hand** (dashboard SQL editor or the Supabase MCP), not
  with `supabase db push`, so it never collides with planet-builder's
  numbered migration history.
- Each new table grants its own access explicitly (see planet-builder
  `0022_explicit_table_grants.sql`): RLS on, no policies, grants only to
  `service_role`. Nothing in this repo touches another app's tables.
- Env values (URL, keys) are copied from the existing project.

## Constraints

- Next.js 16 App Router, React 19, TypeScript, Node 24. Package manager: npm
  (matches planet-builder and portfolio).
- Hosting: Vercel (my assumption; the user's other projects deploy there).
- **Domain (Chris decided): `inkorangestudios.com`.** Used for
  `metadataBase`, canonical URLs, sitemap, robots and OG images. Launch
  checklist: add the domain to the Vercel project and DNS; add
  `inkorangestudios.com` (and `localhost`) to the Turnstile widget's
  hostnames; add it as a Sanity CORS origin; **verify inkorangestudios.com as a
  Postmark sender domain (DKIM + Return-Path)** so notification mail comes from
  an inkOrange address (e.g. `hello@inkorangestudios.com`). Until verification
  is done, notification mail is a no-op by design (rows are still saved).
- **Analytics (Chris decided): Google Tag Manager**, same as the portfolio,
  via `@next/third-parties/google` with `NEXT_PUBLIC_GTM_ID`. Because GTM sets
  cookies, the design system gains a **ConsentBanner** component (in the
  system's style: ink sheet, pill buttons "Accept" / "Decline") and GTM uses
  Google Consent Mode v2 defaulting to denied until the visitor accepts. The
  choice is remembered; a "Cookie settings" link in the footer reopens it.
- Accessibility: the mockups already use real buttons, labels and aria; keep
  that. Contrast must pass WCAG AA — note `#9A5200` on paper is used for
  links and must be checked; ink on accent is the CTA pairing.
- Performance: images through `next/image` with Sanity's image URL builder;
  pages are statically generated and revalidated when content changes.

## Left to the builder

- Normalizing the token scale (see above).
- Exact component APIs and variant names.
- Carousel behavior details (autoplay or not — default **no autoplay**,
  respects reduced motion).
- How "Join the beta" collects the email (inline form in the callout vs. a
  small dialog) — keep it in the system's style.
- Revalidation approach (Sanity webhook to an on-demand revalidate route, or
  time-based).
- Test setup (vitest, like planet-builder).

## Calls I made (for Chris to check)

- Sanity type names prefixed `studio*`; Studio workspace named `inkorange`.
- Supabase table names prefixed `studio_`, one table per list.
- `/news` and `/news/[slug]` pages exist so news cards have somewhere to open.
- Press stays a press-kit block, not a page.
- Support = FAQs + per-game help + link to the About contact form.
- Contact messages are stored in Supabase as well as emailed.
- The brand-motif interpretation of the intro video (guide-lines, hatching,
  watercolor accents, draw-on motion), and no autoplaying video.
- Hosting on Vercel; npm; vitest.
