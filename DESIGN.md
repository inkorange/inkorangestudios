# inkOrange Studios design system

This is the rulebook for every page on the inkOrange Studios site. Read it before
you build or change any UI, whether you are Chris, a contributor, or an AI
session. If something you need isn't here, add it here first (see
[Adding a token or component](#adding-a-token-or-component)), then build it.

The look comes from the **"D · Light — warm paper"** mockups (home and
TerraForge page, desktop 1440 and phone 390). Where this document and the
mockups disagree, this document wins; fix whichever one is wrong.

Where things live:

| Path | What it holds |
|---|---|
| `src/styles/tokens.scss` | Every raw value: colors, fonts, sizes, radii, durations, layers. The only file allowed to hold them. |
| `src/styles/_mixins.scss` | Sass mixins (breakpoints, focus ring, visually hidden, reduced motion). With `tokens.scss`, the only files allowed Sass `$variables` (in `tokens.scss`, only inside its helper functions). |
| `src/styles/globals.scss` | Reset and base element styles. Imported once, by `src/app/layout.tsx`. |
| `src/app/fonts.ts` | The three font families, loaded with `next/font/google`. |
| `src/components/ui/<Name>/` | One folder per design-system component: `<Name>.tsx` + `<Name>.module.scss` (+ test). |
| `public/brand/` | The logo PNG and the watercolor texture. |

## Principles

1. **Warm paper, ink, one accent.** Pages sit on warm off-white paper. Text and
   dark surfaces are near-black ink. There is exactly one accent color, the
   logo orange, and it is used for the logo, the primary call to action, "out
   now" status, numbered markers and the one highlighted phrase. No second
   accent, no gradients standing in for color.
2. **Condensed uppercase display.** Headlines, game names and section titles
   are Barlow Condensed, bold or black, uppercase, set tight. Everything else
   is Inter.
3. **Mono for metadata.** Status chips, eyebrows, dates, counters, labels and
   placeholder captions are JetBrains Mono, small, tracked out and uppercase.
   Mono means "this is data about the thing", never the thing itself.
4. **Pills everywhere.** Buttons, chips, the nav bar, filter tabs, inputs and
   round icon buttons are fully rounded (`--radius-pill`). Cards and media use
   large soft radii. There are no square corners on interactive things.
5. **Hairlines, not shadows.** Cards are separated by 1px `--color-line`
   borders and tone changes (paper → card → sand), not drop shadows. The only
   shadow in the system is the floating sticky play bar.
6. **Light page, dark showcase.** The page is light. Dark ink surfaces are
   reserved for the "finished, playable" moments: the showcase hero, media
   viewer, footer, phone menu sheet and sticky play bar.
7. **Content decides what shows.** Optional content that is missing hides its
   whole block (heading included). Bracketed mockup text such as `[PRICE]` or
   `[RELEASE DATE]` is never rendered.
8. **Compose, don't style.** Pages are built only from components. If a page
   needs a look that no component provides, add or extend a component.

## Brand motif

The studio intro animation tells a four-stage story: **sketch → shade → paint
→ digital**. Pencil construction lines and an outline logo appear on paper,
cross-hatching fills it in, a watercolor wash bleeds in, then it resolves into
flat digital orange on near-black. The system uses each stage on purpose:

| Stage | In the system | Use it for | Don't |
|---|---|---|---|
| **Sketch** — construction lines | Faint blue-grey guide lines in `--color-guide`, drawn by the `GuideLines` component | Decorative backgrounds on a few surfaces: hero edges, section dividers, the `/design` page, empty states | Behind body text, on dark surfaces, or on more than one or two surfaces per page. Always `aria-hidden`. |
| **Shade** — pencil hatching | The diagonal-stripe placeholder (`--color-sand` / `--color-stripe` on light, `--color-dark-stripe` / `--color-dark-stripe-2` on dark), drawn by `Placeholder` | Art that doesn't exist yet: covers, key art, screenshots, photos. It means "not finished yet", so it is the right look for coming-soon and in-development games | As decoration on finished content, or as an empty box with no stripe. Missing art is always the hatched placeholder. |
| **Paint** — watercolor wash | The texture image `--texture-watercolor` (a real image asset, not a CSS gradient) | The accent callout band and the one highlighted phrase ("make you think.") | Anywhere else. At most once or twice per page. Never behind small text. |
| **Digital** — flat orange on ink | Dark `--color-ink` surfaces with `--color-on-dark` text and the accent | The showcase hero, media viewer, footer, phone menu sheet and sticky play bar: where real game art lives | Light-page sections that just want "contrast". A page has one dark hero area at most, plus the footer. |

Motion follows the same story: an optional one-time **draw-on** reveal
(outline, then fill) for the logo and display headings on first view, and a
**gloss sweep** across primary buttons on hover. See [Motion](#motion).

**The logo** is the supplied PNG at `public/brand/inkorange-logo.png`
(orange "inkOrange STUDIOS", with "ink" knocked out of a rounded block). The
knocked-out letters show whatever is behind it: paper on light grounds, ink on
dark. Always render it with the `Logo` component (alt text "inkOrange
Studios"). Don't rebuild it in live text the way the mockups did, recolor it,
stretch it, or put it on the accent or on busy art.

## Color

All colors are CSS custom properties in `tokens.scss`. Use them by role, not by
how they look: if you need "secondary body text", use `--color-ink-2` even if
another token looks close.

### Light surfaces and text

| Token | Value | Use for (as in the mockups) |
|---|---|---|
| `--color-paper` | `#F6F1E7` | Page background. Also the fill of email inputs on dark surfaces. |
| `--color-card` | `#FFFDF8` | Raised surfaces on paper: news cards, the store card, the nav pill bar, the selected spotlight rail item, the phone menu button, the phone details accordion, inputs on paper/sand. |
| `--color-sand` | `#EDE5D6` | Alternate sections (the studio band, "More from inkOrange") and small info cards (press kit, help). First stripe of the light placeholder. |
| `--color-stripe` | `#E6DCCB` | Second stripe of the light placeholder. Nothing else. |
| `--color-line` | `#DDD3C2` | 1px borders on cards, tiles and inputs; row dividers in feature lists, update rows and fact lists; unselected thumbnail borders. |
| `--color-line-strong` | `#CFC4B1` | Borders that must read on paper without a fill: unselected filter pills, the dashed "notify me" box. |
| `--color-ink` | `#1C1A17` | Primary text and headings. The selected nav pill and filter pill. The 2px rule under section headers and the 3px rule over values. Secondary buttons ("Join the beta", "Notify me"). The "coming soon" chip. Selected thumbnail/rail borders. All dark surfaces. Text on the accent. |
| `--color-ink-2` | `#4A453E` | Secondary body text: paragraph copy under a heading, feature descriptions, info-card descriptions, value descriptions. |
| `--color-ink-3` | `#6B6358` | Metadata: "Genre · Platform" lines, dates, breadcrumbs, fact-list labels (`dt`), thumbnail captions, small mono eyebrows on cards ("GET THE GAME"). |
| `--color-ink-4` | `#8C8478` | Placeholder captions only (`[COVER ART]`). 3.28:1 on paper: decorative text, never real content. |
| `--color-accent` | `#E08D00` | The logo orange, sampled from the logo PNG. Primary buttons, the "out now" chip, the callout band, the highlighted phrase, numbered feature markers, the trailer play button, the active carousel dot, text selection. Text on it is always `--color-ink`. Never use it as a text color on light surfaces (2.34:1 on paper). |
| `--color-link` | `#9A5200` | Text links that are actions ("All news →", "Download →"), the eyebrow above a section ("THE STUDIO"), and the hover color of plain links. |

### Dark ("digital") surfaces

| Token | Value | Use for |
|---|---|---|
| `--color-on-dark` | `#F6F1E7` | Main text and headings on ink; link text in the footer. |
| `--color-on-dark-2` | `#D9D1C4` | Body copy on ink (the hero blurb). |
| `--color-on-dark-3` | `#C9C0B2` | Secondary text on ink: hero platform line, slide counter, footer intro line, footer bottom-row links, the sticky bar's price line. |
| `--color-on-dark-4` | `#A39A8C` | Quiet labels on ink: footer column labels, the copyright line. |
| `--color-dark-line` | `#3A362F` | Dividers on ink: footer rule, menu-sheet rows. |
| `--color-dark-line-2` | `#5A544B` | Borders of chips and round icon buttons on ink; unselected carousel dots. |
| `--color-dark-line-3` | `#6B6358` | Border of the outline button on ink ("Game details"). |
| `--color-dark-stripe` | `#2A2722` | First stripe of the dark placeholder. |
| `--color-dark-stripe-2` | `#24211D` | Second stripe of the dark placeholder. |

### Brand motif tokens

| Token | Value | Use for |
|---|---|---|
| `--color-guide` | `#B9C4CC` | The faint blue-grey construction lines (`GuideLines`). Decorative only. |
| `--color-shadow` | ink at 25% | The one shadow in the system: under the floating sticky play bar. |
| `--texture-watercolor` | `url(/brand/watercolor-wash.webp)` | The watercolor wash for the callout band and the highlighted phrase. Layer it over `--color-accent` so the band still reads if the image fails to load. |

### Pairings

- Light page: `--color-ink` on `--color-paper`, `--color-card` or `--color-sand`.
- Primary action: `--color-ink` text on `--color-accent`.
- Secondary action on light: `--color-on-dark` text on `--color-ink`.
- Dark surface: `--color-on-dark` (or `-2`/`-3`/`-4` by importance) on `--color-ink`.
- Never: accent text on paper, ink-4 for anything a reader needs, on-dark text on the accent.

## Typography

Three families, loaded in `src/app/fonts.ts` with `next/font/google`. The font
tokens put the loaded face first (via `var(--font-display-face)` and friends,
set on `<html>` by the root layout) and fall back to system fonts.

| Token | Family | Use for |
|---|---|---|
| `--font-display` | Barlow Condensed (600/700/800) | Display and headings, always uppercase. Game names on tiles and rails. |
| `--font-sans` | Inter (400/500/600) | Body text, buttons, nav, form fields. The page default. |
| `--font-mono` | JetBrains Mono (400/500) | Chips, eyebrows, dates, counters, labels, placeholder captions. Usually uppercase with `--tracking-mono`. |

### Type scale

Every size is fluid: it scales smoothly from the phone size at a 375px viewport
to the desktop size at 1320px, using `clamp()` in rem plus a vw slope. Because
the ends are in rem, text still grows when a reader raises their browser font
size. Pick the token by role; don't pick a different token at a breakpoint.

| Token | Phone → desktop | Used for in the mockups |
|---|---|---|
| `--text-display-xl` | 68 → 112px | Page titles ("TERRAFORGE") and the showcase hero game name. Weight 800. |
| `--text-display-l` | 44 → 72px | The studio one-liner ("An independent studio making games that make you think."). Weight 800. |
| `--text-display-m` | 40 → 64px | Callout band heading ("Play Space Cowboy before anyone else."). Weight 800. |
| `--text-heading-l` | 34 → 56px | Big section statements: the studio heading, the footer "Get the newsletter". |
| `--text-heading-m` | 34 → 44px | Standard section headers: "All games", "News", "About the game", "Features". Phone menu-sheet links. Weight 700. |
| `--text-heading-s` | 26 → 36px | The price in the store card. |
| `--text-title` | 20 → 28px | Game names under tiles. Weight 700, display font. |
| `--text-title-s` | 20 → 22px | Game names in the spotlight rail and the sticky play bar. |
| `--text-lead` | 17 → 21px | The lead paragraph on a game page. Weight 500. |
| `--text-body-l` | 16 → 18px | Hero blurb, feature titles, update-row headlines. |
| `--text-body` | 15 → 17px | Default body copy (set on `body`). |
| `--text-body-s` | 14 → 15px | Nav pills, filter pills, card descriptions, feature descriptions, fact lists. |
| `--text-meta` | 13 → 14px | "Genre · Platform" lines, breadcrumbs, copyright. |
| `--text-mono` | 12 → 13px | Mono chips, eyebrows, the slide counter, dates. |
| `--text-mono-s` | 11 → 12px | Small mono: tile status chips, footer column labels, placeholder captions. |
| `--text-mono-xs` | 10 → 11px | The smallest mono labels: phone placeholder captions, the trailer-length label. |

### Weights

| Token | Value | Use for |
|---|---|---|
| `--weight-regular` | 400 | Body copy, mono labels. |
| `--weight-medium` | 500 | Nav and filter pills, the lead paragraph, mono numbers in feature markers. |
| `--weight-semibold` | 600 | Buttons, links that are actions, card and row headlines, value titles. |
| `--weight-bold` | 700 | Display font: section headings, tile and rail names. |
| `--weight-black` | 800 | Display font: page titles, hero, one-liner, callout, footer heading. |

### Line height

| Token | Value | Use for |
|---|---|---|
| `--leading-tight` | 0.86 | Display sizes (xl/l/m). Condensed caps stack tightly. |
| `--leading-snug` | 1 | Headings and game names. |
| `--leading-normal` | 1.3 | Card and row headlines, short UI text. |
| `--leading-body` | 1.6 | Body copy (the page default). |
| `--leading-loose` | 1.7 | Long-form paragraphs on game, news and legal pages. |

### Letter spacing

| Token | Value | Use for |
|---|---|---|
| `--tracking-mono` | 0.1em | Mono chips, labels, captions. |
| `--tracking-eyebrow` | 0.14em | Eyebrows above headings ("THE STUDIO", "NOW RECRUITING TESTERS"), footer column labels. |
| `--tracking-wordmark` | 0.06em | Wordmark-style lettering (the "STUDIOS" line); rare. |

Rules: display text is always uppercase. Mono text is uppercase unless it's a
date or a number. Don't bold Inter past 600. Don't use the display font below
`--text-title-s`.

## Spacing & layout

### Space scale

Spacing tokens are named by their multiple of 4px: `--space-6` is 24px. Use
them for every margin, padding and gap.

| Token | Value | Typical use |
|---|---|---|
| `--space-1` | 4px | Hairline gaps between a label and its value. |
| `--space-2` | 8px | Chip rows, gaps between pills, small stacks. |
| `--space-3` | 12px | Button rows, spotlight rail gaps, thumbnail strips, phone grid column gap. |
| `--space-4` | 16px | Card inner padding (small), stacked list gaps. |
| `--space-5` | 20px | Grid column gaps, header padding-bottom, card padding. |
| `--space-6` | 24px | Card padding, news grid gap. (Page gutters use `--gutter`.) |
| `--space-7` | 28px | Tile grid row gap, space under section headers, store card padding. |
| `--space-8` | 32px | Column gaps in two-column sections. |
| `--space-10` | 40px | Gaps inside the callout and footer. |
| `--space-12` | 48px | Large stacks. |
| `--space-14` | 56px | Hero and callout inner padding, gap between a section's media and text. |
| `--space-16` | 64px | Gap between blocks in the game-page main column. |
| `--space-18` | 72px | Space above the game-page content columns. |
| `--space-22` | 88px | Space above the studio one-liner, top padding of sand sections. |
| `--space-24` | 96px | Fixed large section padding on desktop. |

### Layout tokens

| Token | Value | Use for |
|---|---|---|
| `--section-y` | 48 → 96px (fluid) | Vertical padding of a standard section. Use this rather than picking phone and desktop spaces. |
| `--gutter` | 16 → 24px (fluid) | Left and right page padding inside `Container`. |
| `--content-max` | 1320px | Maximum content width. Everything lines up to this column. |
| `--content-narrow` | 760px | Maximum width of a narrow `Container` (long-form text, legal pages). |
| `--grid-min-tile` | 260px | Minimum column width of a `Grid` of game tiles. |
| `--grid-min-tile-s` | 240px | Minimum column width of a denser `Grid` of tiles. |
| `--grid-min-card` | 300px | Minimum column width of a `Grid` of news cards. |
| `--grid-min-rail` | 240px | Minimum column width of the spotlight rail `Grid`. |
| `--grid-min-thumb` | 150px | Minimum column width of a `Grid` of media thumbnails. |
| `--card-image-height` | 180px | Height of the image area of a `NewsCard`. |
| `--marker-size` | 36px | Diameter of the numbered accent circle in `FeatureList`. |
| `--date-column` | 120px | Width of the mono date column in `UpdateRow`. |
| `--wash-opacity` | 0.35 | Opacity of the watercolor edge on `CalloutBand`; keeps ink text above 4.5:1 on the accent. |
| `--logo-width-s` | 120px | `Logo` width at size `s`. |
| `--logo-width-m` | 160px | `Logo` width at size `m` (default). |
| `--logo-width-l` | 220px | `Logo` width at size `l`. |
| `--play-button-size` | 68 → 96px (fluid) | Diameter of the accent play button on the `MediaViewer` stage. |
| `--thumb-height` | 60 → 92px (fluid) | Height of `MediaViewer` thumbnails; phone strip thumbs are 1.6 times this wide. |
| `--sticky-bar-space` | 96px | Room the `StickyPlayBar` occupies at the bottom of a phone page. Pages (or the footer) add `padding-bottom: var(--sticky-bar-space)` below `lg` so the last content scrolls clear of the bar. |

### Breakpoints

Layouts are mobile-first. Breakpoints live in `_mixins.scss` and are used with
`@include bp(md) { … }` or `@include bp(lg) { … }`:

- **md, 720px and up:** tablets and small laptops. Phone stacks become rows.
- **lg, 1024px and up:** desktop. Pill nav replaces the hamburger, the game
  page goes two-column with the store card on the right.

Prefer intrinsic layouts (`repeat(auto-fill, minmax(…, 1fr))`, flex-wrap) so
most components need no breakpoint at all; the mockups are built that way.

## Radius

| Token | Value | Use for |
|---|---|---|
| `--radius-xs` | 10px | Spotlight rail thumbnails, phone media thumbnails. |
| `--radius-s` | 14px | Desktop media thumbnails, phone game tiles. |
| `--radius-m` | 16px | Spotlight rail items, the dashed "notify me" box. |
| `--radius-l` | 18px | Game tiles, news cards, phone press/help cards. |
| `--radius-xl` | 20px | Press and help cards, the phone media viewer and details accordion, phone studio photo. |
| `--radius-2xl` | 24px | The store card, desktop studio photo, phone hero card, phone callout, phone menu sheet. |
| `--radius-3xl` | 28px | The big surfaces: desktop showcase hero, media viewer, callout band. |
| `--radius-pill` | 999px | Every button, chip, input, nav bar, filter pill, round icon button and the sticky play bar. |

Rule of thumb: the bigger the surface, the bigger the radius. On phone, step a
surface down one size (desktop `--radius-3xl` becomes `--radius-2xl` or
`--radius-xl`).

## Sizes

| Token | Value | Use for |
|---|---|---|
| `--tap-min` | 44px | Minimum height and width of anything tappable. |
| `--icon-button` | 48px | Round icon buttons: carousel arrows, the phone menu button. |
| `--control-height` | 48px | Height of buttons and inputs at the default size. |
| `--focus-ring-width` | 2px | Width of the focus outline. |
| `--focus-ring-offset` | 2px | Gap between an element and its focus outline. |

## Motion

| Token | Value | Use for |
|---|---|---|
| `--duration-fast` | 120ms | Color and border changes on hover and press. |
| `--duration-base` | 200ms | Most UI transitions: opening the menu sheet or accordion, swapping a slide. |
| `--duration-slow` | 600ms | The gloss sweep across primary buttons; fade-in of revealed content. |
| `--duration-draw` | 1200ms | The one-time draw-on reveal of the logo and display headings. |
| `--ease-standard` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | The default easing for state changes. |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Things entering the screen. |

Rules:

- Under `prefers-reduced-motion: reduce`, every duration token is `0ms`, so
  anything timed with tokens stops moving on its own. Looping or keyframe
  animations must also be switched off with `@include reduced-motion { … }`.
  Smooth scrolling is already turned off in `globals.scss`.
- Motion is a reward, not a requirement: content must be visible and usable
  with every animation off.
- Nothing moves on its own. No autoplaying video, no auto-advancing carousel.
  Video plays only when the visitor presses play.

## Layers

| Token | Value | Use for |
|---|---|---|
| `--z-sticky` | 10 | The sticky play bar on phone game pages. |
| `--z-header` | 20 | The site header. |
| `--z-sheet` | 30 | The phone menu sheet. |
| `--z-banner` | 40 | The cookie consent banner, which sits above everything. |

Use only these four. If a component needs a new layer, add a token.

## Components

Each design-system component lives in its own folder in `src/components/ui/`
with a `.tsx` file and one `.module.scss` file. Every folder gets a `### Name`
section below (the sync test fails without it) saying what it is, when to use
it, when not to, its variants, and its accessibility behavior. Use this shape:

```md
### ComponentName

What it is in one sentence.

- **Use for:** …
- **Don't use for:** … (and what to use instead)
- **Props / variants:** …
- **Accessibility:** …
```

### Container

Centers content to `--content-max` with `--gutter` padding on each side.

- **Use for:** the inside of every `Section`, so every page lines up to one column.
- **Don't use for:** full-bleed art (put it directly in the `Section`).
- **Props / variants:** `width`: `content` (default) or `narrow` (`--content-narrow`, for long-form text).
- **Accessibility:** a plain `div`; no landmark role.

### Section

A full-width horizontal band with `--section-y` vertical padding and a background tone.

- **Use for:** each block of a page. Wrap a `Container` inside it.
- **Don't use for:** cards or inner groupings (use `Stack`); two `sand` sections side by side.
- **Props / variants:** `tone`: `paper` (default), `sand`, `ink` (sets light text); `space`: `default`, `tight` (half), `none`; `id`; `aria-label`.
- **Accessibility:** renders a `<section>`; give it an `aria-label` when it should be a landmark ("Featured games"). Exposes `data-tone` and `data-space`.

### Stack

A flex container with token gaps.

- **Use for:** vertical or horizontal groups with consistent spacing (chip rows, button rows, lists).
- **Don't use for:** responsive card layouts (use `Grid`).
- **Props / variants:** `gap`: 1, 2, 3, 4 (default), 5, 6, 8, 10, 12, 14, 16 (the `--space-*` scale); `direction`: `column` (default) or `row`; `align` (`start`, `center`, `end`, `stretch`, `baseline`); `justify` (`start`, `center`, `end`, `between`); `wrap`; `as`: `div` (default), `ul`, `ol`, `li`, `nav`, `header`, `footer`, `span`.
- **Accessibility:** list and nav semantics come from `as`; list bullets are removed, so only use `ul`/`ol` for real lists. `ul` and `ol` get an explicit `role="list"` so Safari keeps the semantics.

### Grid

An intrinsic auto-fill grid: columns are at least the chosen minimum, then stretch.

- **Use for:** game tiles, news cards, thumbnails, the spotlight rail.
- **Don't use for:** a fixed number of columns, or one-dimensional rows (use `Stack`).
- **Props / variants:** `min` (required): `tile` (260), `tile-s` (240), `card` (300), `rail` (240), `thumb` (150), from the `--grid-min-*` tokens; `gap`: a `--space-*` step (default 5).
- **Accessibility:** a plain `div`; no breakpoints needed, so reflow works at any zoom.

### Display

The condensed uppercase display heading, with `Highlight` for the one accent phrase.

- **Use for:** page titles, the hero game name, the studio one-liner, the callout heading.
- **Don't use for:** section headers (use `Heading`) or anything smaller than a heading.
- **Props / variants:** `as`: `h2` (default) or `h1`; `size`: `xl`, `l`, `m`; `tone`: `ink` (default) or `on-dark`. `Highlight` takes `paint` to layer `--texture-watercolor` over the accent; use at most one per page.
- **Accessibility:** renders a real heading; keep one `h1` per page. `Highlight` is a plain `span`, text stays selectable and readable (ink on accent is 6.6:1).

### Heading

The standard section heading in the display face.

- **Use for:** section titles, store price, game names under tiles.
- **Don't use for:** page titles (use `Display`) or body text.
- **Props / variants:** `as` (required): `h2` or `h3`; `size` (required): `l`, `m`, `s`, `title`, `title-s`. Color is inherited, so it works on ink sections.
- **Accessibility:** choose the level for document outline, not size.

### Text

Body copy in Inter.

- **Use for:** paragraphs, lead text, metadata lines.
- **Don't use for:** headings, or mono labels (use `Eyebrow`).
- **Props / variants:** `as`: `p` (default), `span`, `div`; `size`: `lead`, `body-l`, `body`, `body-s`, `meta`; `tone`: `ink`, `ink-2`, `ink-3`, `on-dark`, `on-dark-2`, `on-dark-3` (inherits when omitted); `weight`: `regular`, `medium`, `semibold`.
- **Accessibility:** do not use `ink-3` on a tone it does not pass on; see [Contrast](#contrast).

### Eyebrow

A small mono, tracked, uppercase label above a heading.

- **Use for:** "THE STUDIO", "NOW RECRUITING TESTERS", footer column labels.
- **Don't use for:** status chips (use `Chip`) or anything a reader must act on.
- **Props / variants:** `tone`: `ink-3` (default), `link`, `on-dark-4`, `on-accent` (ink, for the accent callout band).
- **Accessibility:** renders a `<p>`; text is in the source in normal case, uppercase is CSS only.

### Logo

The supplied inkOrange Studios logo PNG, with an optional one-time reveal.

- **Use for:** the header, footer and intro. Always use this instead of rebuilding the wordmark.
- **Don't use for:** recoloring, stretching, or placing on the accent or busy art.
- **Props / variants:** `size`: `s`, `m` (default), `l` (`--logo-width-*`); `href` wraps it in a link; `animate` plays a once-only sketch (grey, drawn left to right), paint (softening) and digital (flat orange) reveal using `--duration-draw`, off under reduced motion.
- **Accessibility:** `alt="inkOrange Studios"`; when linked, the link's name is the alt text, with a visible focus ring.

### Placeholder

The hatched stripe stand-in for art that does not exist yet.

- **Use for:** missing covers, key art, photos.
- **Don't use for:** loading skeletons or empty states with text (use a message).
- **Props / variants:** `tone`: `light` (default) or `dark`; `ratio`: `3/4`, `16/9`, `16/7.5`, `16/10`, `1/1` (fills its parent when omitted); `label` (mono caption in `--color-ink-4`); `radius`: `l` (default), `xl`, `2xl`, `3xl`, `none`.
- **Accessibility:** `aria-hidden` unless a label is given. The label is decorative-grade contrast (3.28:1), so never put needed information in it.

### GuideLines

Decorative faint construction lines drawn behind its children.

- **Use for:** a few hero edges and dividers, the `/design` page, empty states.
- **Don't use for:** content, or more than one or two surfaces per page.
- **Props / variants:** `children` only. Lines are CSS gradients in `--color-guide`.
- **Accessibility:** the lines layer is `aria-hidden` and ignores pointer events.

### Icon

The inline SVG icon set, drawn from the mockups.

- **Use for:** icons inside `Button` and `IconButton`, or beside a label.
- **Don't use for:** art or logos; icon-only controls need `IconButton` for the label.
- **Props / variants:** `name`: `chevron-left`, `chevron-right`, `play`, `globe`, `phone`, `menu`, `close`, `arrow-right`; `size`: 16, 18 (default), 20, 26, 34. Uses `currentColor`.
- **Accessibility:** always `aria-hidden`; the control around it carries the name.

### Button

The pill-shaped action: a link or a real button.

- **Use for:** calls to action. One `accent` button per view; pair it with `ink` or an outline.
- **Don't use for:** plain text links (use a normal link) or round icon-only controls (use `IconButton`).
- **Props / variants:** `variant`: `accent` (orange, ink text, gloss sweep on hover), `ink`, `outline` (ink border, on light), `outline-on-dark` (on ink surfaces), `on-light` (card fill, for the accent callout band); `size`: `m` (default, `--control-height`), `l`, `s` (`--tap-min`); `href` (internal renders `next/link`); `external` (new tab, `rel="noopener noreferrer"`); `block`; `icon`; `type` (default `button`); `onClick`; `disabled` (button element only; links are never disabled).
- **Accessibility:** at least `--tap-min` tall. Focus ring is ink, and accent on `ink` and `outline-on-dark`. The gloss sweep is removed under reduced motion. External links open a new tab, so say so in the label when it matters.

### IconButton

A round button holding one icon.

- **Use for:** carousel previous/next, the phone menu toggle.
- **Don't use for:** actions that need a text label (use `Button`).
- **Props / variants:** `icon`; `label` (required); `tone`: `light` (default, card fill) or `dark` (outline on ink); `size`: `m` (`--icon-button`, default) or `l`; `onClick`; `aria-expanded`; `aria-controls`.
- **Accessibility:** `label` becomes `aria-label`. 48px or larger. Accent focus ring on the `dark` tone.

### Chip

A small mono, tracked, uppercase tag.

- **Use for:** status ("Out now", "Coming soon"), genre and platform tags, tile status chips.
- **Don't use for:** anything clickable (use `FilterPills` or `Button`).
- **Props / variants:** `tone`: `accent`, `ink`, `outline`, `outline-on-dark`, `plain-on-dark`; `size`: `m` (default) or `s` (tile chips).
- **Accessibility:** a plain `span`; the text itself carries the meaning, never color alone. Uppercase is CSS only.

### FilterPills

A row of toggle pills that pick one value.

- **Use for:** the All / Out now / Coming soon game filter.
- **Don't use for:** navigation between pages (use `NavPillBar`) or multi-select.
- **Props / variants:** `options` (readonly strings), `value`, `onChange(value)`, `label` (names the group).
- **Accessibility:** a `role="group"` of buttons; the current one has `aria-pressed="true"`. Each is at least `--tap-min`.

### TextField

A pill-shaped single-line input with its label.

- **Use for:** email and short text fields.
- **Don't use for:** multi-line text (use `TextArea`).
- **Props / variants:** `label` (required); `hideLabel` (visually hidden, still the accessible name); `name`; `type`: `text` (default) or `email`; `placeholder`; `required`; `tone`: `on-light` (card fill, default), `on-card` (paper fill, for inputs inside a card), `on-dark` (paper fill, accent focus ring, for ink surfaces); `size`: `m` (`--control-height`, default) or `s` (`--tap-min`); `error`; `autoComplete`; optional controlled `value` / `onChange`.
- **Accessibility:** a real `label` linked by id. With `error`, the input gets `aria-invalid="true"` and `aria-describedby` pointing at the message, and the border thickens (never color alone). A placeholder never replaces the label.

### TextArea

A multi-line input with its label.

- **Use for:** the contact message and other free text.
- **Don't use for:** single-line values (use `TextField`).
- **Props / variants:** `label`, `name`, `rows` (default 5), `required`, `error`.
- **Accessibility:** same label, `aria-invalid` and `aria-describedby` wiring as `TextField`. Resizes vertically only.

### FormMessage

The result line of a form.

- **Use for:** a form's success or error outcome.
- **Don't use for:** per-field errors (use the `error` prop of the field).
- **Props / variants:** `status`: `success` or `error`; `children`.
- **Accessibility:** `success` is `role="status"`, `error` is `role="alert"`. Errors carry a thicker border so they differ without color. Text inherits the surface color, so it reads on light and ink.

### EmailSignupForm

An email input plus submit button bound to a server action.

- **Use for:** the footer newsletter, the beta signup and the launch-alert ("Notify me") box.
- **Don't use for:** forms with more than an email (build those from `TextField` / `TextArea`).
- **Props / variants:** `action(prev, data)` returning a `FormState`; `label` (visually hidden); `placeholder`; `submitLabel`; `tone`: `on-dark` (footer: paper input, accent button), `on-card` (store card box: paper input, ink button), `on-accent` (callout band: card input, ink button); `layout`: `inline` (row that wraps when narrow, default) or `stacked` (phone / footer column, full-width button); `hidden` (extra fields sent with the form); `successMessage`.
- **Accessibility:** the label stays the input's accessible name. Submit is disabled while pending. Success replaces the form with a `status` message; an error shows in an `alert` and keeps what was typed. Includes `Turnstile`, which renders only when `CAPTCHA_REQUIRED`.

### Turnstile

The Cloudflare human check, invisible to the layout when off.

- **Use for:** inside any public form that posts to a server action (`EmailSignupForm` includes it).
- **Don't use for:** pages with no form.
- **Props / variants:** `resetKey` (change it after each submit result to renew the single-use token). Loads `api.js?render=explicit` and writes the token into a hidden `captchaToken` input so `FormData` carries it. Site key from `publicEnv.turnstileSiteKey`.
- **Accessibility:** renders nothing when `CAPTCHA_REQUIRED` is false (`next dev`, tests, no keys). Cloudflare's widget supplies its own labelling.

### SectionHeader

A section title with a 2px ink rule beneath and an optional action link.

- **Use for:** the top of every content section ("All games", "News", "More from inkOrange").
- **Don't use for:** the page title (use `Display`) or headings inside body copy (use `Heading`).
- **Props / variants:** `title`; `as`: `h2` (default) or `h1`; `size`: `l` (default) or `m`; `action` (`{ label, href }`, rendered in `--color-link`); `children` (e.g. `FilterPills`, placed between title and action); `rule` (default true).
- **Accessibility:** the title is the section's heading, so pick `as` to fit the outline. The action link is at least `--tap-min` tall with a visible focus ring.

### GameTile

A 3:4 cover with a status chip, the game name and a meta line, all one link.

- **Use for:** game grids on the home page, the games index and "More from inkOrange".
- **Don't use for:** news (use `NewsCard`) or the showcase hero.
- **Props / variants:** `name`, `href`, `cover` (`ImageRef`; `null` shows a `Placeholder` labelled with the name), `status` (`GameStatus`; `out-now` gets the accent chip, everything else ink), `meta` ("Sandbox · Web"), `size`: `m` (default) or `s`.
- **Accessibility:** the whole tile is one link whose name is chip + name + meta. Cover alt text comes from the CMS image. Visible focus ring.

### NewsCard

A card with an image area, a mono "DATE · KIND" line and a headline.

- **Use for:** the news grid on the home page and the news index.
- **Don't use for:** compact lists (use `UpdateRow`).
- **Props / variants:** `href`, `image` (`ImageRef`, `null` shows a `Placeholder`), `date` (ISO, shown as `NOV 5, 2026` in UTC), `kind` (`PostKind`, shown as UPDATE / ANNOUNCEMENT / DEVLOG / PATCH NOTES), `title`.
- **Accessibility:** one link wrapping the card. The date format never depends on server timezone.

### UpdateRow

A ruled row with a mono date column and a semibold headline.

- **Use for:** "Latest updates" lists on a game page.
- **Don't use for:** the main news grid (use `NewsCard`).
- **Props / variants:** `href`, `date` (ISO), `title`. Rows draw a top rule; the last row also draws a bottom rule.
- **Accessibility:** the row is the link. The date column wraps above the headline on narrow screens.

### FeatureList

A numbered, ruled list of features with an accent circle marker.

- **Use for:** the "Features" section of a game page.
- **Don't use for:** short value statements (use `ValueList`).
- **Props / variants:** `items` of `{ title, body }`; numbers `01`, `02`... are generated.
- **Accessibility:** an ordered list; the visual number is `aria-hidden` because the list already numbers itself. Titles are `h3`, so place it under an `h2`.

### FactList

A two-column definition list of label and value.

- **Use for:** the fact sheet in the store card (platform, genre, release).
- **Don't use for:** long text or lists of links.
- **Props / variants:** `items` of `{ label, value }`. Labels use `--color-ink-3`; the list has a top hairline.
- **Accessibility:** a real `dl` with `dt`/`dd` pairs grouped in `div`s.

### Accordion

A single disclosure with a +/- marker.

- **Use for:** phone game-page details and FAQ entries.
- **Don't use for:** primary content that should always be visible.
- **Props / variants:** `title`, `children`, `defaultOpen`.
- **Accessibility:** native `details`/`summary`, so keyboard and screen readers work with no script. The summary is at least `--tap-min` tall. The +/- marker is CSS-generated and decorative.

### InfoCard

A small sand card with a title, a line of copy and an action link.

- **Use for:** the press kit and help cards beside the store card.
- **Don't use for:** primary calls to action (use `Button`).
- **Props / variants:** `title`, `body`, `link` (`{ label, href }`; `http(s):` and `mailto:` render a plain anchor), `layout`: `stack` (default) or `row`.
- **Accessibility:** the link text must describe its destination. Link is `--color-link` on sand and at least `--tap-min` tall.

### CalloutBand

The big accent band with a mono eyebrow, a Display title, body copy and an action slot.

- **Use for:** the one beta / recruiting callout per page.
- **Don't use for:** several per page, or small notices (use `FormMessage` or `InfoCard`).
- **Props / variants:** `eyebrow`, `title`, `body`, `action` (a node, usually a `Button variant="ink"` or an `EmailSignupForm tone="on-accent"`), `paint` (watercolor along the right edge at `--wash-opacity`).
- **Accessibility:** all text is `--color-ink` on the accent. The wash is decorative, low opacity and sits behind the content; do not raise its opacity.

### RichText

Portable Text rendered with the design system's type.

- **Use for:** CMS body copy: news posts, game "About", legal pages.
- **Don't use for:** hand-written UI copy (use `Text` and `Heading`).
- **Props / variants:** `value` (`PortableTextBlock[]`). Supports h2-h4, paragraphs, bullet and numbered lists, blockquote and links. External links open in a new tab with `rel="noopener noreferrer"`; internal links (starting with `/`) use `next/link`.
- **Accessibility:** headings keep their level (h2-h4) so the author controls the outline. Links are `--color-link` and underlined.

### Breadcrumb

A "Games / TerraForge" trail.

- **Use for:** the top of detail pages.
- **Don't use for:** primary navigation (use the site header).
- **Props / variants:** `items` of `{ label, href? }`. The last item is the current page in ink; earlier items are links in `--color-ink-3`.
- **Accessibility:** `nav` labelled "Breadcrumb" containing an ordered list; the last item has `aria-current="page"`. Separators are `aria-hidden`.

### ValueList

Three-up (or fewer) values, each under a 3px ink rule.

- **Use for:** the studio band's "Play first / Smart, not stuffy / Play anywhere".
- **Don't use for:** numbered features (use `FeatureList`).
- **Props / variants:** `items` of `{ title, body }`; columns wrap automatically.
- **Accessibility:** a list; the title is a paragraph, not a heading.

### NavPillBar

The pill-shaped primary navigation for desktop.

- **Use for:** the five site sections (Games, Studio, News, Press, Support), from `src/lib/nav.ts`. `SiteHeader` shows it from `lg` (1024px) up.
- **Don't use for:** in-page filters (use `FilterPills`) or the phone menu (use the sheet in `SiteHeader`).
- **Props / variants:** `active`: a `NavKey`; the active pill is ink with paper text.
- **Accessibility:** a `nav` labelled "Primary"; the active link has `aria-current="page"`. Each link is at least `--tap-min` tall with a visible focus ring.

### SiteHeader

The top bar: logo, nav and the newsletter call to action.

- **Use for:** the top of every page, once.
- **Don't use for:** anything inside a page body.
- **Props / variants:** `active` (a `NavKey`); `variant`: `default` or `game` (phone shows a "‹ Games" back link and the compact logo); `backLink` (`{ label, href }`, defaults to Games). Both layouts are in the markup and CSS switches them at `lg`, so server and client markup match. Below `lg` a menu button opens a dark sheet (`--z-sheet`) with Barlow 34px links and an accent newsletter button. The sheet is a client island, closes if the viewport reaches `lg`, and body scroll is not locked.
- **Accessibility:** the toggle has `aria-expanded` and `aria-controls`. Opening moves focus to the first sheet link; Escape closes and returns focus to the toggle; choosing a link closes the sheet. Focus rings on the dark sheet use the accent color.

### SiteFooter

The ink footer with the newsletter signup, link columns and legal row.

- **Use for:** the bottom of every page, once. Its `id="newsletter"` is where every "Get the newsletter" link lands.
- **Don't use for:** page-level calls to action.
- **Props / variants:** `newsletter` (a node: the signup form); `variant`: `full` (Games / Studio / Help / Follow columns) or `compact` (one row of links, for game pages); `socialLinks` (the Follow column is hidden when empty); `supportEmail` (the "Player support" link is hidden without it); `games` (optional links added to the Games column). Includes a "Cookie settings" button that reopens the consent banner.
- **Accessibility:** column labels are mono eyebrows in `--color-on-dark-4`; links are at least `--tap-min` tall, with accent focus rings.

### ConsentBanner

The cookie consent sheet fixed to the bottom of the viewport.

- **Use for:** once, in the root layout.
- **Don't use for:** other notices (use `FormMessage` or page copy).
- **Props / variants:** none. Shown when no choice is stored (`io-consent` in localStorage) or when "Cookie settings" is clicked. "Accept" (accent) stores `granted`; "Decline" (outline on ink) stores `denied`. `Analytics` loads Google Tag Manager only after `granted`.
- **Accessibility:** a labelled region; it does not steal focus. Sits on `--z-banner`, above everything. When reopened from "Cookie settings" focus moves to the banner; on first visit it does not. Consent Mode defaults (denied) come from the server component `ConsentDefaults` (`src/components/analytics/`), which the root layout renders; `Analytics` loads GTM after consent.

### MediaViewer

The game page's large stage with a thumbnail strip beneath it.

- **Use for:** a game's trailer and screenshots, trailer first.
- **Don't use for:** a single decorative image (use `next/image` in a section) or a carousel that moves on its own (`ShowcaseHero`).
- **Props / variants:** `items` (`Media[]`: `trailer` with `poster`, `url`, optional `duration`; or `image`) and `title`. Stage is 16/7.5 on `--radius-3xl`, 16/10 on `--radius-xl` below `md`. Thumbs are a grid from `md`, a horizontal scroll strip below. Renders nothing when `items` is empty; a single item shows no thumbs. Missing art shows the dark `Placeholder`.
- **Accessibility:** the trailer play button is named `Play the {title} trailer`. Nothing plays until it is pressed; then YouTube and Vimeo URLs become an `iframe` (titled `{title} trailer`) and other URLs a `video` with controls. Switching thumbs stops playback. Thumbs are buttons with `aria-pressed` and `aria-label="Show {label}"`; the selected one has an ink border. The stage is a `figure` whose caption carries the label.

### StoreCard

The game page's "get the game" card.

- **Use for:** price, the main play/store link, the notify-me form and the fact sheet.
- **Don't use for:** other call-out cards (use `InfoCard`).
- **Props / variants:** `priceLabel`, `primary` (`{ label, href }` or `null`; absolute URLs open in a new tab), `notify` (a node, normally `EmailSignupForm`), `notifyTitle`, `facts`. Blocks without data are not rendered, so a sparse game shows only the eyebrow and button. Facts render twice: a `dl` from `lg`, and a "Game details" `Accordion` below `lg`; CSS switches between them.
- **Accessibility:** an `aside` named "Get the game". The hidden rendering is `display: none`, so assistive tech reads the facts once.

### StickyPlayBar

A floating ink pill with the game name and a "Play now" button, phone only.

- **Use for:** the bottom of a phone game page.
- **Don't use for:** desktop (hidden from `lg` up) or general navigation.
- **Props / variants:** `title`, `meta` (for example `Free · Web`), `action` (`{ label, href }`). Sits on `--z-sticky` with the system's one shadow. It overlaps the last `--sticky-bar-space` of the page, so give the page or footer `padding-bottom: var(--sticky-bar-space)` below `lg`.
- **Accessibility:** the action is a real link at least `--tap-min` tall with the accent-on-ink focus ring. Only the pill takes pointer events, so it never blocks content beside it.

Still coming, in this order (names may change as they are built):

- **Game page (coming):** ShareTitle (not yet specified).
- **Home (coming):** ShowcaseHero (carousel), SpotlightRail, GameGrid.
- **Other pages (coming):** LegalEmpty, FaqList, DesignGallery.

Form components that talk to the server (newsletter, beta, launch alert,
contact) live in `src/components/forms/`. They own no SCSS and are built only
from `ui` components.

## Page composition

How to put a page together from the parts above.

- **Pages compose; they don't style.** A file in `src/app/` imports components
  and passes them content. It never imports `.scss`, never sets `className` or
  `style`, and never contains a color or size. If you want something to look
  different, change or add a component.
- **Every public page** renders inside the site layout: `SiteHeader`, then the
  page content, then `SiteFooter`. Content is a stack of
  `Section`s, each wrapping a `Container`, so every page lines up to the same
  `--content-max` column with the same `--gutter`.
- **Section rhythm.** Sections use `--section-y` padding. Most are paper; use a
  sand section to set apart one block (the studio band, "More from inkOrange");
  don't put two sand sections next to each other. Ink is for the showcase hero
  and the footer.
- **Section headers** are a heading with a 2px ink rule under it and an
  optional action link on the right ("All news →"). Use `SectionHeader`; don't
  draw rules by hand.
- **One primary action per view.** The accent `Button` is the main thing to do
  in that part of the screen ("Play free in browser", "Subscribe"). Next to it,
  use the ink or outline variant. Never two accent buttons side by side.
- **One highlight, one callout.** A page has at most one `Highlight` phrase and
  at most one `CalloutBand`.
- **Missing content hides.** If an optional field (price, trailer, screenshots,
  facts, features, release date) is empty, its block and its heading don't
  render. Missing art shows the hatched `Placeholder`. Never show bracketed
  text like `[PRICE]`.
- **Empty states** (no games, no news, Sanity unreachable) render a short
  message in the system's style, never a crash or a blank section.
- **Phone layouts** follow the phone mockups: hamburger + dark menu sheet; the
  hero becomes a stacked card with dots; the game grid is two columns; news
  becomes a horizontal scroller; the game page reorders to media → title and
  CTA → about → features → details accordion → updates → more games → press
  and help cards, with the sticky play bar at the bottom.

## Accessibility

Every page must pass WCAG 2.2 AA.

### Contrast

| Pair | Ratio | Allowed for |
|---|---|---|
| `--color-ink` on `--color-accent` | 6.6:1 | Primary buttons, chips, the callout band. |
| `--color-link` (#9A5200) on `--color-paper` | 5.21:1 | Links and eyebrows. |
| `--color-link` on `--color-sand` | 4.69:1 | Links on sand cards and sections. |
| `--color-ink-3` on `--color-paper` | 5.25:1 | Metadata text. |
| `--color-ink-3` on `--color-sand` | 4.73:1 | Metadata text on sand. |
| `--color-ink-2` on `--color-sand` | 7.59:1 | Body copy on sand. |
| `--color-on-dark-4` (#A39A8C) on `--color-ink` | 6.25:1 | Quiet labels on dark surfaces. |
| `--color-ink-4` on `--color-paper` | 3.28:1 | **Decorative and placeholder labels only.** Fails AA for text, so never use it for anything a reader needs. |

Everything else in the [Pairings](#pairings) list is higher than these (ink on
paper is about 15:1). If you introduce a new pair, check it and add it here.

### Focus

- Every interactive element shows a visible focus ring on `:focus-visible`. The
  default comes from `globals.scss` via the `focus-ring` mixin: a
  `--focus-ring-width` outline in `--color-ink`, offset by `--focus-ring-offset`.
- On dark surfaces, components switch the outline color to `--color-accent` so
  it stays visible. The default ink ring already reads on paper, sand, card and
  the accent.
- Never remove an outline without replacing it.

### Interaction

- **Tap targets** are at least `--tap-min` (44px) in both directions, including
  text links in lists, carousel dots and chips that act as buttons.
- Use real `<button>` for actions and `<a>` for navigation. Icon-only buttons
  need an `aria-label` ("Previous featured game", "Open menu").
- Every form field has a label. If the design hides it, use the
  `visually-hidden` mixin, never a placeholder alone.
- The phone menu sheet closes on Escape and returns focus to the menu button.
  Toggles expose `aria-expanded`; selected thumbnails and filters expose
  `aria-pressed` or `aria-current`.
- Carousels never auto-advance. Video never autoplays.
- Decorative art (`GuideLines`, unlabeled `Placeholder`) is `aria-hidden`.
  Real images get meaningful `alt` text.
- Sections that act as landmarks get an `aria-label` ("Featured games",
  "Trailer and screenshots").

### Reduced motion

Respect `prefers-reduced-motion: reduce` (see [Motion](#motion)).

## Enforcement

These rules are checked automatically by `npm run lint` (ESLint, then
Stylelint on `src/**/*.scss`) and `npm test`. Run both (and
`npm run typecheck`) before every commit; CI runs them too. A failing check is
a bug in the change, not in the rule. Config lives in `stylelint.config.mjs`
and `eslint.config.mjs`; `tests/enforcement/stylelint.test.ts` and
`eslint.test.ts` prove each rule with fixtures.

**Reading an error.** Every message ends in `(see DESIGN.md#enforcement)`.
Stylelint names the property and value, e.g. `Use a design token via var(--…)
for "padding", not "12px"`, plus the rule name in brackets. Fix it by using the
token from the tables above, not by disabling the rule.

### Stylelint (`src/**/*.{scss,css,sass}`)

Config: `stylelint-config-standard-scss` plus
`stylelint-declaration-strict-value` (rule
`scale-unlimited/declaration-strict-value`).

- **No raw colors** (`color-no-hex`, `color-named`, `function-disallowed-list`).
  Hex colors, named colors and the functions `rgb()`, `rgba()`, `hsl()`,
  `hsla()`, `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` and
  `color-mix()` are errors everywhere except `src/styles/tokens.scss`. This includes `globals.scss`.
- **Strict values** (`scale-unlimited/declaration-strict-value`). These
  properties must use `var(--…)`: anything ending in `color`, `fill`, `stroke`,
  `background`, `background-color`, `font-size`, `font-family`, `font-weight`,
  `line-height`, `letter-spacing`, `border-radius`, `gap`, `row-gap`,
  `column-gap`, every `margin*` and `padding*`, `box-shadow`, `z-index`,
  `transition-duration` and `animation-duration`. Shorthands are expanded and
  checked. The only raw values allowed are `0`, `auto`, `inherit`, `initial`,
  `unset`, `none`, `transparent`, `currentColor` and `100%`. `tokens.scss` is
  exempt. `globals.scss` needs no exemption: it passes as written.
- **No literal units inside functions** (`declaration-property-unit-disallowed-list`).
  On the same spacing, type, radius, shadow and duration properties (everything
  in the list above except colors, `font-family`, `font-weight` and `z-index`),
  `px`, `rem`, `em`, `ms` and `s` are errors, so `calc(12px * 2)`,
  `min(10px, 2vw)` and `clamp(1rem, 2vw, 3rem)` fail while
  `calc(var(--space-4) * 2)` passes. `tokens.scss` is exempt.
- **Unknown pseudo-classes** are errors, except `:global()` and `:local()`.
- **Disables must be justified.** `reportDescriptionlessDisables` and
  `reportNeedlessDisables` are on: an inline disable needs a `-- reason` and
  must actually suppress something.
- **No Sass `$variables`** (`scss/dollar-variable-pattern`) outside
  `src/styles/_mixins.scss` and `src/styles/tokens.scss` (function internals
  only). Values come from CSS custom properties in `tokens.scss`.
- **No `@import`** (`at-rule-disallowed-list`). Use `@use`.
- **`tokens.scss` also skips** the stylistic color-notation and
  keyword-case rules (`color-function-notation`, `color-function-alias-notation`,
  `alpha-value-notation`, `value-keyword-case`), since raw values and font names
  live there.
- Rare, justified escapes use an inline
  `/* stylelint-disable-next-line <rule> -- reason */`. Only two exist:
  the negative margin and deprecated `clip` in the `visually-hidden` mixin, and
  the vendor-prefixed `-webkit-text-size-adjust` in `globals.scss`.
- Properties the linter doesn't check still follow the spirit: if a size is a
  design decision (a card min-width, a media height), make it a token. Plain
  geometry such as `1fr`, `aspect-ratio: 3 / 4` and 1–3px border widths is
  fine inline.

### ESLint (`*.ts`, `*.tsx`)

All selectors are `no-restricted-syntax` (plus `no-restricted-imports` for
pages), defined once in `eslint.config.mjs` and shared between blocks.

- **No inline styles.** A `style` prop is an error, with one escape hatch in
  components: an object whose keys are all CSS custom properties, e.g.
  `style={{ "--progress": "40%" }}`, so a component can pass a runtime value to
  its own SCSS. A non-object value (`style={props.s}`) is an error.
- **No raw color literals** (`"#E08D00"`, `"rgb(…)"`, `"hsl(…)"`) in
  `src/**/*.{ts,tsx}`. Test files (`*.test.ts`, `*.test.tsx`) and everything in
  `tests/` are exempt because fixtures and token tests need literals.
- **Pages don't style.** Files in `src/app/**` may not import any `.scss`, `.sass` or
  `.css` file, query suffixes included (`no-restricted-imports`) and may not use `className` or `style` at
  all.
- **Exemptions:** `src/app/layout.tsx` may import `@/styles/globals.scss` and
  may set `className` on `<html>` for the font variables (it still may not use
  `style` or import any other stylesheet). `src/app/studio/**` (Sanity's own UI)
  and `sanity.config.ts` are ignored by ESLint entirely.
- `node_modules/`, `.next/`, `.superpowers/` and `docs/` are not linted.

### What lint can't catch (reviewers check)

- `className` or `style` smuggled into pages through spread props
  (`{...props}`) or `React.createElement`.
- Color strings built with template literals (`` `#${hex}` ``).
- Properties outside the checked list: `width`, `height`, `inset`, `top`,
  `min-width` and the like. Make design-decision sizes tokens anyway.

### Tests (`tests/enforcement/`)

- `tokens.test.ts` checks the required tokens exist, the accent is `#E08D00`,
  `tokens.scss` compiles, fluid sizes are `clamp()` in rem, and every duration
  is `0ms` under reduced motion.
- `design-doc-sync.test.ts` checks that the set of tokens defined in
  `tokens.scss` is exactly the set of tokens written in backticks in this file,
  that this file has all its sections, and that every folder in
  `src/components/ui/` has a `### FolderName` heading here.

## Adding a token or component

### A new token

1. Check the tables above first. Most "new" values are an existing token used
   for a slightly different role. Reuse beats a near-duplicate.
2. Add it to `src/styles/tokens.scss` in the right group, named by role
   (`--color-…`, `--text-…`, `--space-…`, `--radius-…`, `--duration-…`,
   `--z-…`). For a size that differs between phone and desktop, use
   `fluid(phone-px, desktop-px)` rather than two tokens.
3. Add a row for it in the matching table in this file, with its name in
   backticks and what it's for. The sync test fails until you do, and fails if
   you leave a row for a token you removed.
4. If it's a color that carries text, add its contrast to the
   [Contrast](#contrast) table.
5. Run `npm test`.

### A new component

1. Make sure no existing component (or a new variant of one) already does the
   job. A variant is better than a near-copy.
2. Create `src/components/ui/<Name>/` with `<Name>.tsx`, `<Name>.module.scss`
   and `<Name>.test.tsx`. Style only with tokens and the mixins
   (`@use "../../../styles/mixins" as *;` at the top of the module).
3. Export it from `src/components/ui/index.ts`.
4. Add a `### <Name>` section under [Components](#components) using the shape
   shown there, and remove it from the "coming" list. The heading must match the
   folder name exactly.
5. Add it to the `/design` gallery page so it can be seen in every variant.
6. Run `npm test`, `npm run lint` and `npm run typecheck`.

If a page needs something the system can't express, stop and extend the system
here. Don't work around it in the page.
