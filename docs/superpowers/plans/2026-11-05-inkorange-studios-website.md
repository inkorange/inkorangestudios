# inkOrange Studios Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build inkorangestudios.com, a Next.js site matching the "D · Light — warm paper" mockups, on an enforced in-repo SCSS design system, with content from Sanity and signups/contact stored in Supabase and mailed via Postmark.

**Architecture:** Next.js 16 App Router. `src/styles/tokens.scss` holds every raw value as a CSS custom property; `src/components/ui/*` are the only files that write SCSS; pages in `src/app/**` compose components and cannot import SCSS or set `className`/`style` (Stylelint + ESLint enforce this, and fixture tests prove the rules bite). Content is fetched from Sanity (shared project/dataset, `studio*` types, own Studio workspace at `/studio`); four server actions write to `studio_*` Supabase tables with the planet-builder signup pattern.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, Sass (CSS Modules), next-sanity 13 / sanity 6, @supabase/supabase-js, Postmark HTTP API, Cloudflare Turnstile, @next/third-parties (GTM), zod 4, Vitest + Testing Library, Stylelint 18, ESLint (flat config).

**Spec:** `docs/superpowers/specs/2026-11-05-inkorange-studios-website-design.md` — read it before any task. Mockup source of truth: Claude design artifact `0981a66f-4107-4c83-91dd-599d7aed0b2f`, files `project/LightHome.dc.html`, `project/LightTerraForge.dc.html`, `project/LightHomePhone.dc.html`, `project/LightTerraForgePhone.dc.html` (read with the claude-artifacts `read_file` tool). Brand motif reference: `~/web/planet-builder/src/app/(explorer)/assets/inkorange_studios_intro.mp4`.

## Global Constraints

- No Tailwind, no CSS-in-JS, no utility-class libraries, no SpaceUI. Native SCSS, one `.module.scss` per component.
- Raw color/size/font values exist only in `src/styles/tokens.scss`. Everything else uses `var(--…)`.
- `src/app/**` files may not import `.scss` (except `src/app/layout.tsx` importing `@/styles/globals.scss`) and may not use `className` or `style`.
- Accent is `#E08D00` (sampled from `public/brand/inkorange-logo.png`), used for logo and UI alike.
- Ink-4 `#8C8478` on paper is 3.28:1 — decorative/placeholder labels only, never body text.
- Node `>=22` (`engines` in package.json; Vercel runs 24). npm. TypeScript strict.
- Sanity: same project + dataset as `~/web/portfolio`; document types prefixed `studio`; Studio `name: "inkorange"`, `basePath: "/studio"`. Never run `sanity schema deploy` / `sanity deploy` without checking the portfolio's deployed workspaces first.
- Supabase: shared project. Tables prefixed `studio_`. RLS on, no policies, `grant all … to service_role` only. Migrations applied **by hand**, never `supabase db push`.
- Duplicate signups are a silent success; never reveal whether an email is on a list.
- A Postmark failure or missing Postmark env never fails a submission; a Supabase write failure always does.
- Notification email to `FEEDBACK_NOTIFY_EMAIL` (= thrillgraphics@gmail.com), `ReplyTo` = submitter, `MessageStream: "outbound"`.
- Bracketed mockup placeholders (`[PRICE]`, `[RELEASE DATE]`, `[SUPPORT EMAIL]`, …) are never rendered; empty optional fields hide their UI.
- Privacy/Terms/FAQ copy is supplied by Chris; ship templates + empty states only, no drafted legal text.
- GTM loads only after consent (Consent Mode v2 defaults denied).
- All motion is disabled under `prefers-reduced-motion: reduce`. No autoplaying carousel or video.
- Tap targets ≥ 44px; visible focus ring on every interactive element.

## Review Focus

1. **Email casing/whitespace** — `" Name@Gmail.com "` and `"name@gmail.com"` are the same signup (one row, one notification). Test in Task 14.
2. **Second signup with the same email** — returns `{ ok: true }` and sends no second email. Test in Task 15.
3. **Sparse Sanity game** — a game with no price, trailer, screenshots, facts, features, or notify-platform renders its page without empty headings or bracket text. Test in Task 13 (mapper) and Task 18 (page).
4. **No content at all** (Sanity empty or unreachable at build) — home and game index still render with an empty state instead of crashing the build. Test in Task 13.
5. **Keyboard / reduced motion** — phone menu sheet closes on Escape and returns focus to the toggle; carousel never auto-advances. Test in Task 9 and Task 11.

---

## File Structure

```
DESIGN.md                         design system rules (Task 3)
CLAUDE.md, AGENTS.md              point agents at DESIGN.md + spec (Task 1)
.env.example                      all env var names (Task 1)
stylelint.config.mjs              SCSS enforcement (Task 4)
eslint.config.mjs                 TSX enforcement (Task 4)
sanity.config.ts, sanity.cli.ts   Studio workspace "inkorange" (Task 12)
public/brand/                     logo png (+ svg if traced), watercolor texture (Task 2)
supabase/migrations/0001_studio_signups.sql   (Task 14)
scripts/seed-sanity.mjs           seed games/settings from mockups (Task 21)
src/styles/tokens.scss | globals.scss | _mixins.scss
src/components/ui/<Name>/<Name>.tsx + <Name>.module.scss + <Name>.test.tsx
src/components/forms/             client form wrappers bound to server actions (Task 16)
src/lib/env.ts                    typed env reader
src/lib/sanity/                   client, image, queries, mappers, types
src/lib/supabase/server.ts        service client
src/lib/signups/                  validate, turnstile, notify, store
src/app/actions/                  newsletter, beta, launchAlert, contact
src/app/                          routes (Tasks 17–20)
tests/enforcement/                lint fixture tests + token/doc sync (Tasks 3–4)
```

---

### Task 1: Scaffold the app

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `.env.example`, `.nvmrc` (`24`), `CLAUDE.md`, `AGENTS.md`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/lib/env.ts`
- Test: `src/lib/env.test.ts`

**Interfaces:**
- Produces: `readServerEnv(): ServerEnv` and `publicEnv` in `src/lib/env.ts`, where `ServerEnv = { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; SANITY_API_TOKEN?: string; POSTMARK_SERVER_TOKEN?: string; FEEDBACK_FROM_EMAIL?: string; FEEDBACK_NOTIFY_EMAIL?: string; TURNSTILE_SECRET_KEY?: string; SANITY_REVALIDATE_SECRET?: string }` and `publicEnv = { siteUrl: string; sanityProjectId: string; sanityDataset: string; turnstileSiteKey?: string; gtmId?: string }`. `siteUrl` defaults to `https://inkorangestudios.com`; `sanityDataset` defaults to `"production"`.

- [ ] **Step 1:** `git checkout -b feat/site` (repo is on `main` with no commits — first commit the spec, plan and `public/brand/inkorange-logo.png` on `main`, then branch).
- [ ] **Step 2:** Create the app with `npx create-next-app@16 . --ts --eslint --app --src-dir --import-alias "@/*" --no-tailwind --use-npm --turbopack --yes` (if it refuses a non-empty dir, scaffold in a temp dir and move files in). Delete the starter CSS/SVGs. Add `"engines": { "node": ">=22" }`. Install `sass server-only zod` and dev deps `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`. Scripts: `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`, `"lint": "eslint && stylelint \"src/**/*.scss\""` (stylelint added in Task 4).
- [ ] **Step 3:** Write `src/lib/env.test.ts`: `publicEnv.siteUrl` is `"https://inkorangestudios.com"` when `NEXT_PUBLIC_SITE_URL` unset; `readServerEnv()` throws a message naming `SUPABASE_SERVICE_ROLE_KEY` when it is missing; optional vars come back `undefined`, not `""`.
- [ ] **Step 4:** Run `npm test` → FAIL (module missing). Implement `src/lib/env.ts`. Run → PASS.
- [ ] **Step 5:** `.env.example` lists, with comments: `NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN, SANITY_REVALIDATE_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POSTMARK_SERVER_TOKEN, FEEDBACK_FROM_EMAIL, FEEDBACK_NOTIFY_EMAIL=thrillgraphics@gmail.com, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, NEXT_PUBLIC_GTM_ID`. Copy real values for the shared ones from `~/web/portfolio/.env.local` into `.env.local` (gitignored) — never print them.
- [ ] **Step 6:** `CLAUDE.md` and `AGENTS.md` (same content): read `DESIGN.md` before any UI work; pages compose `src/components/ui` only; the enforcement rules; Supabase migrations applied by hand to the shared project; Sanity types prefixed `studio`, never deploy schema blindly; link the spec and this plan.
- [ ] **Step 7:** `npm run build` succeeds; commit `chore: scaffold Next.js app`.

### Task 2: Tokens, globals, fonts, brand assets

**Files:**
- Create: `src/styles/tokens.scss`, `src/styles/globals.scss`, `src/styles/_mixins.scss`, `src/app/fonts.ts`, `public/brand/watercolor-wash.webp`
- Modify: `src/app/layout.tsx`
- Test: `tests/enforcement/tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties below; Sass mixins `@include bp(md|lg)` (min-width 720px / 1024px), `@include focus-ring`, `@include visually-hidden`, `@include reduced-motion { … }`; `fonts.ts` exports `display` (Barlow Condensed 600/700/800), `sans` (Inter 400/500/600), `mono` (JetBrains Mono 400/500) via `next/font/google`, each with a `variable` (`--font-display-face`, `--font-sans-face`, `--font-mono-face`).

Token names (values from the spec's Design system section; normalize the type scale with `clamp()` between the phone and desktop sizes in the mockups):

```
color:   --color-paper #F6F1E7  --color-card #FFFDF8  --color-sand #EDE5D6  --color-stripe #E6DCCB
         --color-line #DDD3C2  --color-line-strong #CFC4B1
         --color-ink #1C1A17  --color-ink-2 #4A453E  --color-ink-3 #6B6358  --color-ink-4 #8C8478
         --color-accent #E08D00  --color-link #9A5200
         --color-on-dark #F6F1E7  --color-on-dark-2 #D9D1C4  --color-on-dark-3 #C9C0B2  --color-on-dark-4 #A39A8C
         --color-dark-line #3A362F  --color-dark-line-2 #5A544B  --color-dark-line-3 #6B6358
         --color-dark-stripe #2A2722  --color-dark-stripe-2 #24211D
         --color-guide #B9C4CC (construction guide-lines, intro motif)  --color-shadow rgba(28,26,23,.25)
font:    --font-display --font-sans --font-mono (stacks using the face vars)
         --text-display-xl (68→112) --text-display-l (44→72) --text-display-m (40→64) --text-heading-l (34→56)
         --text-heading-m (34→44) --text-heading-s (26→36) --text-title (20→28) --text-title-s (20→22)
         --text-lead (17→21) --text-body-l (16→18) --text-body (15→17) --text-body-s (14→15) --text-meta (13→14)
         --text-mono (12→13) --text-mono-s (11→12) --text-mono-xs (10→11)
         --weight-regular 400 --weight-medium 500 --weight-semibold 600 --weight-bold 700 --weight-black 800
         --leading-tight .86 --leading-snug 1 --leading-normal 1.3 --leading-body 1.6 --leading-loose 1.7
         --tracking-mono .1em --tracking-eyebrow .14em --tracking-wordmark .06em
space:   --space-1 4px … --space-2 8 --space-3 12 --space-4 16 --space-5 20 --space-6 24 --space-7 28
         --space-8 32 --space-10 40 --space-12 48 --space-14 56 --space-16 64 --space-18 72 --space-22 88 --space-24 96
         --section-y (48→96)  --gutter (16→24)  --content-max 1320px
radius:  --radius-xs 10px --radius-s 14px --radius-m 16px --radius-l 18px --radius-xl 20px
         --radius-2xl 24px --radius-3xl 28px --radius-pill 999px
size:    --tap-min 44px --icon-button 48px --control-height 48px
motion:  --duration-fast 120ms --duration-base 200ms --duration-slow 600ms --duration-draw 1200ms
         --ease-standard cubic-bezier(.2,.7,.2,1) --ease-out cubic-bezier(0,0,.2,1)
layer:   --z-sticky 10 --z-header 20 --z-sheet 30 --z-banner 40
```

- [ ] **Step 1:** Write `tests/enforcement/tokens.test.ts`: parse `tokens.scss` with a regex for `--[a-z0-9-]+\s*:`; assert every name in the list above exists, and `--color-accent` equals `#E08D00`.
- [ ] **Step 2:** Run → FAIL. Write `tokens.scss` (all under `:root`; `@media (prefers-reduced-motion: reduce)` sets durations to `0ms`). Run → PASS.
- [ ] **Step 3:** `globals.scss`: modern reset, `body` paper background/ink text/`--font-sans`, `a` ink with `--color-link` hover (from mockups), `::selection` accent, `:focus-visible` uses the focus-ring mixin (2px ink outline, 2px offset; on dark surfaces components override to accent). Wire fonts + globals in `layout.tsx` (`<html lang="en">`).
- [ ] **Step 4:** Create `watercolor-wash.webp`: a tileable orange/red watercolor texture (generate with the `imagegen` skill, ~1600px, compressed < 150 KB). It's referenced only via a token `--texture-watercolor: url("/brand/watercolor-wash.webp")`.
- [ ] **Step 5:** `npm run build` passes; commit `feat(design): tokens, globals, fonts`.

### Task 3: DESIGN.md and the doc/token sync test

**Files:**
- Create: `DESIGN.md`
- Test: `tests/enforcement/design-doc-sync.test.ts`

**Interfaces:**
- Consumes: `tokens.scss` (Task 2).
- Produces: `DESIGN.md` sections: Principles · Brand motif · Color · Typography · Spacing & layout · Radius · Motion · Layers · Components (one subsection per component, added as each component lands) · Page composition · Accessibility · Enforcement · Adding a token or component.

- [ ] **Step 1:** Write the sync test: the set of `--token` names in `tokens.scss` equals the set of backticked `` `--token` `` names in `DESIGN.md`; and every folder in `src/components/ui/` has a `### <FolderName>` heading in `DESIGN.md`.
- [ ] **Step 2:** Run → FAIL. Write `DESIGN.md` per the spec (principles: warm paper, ink, one accent; condensed uppercase display; mono for metadata; pills; sketch → shade → paint → digital motif with the usage rules from the spec; contrast table from the plan's Global Constraints; enforcement rules with the exact lint behavior from Task 4). Run → PASS.
- [ ] **Step 3:** Commit `docs(design): DESIGN.md`.

### Task 4: Enforcement — Stylelint + ESLint, proven by fixtures

**Files:**
- Create: `stylelint.config.mjs`, `tests/enforcement/stylelint.test.ts`, `tests/enforcement/eslint.test.ts`
- Modify: `eslint.config.mjs`, `package.json`

**Interfaces:**
- Produces: `npm run lint` fails on any violation; rule set referenced by DESIGN.md.

Stylelint (`stylelint-config-standard-scss` + `stylelint-declaration-strict-value`):

```js
// stylelint.config.mjs (key decisions)
rules: {
  "color-no-hex": true,
  "color-named": "never",
  "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla"],
  "scale-unlimited/declaration-strict-value": [
    ["/color$/", "fill", "stroke", "background", "background-color", "font-size", "font-family",
     "font-weight", "line-height", "letter-spacing", "border-radius", "gap", "row-gap", "column-gap",
     "/^margin/", "/^padding/", "box-shadow", "z-index", "transition-duration", "animation-duration"],
    { ignoreValues: ["0", "auto", "inherit", "initial", "unset", "none", "transparent", "currentColor", "100%"],
      expandShorthand: true, disableFix: true }
  ],
  // Sass $variables are banned outside _mixins.scss — values come from tokens:
  "scss/dollar-variable-pattern": ["^_never_$", { message: "Use CSS variables from tokens.scss (DESIGN.md#enforcement)" }],
  "at-rule-disallowed-list": ["import"], // use @use
},
overrides: [
  { files: ["src/styles/tokens.scss"], rules: { "color-no-hex": null, "function-disallowed-list": null, "scale-unlimited/declaration-strict-value": null } },
  { files: ["src/styles/_mixins.scss"], rules: { "scss/dollar-variable-pattern": null } },
],
// every rule's message points to DESIGN.md#enforcement
```

ESLint (flat config, appended to the Next config):

```js
// for **/*.{ts,tsx}
"no-restricted-syntax": ["error",
  { selector: "JSXAttribute[name.name='style'] Property > Identifier.key", message: "No inline styles. Use a component (DESIGN.md#enforcement)." },
  { selector: "JSXAttribute[name.name='style'] Property > Literal.key[value!=/^--/]", message: "Only CSS custom properties may be passed via style." },
  { selector: "JSXAttribute[name.name='style'] > JSXExpressionContainer > :not(ObjectExpression)", message: "No inline styles." },
  { selector: "Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]", message: "No raw colors; use tokens." },
  { selector: "Literal[value=/^(rgb|hsl)a?\\(/]", message: "No raw colors; use tokens." }],
// for src/app/**/*.{ts,tsx} additionally (flat config REPLACES a rule per file block, so re-list the base selectors)
"no-restricted-imports": ["error", { patterns: [{ group: ["*.scss", "*.css"], message: "Pages compose components; they don't style." }] }],
"no-restricted-syntax": [...above, { selector: "JSXAttribute[name.name='className']", message: "Pages may not set className; use a component." },
                                   { selector: "JSXAttribute[name.name='style']", message: "Pages may not set style." }],
// override for src/app/layout.tsx: allow importing "@/styles/globals.scss" (className allowed for font variables on <html>)
// ignores: sanity.config.ts, src/app/studio/** (Sanity's own UI)
```

- [ ] **Step 1:** Write `stylelint.test.ts` using `stylelint.lint({ code, codeFilename, config })`: `.a{color:#fff}` in `src/components/ui/X/X.module.scss` → errored; `.a{padding:12px}` → errored; `.a{border-radius:var(--radius-m);color:var(--color-ink)}` → clean; `$x: 1px;` → errored; `:root{--color-ink:#1C1A17}` in `src/styles/tokens.scss` → clean.
- [ ] **Step 2:** Write `eslint.test.ts` using `new ESLint({ cwd })` + `lintText(code, { filePath })`: `<div style={{color:"red"}}/>` in a ui component → error; `<div style={{"--progress": "40%"}}/>` in a ui component → clean; `<p className="x"/>` in `src/app/about/page.tsx` → error; `import s from "./a.module.scss"` in `src/app/page.tsx` → error; `const c = "#E08D00"` anywhere in `src/` → error; `import "@/styles/globals.scss"` in `src/app/layout.tsx` → clean.
- [ ] **Step 3:** Run both → FAIL. Install `stylelint stylelint-config-standard-scss stylelint-declaration-strict-value`, write configs. Run → PASS. `npm run lint` passes on the repo.
- [ ] **Step 4:** Add the exact rule behavior to `DESIGN.md#enforcement` (sync test still passes). Commit `feat(design): enforce design system with stylelint + eslint`.

### Task 5: Layout and type primitives

**Files (each with `.tsx`, `.module.scss`, `.test.tsx`; add a `### Name` section to DESIGN.md):**
- Create: `src/components/ui/{Container,Section,Stack,Grid,Display,Heading,Text,Eyebrow,Logo,Placeholder,GuideLines}/`
- Create: `src/components/ui/index.ts` (barrel)

**Interfaces (Produces):**
- `Container({ children, width?: "content" | "narrow" })` — max `--content-max` (narrow = 760px token `--content-narrow`, add to tokens + DESIGN.md), gutters `--gutter`.
- `Section({ tone?: "paper" | "sand" | "ink", space?: "default" | "tight" | "none", id?, "aria-label"?, children })`.
- `Stack({ gap?: 1|2|3|4|5|6|8|10|12|14|16, direction?: "column" | "row", align?, justify?, wrap?: boolean, as?, children })` and `Grid({ min: "tile" | "tile-s" | "card" | "rail" | "thumb", gap?, children })` (min widths 260/240/300/240/150px as tokens `--grid-min-*`).
- `Display({ as?: "h1"|"h2", size: "xl"|"l"|"m", tone?: "ink"|"on-dark", children })`, `Heading({ as: "h2"|"h3", size: "l"|"m"|"s"|"title"|"title-s", children })`, `Text({ as?: "p"|"span"|"div", size?: "lead"|"body-l"|"body"|"body-s"|"meta", tone?: "ink"|"ink-2"|"ink-3"|"on-dark"|"on-dark-2"|"on-dark-3", weight?: "regular"|"medium"|"semibold", children })`, `Highlight({ children })` (accent background run inside Display — the "make you think." treatment, optional watercolor texture via `paint` prop) exported from Display.
- `Eyebrow({ tone?: "ink-3"|"link"|"on-dark-4", children })` — mono, tracked, uppercase.
- `Logo({ size?: "s"|"m"|"l", href?: string, animate?: boolean })` — `next/image` of `/brand/inkorange-logo.png` with `alt="inkOrange Studios"`; when `animate`, a one-time draw-on reveal (clip/opacity steps echoing sketch → paint → digital) gated by reduced-motion.
- `Placeholder({ tone?: "light"|"dark", ratio?: "3/4"|"16/9"|"16/7.5"|"16/10"|"1/1", label?: string, radius?: "l"|"xl"|"2xl"|"3xl"|"none" })` — the hatched stripe from the mockups; label in mono `--color-ink-4`, `aria-hidden` unless label given.
- `GuideLines({ children })` — decorative wrapper drawing faint `--color-guide` construction lines behind children, `aria-hidden` lines.

- [ ] **Step 1:** Tests: `Display` renders the requested element with `data-size`; `Text` defaults to `<p>`; `Logo` renders an image with alt `inkOrange Studios` and wraps in a link when `href` given; `Placeholder` is `aria-hidden="true"` with no label and exposes the label text when given; `Section tone="ink"` sets `data-tone="ink"`.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS. `npm run lint` passes. DESIGN.md sync passes.
- [ ] **Step 3:** Commit `feat(ui): layout and type primitives`.

### Task 6: Actions — Button, IconButton, Chip, FilterPills

**Files:** `src/components/ui/{Button,IconButton,Chip,FilterPills}/` (+ tests, DESIGN.md sections), `src/components/ui/Icon/Icon.tsx` (inline SVG set from the mockups: chevron-left, chevron-right, play, globe, phone, menu, close, arrow-right).

**Interfaces (Produces):**
- `Button({ variant: "accent"|"ink"|"outline"|"outline-on-dark"|"on-light", size?: "m"|"l"|"s", href?: string, external?: boolean, block?: boolean, icon?: IconName, type?, onClick?, disabled?, children })` — renders `next/link` for internal `href`, `<a target="_blank" rel="noopener">` for external, else `<button type="button">` by default. Pill radius. Accent variant has the gloss-sweep hover (reduced-motion off).
- `IconButton({ icon: IconName, label: string, tone?: "light"|"dark", size?: "m"|"l", onClick?, "aria-expanded"?, "aria-controls"? })` — round, `aria-label={label}`.
- `Chip({ tone: "accent"|"ink"|"outline"|"outline-on-dark"|"plain-on-dark", size?: "s"|"m", children })` — mono tracked uppercase.
- `FilterPills<T extends string>({ options: readonly T[], value: T, onChange(v: T): void, label: string })` — `role="radiogroup"`-free: buttons with `aria-pressed`.
- `Icon({ name: IconName, size?: 16|18|20|26|34 })`, `type IconName`.

- [ ] **Step 1:** Tests: `Button href="/about"` renders an anchor to `/about`; `href="https://www.terraforgeworlds.com" external` has `target="_blank"` and `rel` containing `noopener`; no `href` renders `<button type="button">`; `IconButton` exposes its label as accessible name; `FilterPills` marks the current option `aria-pressed="true"` and calls `onChange("Out now")` on click.
- [ ] **Step 2:** FAIL → implement → PASS → lint → commit `feat(ui): buttons, chips, filter pills`.

### Task 7: Form controls

**Files:** `src/components/ui/{TextField,TextArea,FormMessage,EmailSignupForm,Turnstile}/`

**Interfaces (Produces):**
- `TextField({ label: string, hideLabel?: boolean, name, type?: "email"|"text", placeholder?, required?, tone?: "on-light"|"on-dark"|"on-card", size?: "m"|"s", error?: string, autoComplete? })` — pill input; label visually hidden when `hideLabel`.
- `TextArea({ label, name, rows?, required?, error? })`.
- `FormMessage({ status: "success"|"error", children })` — `role="status"` for success, `role="alert"` for error.
- `EmailSignupForm({ action: (prev: FormState, data: FormData) => Promise<FormState>, label: string, placeholder: string, submitLabel: string, tone: "on-dark"|"on-card"|"on-accent", layout?: "inline"|"stacked", hidden?: Record<string, string>, successMessage: string })` — client component using `useActionState`; includes `<Turnstile />` and hidden fields; disables submit while pending; on success replaces the form with `FormMessage`.
- `type FormState = { status: "idle" } | { status: "ok" } | { status: "error"; error: string }` exported from `src/lib/signups/types.ts` (create here; Task 14 consumes).
- `Turnstile()` — renders the Cloudflare widget (`https://challenges.cloudflare.com/turnstile/v0/api.js`, `data-response-field-name="captchaToken"`) only when `CAPTCHA_REQUIRED` (see Task 14; create `src/lib/signups/captchaEnabled.ts` here, copied from planet-builder `src/lib/feedback/captchaEnabled.ts`).

- [ ] **Step 1:** Tests: `TextField hideLabel` still has an accessible name; `EmailSignupForm` with an action resolving `{status:"ok"}` shows `successMessage` after submit; resolving `{status:"error",error:"Nope"}` shows `Nope` in an alert and keeps the input; hidden fields are submitted (assert the action receives `FormData` with `game=space-cowboy`).
- [ ] **Step 2:** FAIL → implement → PASS → lint → commit `feat(ui): form controls`.

### Task 8: Content blocks

**Files:** `src/components/ui/{SectionHeader,GameTile,NewsCard,UpdateRow,FeatureList,FactList,Accordion,InfoCard,CalloutBand,RichText,Breadcrumb,ValueList}/`

**Interfaces (Produces):** (all props are plain data; images are `{ src: string; alt: string; width: number; height: number } | null`, type `ImageRef` in `src/lib/sanity/types.ts` — create the type file here)
- `SectionHeader({ title: string, as?: "h1"|"h2", size?: "l"|"m", action?: { label: string; href: string }, children? /* e.g. FilterPills */, rule?: boolean })` — 2px ink bottom rule by default.
- `GameTile({ name, href, cover: ImageRef, status: GameStatus, meta: string, size?: "m"|"s" })` — cover 3:4 or `Placeholder` with `[NAME COVER ART]`-free label (label = name); status chip accent when `out-now`, ink otherwise.
- `type GameStatus = "out-now"|"coming-soon"|"in-development"|"announcing-soon"`, `statusLabel(s: GameStatus, short?: boolean): string` → `OUT NOW / COMING SOON / IN DEVELOPMENT / ANNOUNCING SOON` (short: `OUT NOW / SOON / IN DEV / TBA`) in `src/lib/games.ts`.
- `NewsCard({ href, image: ImageRef, date: string /* ISO */, kind: PostKind, title })` — date formatted `MMM D, YYYY` uppercase mono.
- `UpdateRow({ href, date, title })`; `FeatureList({ items: { title: string; body: string }[] })` numbered `01…`; `FactList({ items: { label: string; value: string }[] })` as `<dl>`; `Accordion({ title, children, defaultOpen? })` using `<details>/<summary>` with +/− marker; `InfoCard({ title, body, link: { label, href } , layout?: "stack"|"row" })` on sand; `CalloutBand({ eyebrow, title, body, action: ReactNode })` accent background with optional watercolor texture edge; `RichText({ value: PortableTextBlock[] })` with `@portabletext/react`, styled headings/lists/links; `Breadcrumb({ items: { label; href? }[] })`; `ValueList({ items: { title; body }[] })` (the 3-column "Play first" rule list).

- [ ] **Step 1:** Tests: `GameTile status="out-now"` shows chip `OUT NOW` with `data-tone="accent"`, `coming-soon` → `data-tone="ink"`; `GameTile` with `cover: null` renders a Placeholder; `FeatureList` numbers items `01`, `02`; `FactList` renders `dt`/`dd` pairs; `Accordion` toggles open on summary click; `statusLabel("in-development", true) === "IN DEV"`; `NewsCard` formats `2026-11-05` as `NOV 5, 2026 · UPDATE`.
- [ ] **Step 2:** FAIL → implement → PASS → lint → commit `feat(ui): content blocks`.

### Task 9: Site chrome — header, footer, consent

**Files:** `src/components/ui/{NavPillBar,SiteHeader,SiteFooter,ConsentBanner}/`, `src/components/analytics/Analytics.tsx`, `src/lib/consent.ts`

**Interfaces (Produces):**
- `NAV_ITEMS = [{ key:"games", label:"Games", href:"/#games" }, { key:"studio", label:"Studio", href:"/about" }, { key:"news", label:"News", href:"/news" }, { key:"press", label:"Press", href:"/#press" }, { key:"support", label:"Support", href:"/support" }] as const` in `src/lib/nav.ts`; `type NavKey`.
- `NavPillBar({ active?: NavKey })` — `aria-current="page"` on active.
- `SiteHeader({ active?: NavKey, variant?: "default"|"game" , backLink?: { label: string; href: string } })` — desktop: Logo, NavPillBar, "Get the newsletter" accent button → `#newsletter`. Phone (< md): Logo + `IconButton` menu opening a dark sheet (Barlow 34 uppercase links + accent newsletter button); `variant="game"` shows back link + compact logo per the phone game board. Sheet: `aria-expanded`, Escape closes and refocuses the toggle, link click closes.
- `SiteFooter({ newsletter: ReactNode, variant?: "full"|"compact", socialLinks: { label; href }[], supportEmail?: string })` — `id="newsletter"`; full = 4 columns (Games / Studio / Help / Follow) per LightHome; compact per LightTerraForge; includes "Cookie settings" button (calls `openConsent()`); hides the Follow column when `socialLinks` empty and the Player support link when no `supportEmail`.
- `src/lib/consent.ts`: `type Consent = "granted"|"denied"`; `readConsent(): Consent | null` (localStorage key `io-consent`), `writeConsent(c)`, `openConsent()` (dispatches `io:consent-open` event).
- `ConsentBanner()` — ink sheet fixed bottom, text + "Accept" (accent) / "Decline" (outline-on-dark); shown when `readConsent()===null` or on `io:consent-open`.
- `Analytics({ gtmId?: string })` — renders nothing without `gtmId`; injects Consent Mode default `denied` script before `<GoogleTagManager gtmId>` from `@next/third-parties/google`, and calls `gtag('consent','update',{ analytics_storage, ad_storage, ad_user_data, ad_personalization })` on consent change.

- [ ] **Step 1:** Tests: `NavPillBar active="news"` marks News `aria-current="page"`; header menu toggle opens the sheet (`aria-expanded="true"`), Escape closes it and focus returns to the toggle (Review Focus 5); `ConsentBanner` hidden when `io-consent` is set, Accept writes `granted`; `SiteFooter` with `socialLinks=[]` renders no Follow heading; `Analytics` without id renders null.
- [ ] **Step 2:** FAIL → implement (install `@next/third-parties`) → PASS → lint → commit `feat(ui): site header, footer, consent`.

### Task 10: Game-page components

**Files:** `src/components/ui/{MediaViewer,StoreCard,StickyPlayBar,ShareTitle}/`

**Interfaces (Produces):**
- `type Media = { kind: "trailer"; label: string; poster: ImageRef; url: string; duration?: string } | { kind: "image"; label: string; image: ImageRef }`.
- `MediaViewer({ items: Media[], title: string })` — large stage (16/7.5 desktop, 16/10 phone) + thumbnail strip (grid desktop, horizontal scroll phone); trailer stage shows poster with accent play button labelled `Play the {title} trailer`; pressing play swaps in an `<iframe>` (YouTube/Vimeo embed URL) or `<video controls>` for direct files — never autoplays muted on load. Selected thumb has ink border + `aria-pressed`. Renders nothing when `items` empty.
- `StoreCard({ priceLabel?: string, primary: { label: string; href: string } | null, notify?: ReactNode /* EmailSignupForm */, notifyTitle?: string, facts: { label; value }[] })` — eyebrow `GET THE GAME`; hides price/notify/facts blocks when absent; becomes the phone "Game details" Accordion for facts below md (component handles both).
- `StickyPlayBar({ title: string, meta: string, action: { label: string; href: string } })` — phone only (hidden ≥ md), sticky bottom.

- [ ] **Step 1:** Tests: `MediaViewer` with `items=[]` renders nothing; clicking thumb 2 shows its label on stage and sets `aria-pressed`; trailer stage play button has accessible name `Play the TerraForge trailer` and no iframe until pressed; `StoreCard` with no `priceLabel`/`notify`/`facts` renders only the eyebrow and primary button (Review Focus 3).
- [ ] **Step 2:** FAIL → implement → PASS → lint → commit `feat(ui): game page components`.

### Task 11: Showcase hero

**Files:** `src/components/ui/{ShowcaseHero,SpotlightRail}/`

**Interfaces (Produces):**
- `type Featured = { slug: string; name: string; status: GameStatus; genre: string; platformLabel: string; blurb: string; art: ImageRef; cta: { label: string; href: string }; detailHref: string }`.
- `ShowcaseHero({ games: Featured[] })` — client; dark card (radius 3xl, min-height 640 desktop) with chips, Display xl name, blurb, CTA + "Game details" outline-on-dark, prev/next IconButtons, mono counter `01 / 03`; phone: stacked art-on-top card with dots (active dot 28px accent). Art via `next/image` `priority` for the first slide, else `Placeholder tone="dark"`. `aria-roledescription="carousel"`, slides `aria-live="polite"` region updates name. **No autoplay.** Arrow keys move when focus is inside. Renders a single static slide (no controls) when `games.length === 1`, nothing when 0.
- `SpotlightRail({ games: Featured[], activeIndex: number, onPick(i: number): void })` — desktop row under the hero; active item card background + ink border.

- [ ] **Step 1:** Tests: next button advances counter `01 / 03` → `02 / 03` and wraps from 3 → 1; prev wraps 1 → 3; with fake timers advanced 30s the slide does not change (Review Focus 5); one game → no prev/next buttons; rail click selects that slide.
- [ ] **Step 2:** FAIL → implement → PASS → lint → commit `feat(ui): showcase hero`.

### Task 12: Sanity — schemas, Studio, client

**Files:**
- Create: `sanity.config.ts`, `sanity.cli.ts`, `src/sanity/schemaTypes/{studioGame,studioPost,studioPage,studioFaq,studioSettings,index}.ts`, `src/sanity/structure.ts`, `src/app/studio/[[...tool]]/page.tsx`, `src/app/studio/[[...tool]]/layout.tsx` (metadata noindex, no site chrome), `src/lib/sanity/{client,image}.ts`
- Test: `src/sanity/schemaTypes/schema.test.ts`

**Interfaces (Produces):**
- Schemas exactly as the spec's Content section lists (fields named in camelCase: `name, slug, status, genres[], platforms[], blurb, description (portable text), keyArt, coverArt, trailer {url, poster, duration}, screenshots[] {image, caption}, features[] {title, body}, facts[] {label, value}, priceLabel, primaryCta {label, url}, notifyPlatform {enabled, platform}, pressKitUrl, featured, featuredOrder, sortOrder` for `studioGame`; `title, slug, date, kind ("update"|"announcement"|"devlog"|"patch-notes"), game (ref studioGame), coverImage, excerpt, body` for `studioPost`; `title, slug, updatedAt, body` for `studioPage`; `question, answer, game?, order` for `studioFaq`; singleton `studioSettings` id `studioSettings`: `supportEmail, socialLinks[] {label,url}, betaCallout {eyebrow, title, body, game ref, platforms[]}, newsletterBlurb, studioPhoto, foundedLine`). Images have required `alt`.
- `defineConfig({ name: "inkorange", title: "inkOrange Studios", basePath: "/studio", projectId, dataset, plugins: [structureTool({ structure }), visionTool()], schema: { types } })`; structure: Settings singleton, Games, News, Pages, FAQs.
- `sanityClient` (`createClient` from `next-sanity`, `apiVersion: "2026-11-01"`, `useCdn: true`), `sanityFetch<T>(query: string, params?: Record<string, unknown>, tags?: string[]): Promise<T>` using `next: { tags }`; `urlFor(source)` and `toImageRef(img, width): ImageRef | null` in `image.ts`.

- [ ] **Step 1:** Test: every schema type name starts with `studio`; `studioGame.status` options equal the four `GameStatus` values; every image field has an `alt` subfield marked required.
- [ ] **Step 2:** FAIL → install `sanity@6 next-sanity@13 @sanity/vision @sanity/image-url @portabletext/react styled-components` → implement → PASS.
- [ ] **Step 3:** Read-only check before any deploy: `npx sanity schema list` (from this repo, with the shared project env) — confirm the portfolio's workspace is `default` and nothing named `inkorange` exists. Then `npx sanity schema deploy` **only for workspace inkorange**; re-run `schema list` and confirm `default` is unchanged. Add CORS origins `http://localhost:3000` and `https://inkorangestudios.com` (credentials allowed) via `npx sanity cors add`.
- [ ] **Step 4:** `npm run dev`, open `/studio`, confirm the five sections appear and the portfolio's types do not. Commit `feat(cms): sanity schemas and embedded studio`.

### Task 13: Content queries and mappers

**Files:** `src/lib/sanity/{queries,mappers,types,content}.ts`, test `src/lib/sanity/mappers.test.ts`, `src/lib/sanity/content.test.ts`

**Interfaces (Produces):**
- Types: `Game` (`slug, name, status, genres: string[], platforms: string[], blurb, description: PortableTextBlock[], keyArt, coverArt: ImageRef|null, media: Media[], features, facts, priceLabel: string|null, primaryCta: {label;href}|null, notify: {platform: string}|null, pressKitUrl: string|null, featured: boolean`), `GameSummary` (`slug, name, status, genre, platformLabel, cover`), `Post`, `PostSummary`, `LegalPage`, `Faq`, `SiteSettings`.
- `mapGame(raw: unknown): Game | null`, `mapGameSummary`, `mapPost`, `mapSettings` — zod-parse leniently; trim strings; drop any string matching `/^\[.*\]$/` (bracket placeholders) and empty strings to `null`/omit; drop facts/features with empty values; `toFeatured(game): Featured`.
- `content.ts` (all `server-only`, each wraps fetch errors → logs and returns the empty value): `getGames(): Promise<GameSummary[]>` (sorted `sortOrder`, then name), `getFeatured(): Promise<Featured[]>`, `getGame(slug): Promise<Game | null>`, `getGameSlugs(): Promise<string[]>`, `getPosts(limit?: number, gameSlug?: string): Promise<PostSummary[]>`, `getPost(slug): Promise<Post | null>`, `getLegalPage(slug: "privacy"|"terms"): Promise<LegalPage | null>`, `getFaqs(): Promise<Faq[]>`, `getSettings(): Promise<SiteSettings>` (defaults: empty social links, no support email). Cache tags: `studioGame`, `studioPost`, `studioPage`, `studioFaq`, `studioSettings`.

- [ ] **Step 1:** Mapper tests: raw game with `priceLabel: "[PRICE]"`, `facts: [{label:"Release", value:"[RELEASE DATE]"}]`, no trailer/screenshots → `priceLabel === null`, `facts` empty, `media` empty (Review Focus 3); trailer + 2 screenshots → `media[0].kind === "trailer"`, length 3; missing slug → `null`. Content tests (mock `sanityFetch` to throw) → `getGames()` resolves `[]`, `getGame("x")` resolves `null`, `getSettings()` resolves defaults (Review Focus 4).
- [ ] **Step 2:** FAIL → implement GROQ queries + mappers → PASS → commit `feat(cms): typed content queries`.

### Task 14: Signup core — table, validation, Turnstile, Postmark

**Files:**
- Create: `supabase/migrations/0001_studio_signups.sql`, `src/lib/supabase/server.ts`, `src/lib/signups/{validate,turnstile,notify}.ts`
- Test: `src/lib/signups/validate.test.ts`, `src/lib/signups/notify.test.ts`, `src/lib/signups/turnstile.test.ts`

**Interfaces (Produces):**
- Migration (comment header explains shared project + apply-by-hand):

```sql
create table if not exists public.studio_newsletter_signups (id uuid primary key default gen_random_uuid(), email text not null, source text not null default 'footer', created_at timestamptz not null default now());
create unique index if not exists studio_newsletter_signups_email_idx on public.studio_newsletter_signups (email);
create table if not exists public.studio_beta_signups (id uuid primary key default gen_random_uuid(), email text not null, game text not null, platform text, source text not null default 'callout', created_at timestamptz not null default now());
create unique index if not exists studio_beta_signups_email_game_idx on public.studio_beta_signups (email, game);
create table if not exists public.studio_launch_alerts (id uuid primary key default gen_random_uuid(), email text not null, game text not null, platform text not null, created_at timestamptz not null default now());
create unique index if not exists studio_launch_alerts_uniq_idx on public.studio_launch_alerts (email, game, platform);
create table if not exists public.studio_contact_messages (id uuid primary key default gen_random_uuid(), name text not null, email text not null, topic text not null default 'general', message text not null, created_at timestamptz not null default now());
-- each: alter table … enable row level security; revoke all on … from anon, authenticated; grant all on … to service_role;
```
- `createServiceClient(): SupabaseClient` (`server-only`, `persistSession: false`).
- `validate.ts`: `MAX_EMAIL = 254`, `MAX_MESSAGE = 5000`, `MAX_NAME = 120`; `normalizeEmail(raw: unknown): string | null` (trim, lower-case, loose regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, length cap); `validateNewsletter(fd: FormData)`, `validateBeta(fd)`, `validateLaunchAlert(fd)`, `validateContact(fd)` each → `{ ok: true; value: … } | { ok: false; error: string }`. Errors: `"Enter your email address."`, `"That doesn't look like an email address."`, `"Tell us your name."`, `"Write a message first."`, `"That message is too long."`. `game`/`platform` restricted to `[a-z0-9-]{1,64}`; `topic` ∈ `general|support|press|business`, unknown → `general`. Honeypot field `website` non-empty → `{ ok: false, error: "spam" }` (actions treat `"spam"` as silent success).
- `verifyTurnstile(token: string, remoteIp?: string): Promise<boolean>` — copy planet-builder `src/lib/feedback/turnstile.ts` semantics (skip when not required; fail closed on error).
- `notifyOwner(msg: { subject: string; replyTo: string; lines: string[] }): Promise<void>` — copy planet-builder `src/lib/testers/notify.ts` semantics (no-op unless `POSTMARK_SERVER_TOKEN`, `FEEDBACK_FROM_EMAIL`, `FEEDBACK_NOTIFY_EMAIL` all set; swallow all errors; subject prefixed `[inkOrange] `, capped 180 chars).

- [ ] **Step 1:** Validate tests: `normalizeEmail("  Name@Gmail.com ") === "name@gmail.com"` (Review Focus 1); `"nope"` → null; 255-char email → null; contact with empty message → `"Write a message first."`; beta with `game="Space Cowboy!"` → invalid; honeypot filled → `error: "spam"`.
- [ ] **Step 2:** Notify tests (mock `fetch`): missing token → `fetch` not called; all env set → one POST to `https://api.postmarkapp.com/email` with `To` = notify email, `ReplyTo` = submitter, `MessageStream: "outbound"`, subject starting `[inkOrange] `; `fetch` rejects → resolves without throwing.
- [ ] **Step 3:** Turnstile tests: not required → `true` without fetch; required + empty token → `false`; fetch throws → `false`.
- [ ] **Step 4:** FAIL → implement (install `@supabase/supabase-js`) → PASS.
- [ ] **Step 5:** Apply the migration by hand to the shared project (Supabase MCP `apply_migration` or SQL editor) — first `list_tables` to confirm no `studio_*` tables exist; after, confirm the four tables, RLS enabled, and run `get_advisors` (security) to check no new warnings. Commit `feat(signups): tables, validation, turnstile, postmark`.

### Task 15: Server actions

**Files:** `src/app/actions/{newsletter,beta,launchAlert,contact}.ts`, `src/lib/signups/store.ts`, test `src/lib/signups/actions.test.ts`

**Interfaces:**
- Consumes: Task 14 functions, `FormState` (Task 7).
- Produces: `subscribeNewsletter(prev: FormState, fd: FormData): Promise<FormState>`, `joinBeta(prev, fd)`, `requestLaunchAlert(prev, fd)`, `sendContactMessage(prev, fd)` (`"use server"`). Shared `insertOnce(table: string, row: Record<string, unknown>, conflict: string): Promise<{ ok: true; isNew: boolean } | { ok: false }>` in `store.ts` (upsert `ignoreDuplicates: true` + `.select("id")`; contact uses plain insert, always `isNew: true`).
- Flow per action: validate → `"spam"` returns `{status:"ok"}` → Turnstile (`captchaToken` field, IP from `x-forwarded-for`) fail → `"Please complete the human check and try again."` → store fail → `"Something went wrong. Please try again."` → if `isNew` and action is beta/contact, `await notifyOwner(…)` → `{status:"ok"}`. Beta email subject `New beta tester: {email} ({game})`; contact subject `Contact ({topic}): {name}` with the message in the body.

- [ ] **Step 1:** Tests (mock `createServiceClient`, `verifyTurnstile`, `notifyOwner`): new beta signup → ok + `notifyOwner` called once with `replyTo` = email; duplicate (upsert returns `[]`) → ok + `notifyOwner` not called (Review Focus 2); newsletter → ok, `notifyOwner` never called; Supabase error → error state, `notifyOwner` not called; `notifyOwner` rejecting is impossible by contract but assert action still ok if it throws (wrap defensively); Turnstile false → human-check error and no DB call; contact → `notifyOwner` called with message text in `lines`.
- [ ] **Step 2:** FAIL → implement → PASS → commit `feat(signups): server actions`.

### Task 16: Bound form components

**Files:** `src/components/forms/{NewsletterForm,BetaForm,LaunchAlertForm,ContactForm}.tsx` (+ one test file `src/components/forms/forms.test.tsx`)

**Interfaces (Produces):**
- `NewsletterForm({ tone: "on-dark", source: string })` → `EmailSignupForm` with `subscribeNewsletter`, label `Email address`, placeholder `you@example.com`, submit `Subscribe`, success `You're on the list. Watch your inbox for news.`
- `BetaForm({ game: string, platforms: string[] })` → `EmailSignupForm tone="on-accent"`, submit `Join the beta`, platform select (iOS/Android) when `platforms.length > 1`, success `Thanks! We'll email you when a beta spot opens.`
- `LaunchAlertForm({ game: string, platform: string })` → `tone="on-card"`, placeholder `Email me at launch`, submit `Notify me` (phone: `Notify`), success `We'll email you when it launches on {platform}.`
- `ContactForm()` → name, email, topic select (General / Player support / Press / Business), message, honeypot, Turnstile; submit `Send message`; success `Thanks — your message is on its way. We'll reply by email.`
- These files live outside `src/components/ui`, contain no SCSS, and compose `ui` components only.

- [ ] **Step 1:** Tests (mock the actions): each form renders its submit label; `BetaForm platforms={["ios","android"]}` shows a platform select, `["ios"]` doesn't; `ContactForm` includes a visually hidden `website` input with `tabIndex=-1` and `autoComplete="off"`.
- [ ] **Step 2:** FAIL → implement → PASS → lint → commit `feat(forms): bound signup and contact forms`.

### Task 17: Root layout and Home page

**Files:** Modify `src/app/layout.tsx`, `src/app/page.tsx`; create `src/app/(site)/layout.tsx` (header/footer/consent/analytics shared shell) and move public routes under `(site)`; `src/app/(site)/page.tsx`; test `src/app/(site)/page.test.tsx`

**Interfaces:**
- Consumes: `getFeatured, getGames, getPosts(3), getSettings`; UI components; forms.
- Home composition (order and copy from LightHome): `ShowcaseHero` + `SpotlightRail` → one-liner `Display size="l"` "An independent studio making games that" + `Highlight paint` "make you think." with body "Sandboxes, puzzlers, simulations and whatever we dream up next — for web, iOS and Android." → `Section id="games"` `SectionHeader "All games"` with `FilterPills ["All","Out now","Coming soon"]` (client island `GameGrid` in `src/components/ui/GameGrid/` — add to ui with test: "Out now" filter shows only `out-now`; "Coming soon" shows the rest) → `CalloutBand` from `settings.betaCallout` with `BetaForm` (hidden when no callout configured) → `Section tone="sand" id="studio"` teaser (photo or Placeholder, Eyebrow "THE STUDIO", Heading "A small studio with a big backlog of ideas.", founded copy, `ValueList` Play first / Smart, not stuffy / Play anywhere, `Button` "About the studio" → `/about`) → `Section id="news"` `SectionHeader "News"` action "All news →" `/news` with 3 `NewsCard`s (phone: horizontal scroller) — hidden when no posts → footer with `NewsletterForm` and `id="press"` press-kit link in the Studio column.
- Empty states: no games → `Text` "New games are on the way." in the grid; no featured → hero omitted.
- `export const revalidate = 3600`.

- [ ] **Step 1:** Test (mock content fns): renders the h1 for the first featured game; with all content functions returning empty, the page renders "New games are on the way." and no hero (Review Focus 4).
- [ ] **Step 2:** FAIL → implement → PASS → `npm run lint && npm run build`.
- [ ] **Step 3:** Visual check: `npm run dev`, screenshot `/` at 1440 and 390 widths (Playwright via the `run` skill) and compare side by side with LightHome / LightHomePhone; fix spacing/type drift through tokens/components only. Commit `feat(pages): home`.

### Task 18: Game page

**Files:** `src/app/(site)/games/[slug]/page.tsx`, `src/app/(site)/games/page.tsx` (redirect to `/#games`), test `src/app/(site)/games/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: `getGame, getGameSlugs, getPosts(2, slug), getGames, getSettings`.
- `generateStaticParams` from `getGameSlugs()`; `dynamicParams = true`; unknown slug → `notFound()`. `generateMetadata`: title `{name} — inkOrange Studios`, description `blurb`, OG image `keyArt`.
- Composition (LightTerraForge order): `SiteHeader active="games" variant="game" backLink={{label:"Games", href:"/#games"}}` (variant only changes phone) → `Breadcrumb Games / {name}` + `Display xl` + chips (status accent; genres + platforms outline) → `MediaViewer` → two columns: main (`Heading "About the game"`, lead = first description block, rest `RichText`; `Heading "Features"` + `FeatureList` when any; `SectionHeader "Latest updates"` action `All {name} news →` `/news?game={slug}` + `UpdateRow`s when any) and aside (`StoreCard` with `LaunchAlertForm` when `notify`, `InfoCard` Press kit when `pressKitUrl`, `InfoCard` Need help? → `/support`) → `Section tone="sand"` "More from inkOrange" `GameTile size="s"` grid (other games) → `StickyPlayBar` when `primaryCta` → footer compact.
- JSON-LD `VideoGame` script (name, description, genre, gamePlatform, publisher inkOrange Studios, url).

- [ ] **Step 1:** Tests (mock content): sparse game (Review Focus 3 fixture from Task 13) renders the h1 and no "Features", "Latest updates", "Press kit" headings and no `[` text anywhere; full TerraForge fixture renders the trailer play button and the facts list; unknown slug calls `notFound`.
- [ ] **Step 2:** FAIL → implement → PASS → lint/build → visual check vs LightTerraForge + phone board → commit `feat(pages): game page`.

### Task 19: About, Support, Privacy, Terms

**Files:** `src/app/(site)/{about,support,privacy,terms}/page.tsx`, `src/components/ui/{LegalEmpty,FaqList}/`, tests alongside pages

**Interfaces:**
- About: hero (`Eyebrow "THE STUDIO"`, `Display l` "A small studio with a big backlog of ideas."), photo/Placeholder, story copy from the mockup ("Founded in New York in 2020 by design engineer Chris West…" incl. SpaceUI sentence), `ValueList`, then `Section id="contact"` `Heading "Get in touch"` + `ContactForm`. `SiteHeader active="studio"`.
- Support: `Display` "Support", intro, `FaqList({ items: Faq[] })` (Accordion per item; grouped by game when set), per-game help links (game name → its page), `InfoCard` "Still stuck?" → `/about#contact`, support email when set. Empty FAQs → `LegalEmpty`-style note "FAQs are coming soon." `SiteHeader active="support"`.
- Privacy/Terms: `getLegalPage(slug)`; with content → `Display m` title, "Last updated {date}", `RichText` inside `Container width="narrow"`; without → `LegalEmpty({ title })` ("This page is being written.") and `generateMetadata` returns `robots: { index: false }`.

- [ ] **Step 1:** Tests: About renders a form with a "Send message" button; Privacy with `getLegalPage → null` renders "This page is being written." and metadata `robots.index === false`; with content renders the title and last-updated line; Support with no FAQs renders "FAQs are coming soon."
- [ ] **Step 2:** FAIL → implement → PASS → lint/build → commit `feat(pages): about, support, legal`.

### Task 20: News pages, design gallery, SEO, revalidation

**Files:** `src/app/(site)/news/page.tsx`, `src/app/(site)/news/[slug]/page.tsx`, `src/app/design/page.tsx` + `src/components/ui/DesignGallery/` (the gallery is a ui component so the page stays className-free), `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.tsx`, `src/app/api/revalidate/route.ts`, `src/app/not-found.tsx`; tests for revalidate route and sitemap.

**Interfaces:**
- `/news`: `SectionHeader "News"` + optional game filter from `?game=` (FilterPills of games that have posts) + `NewsCard` grid; empty → "No news yet."
- `/news/[slug]`: date + kind eyebrow, `Display m` title, cover image, `RichText`, related game `GameTile`. `notFound()` on miss.
- `/design`: `robots: { index: false }`; renders every token (color swatches with name + hex read from a generated list — the gallery imports `src/styles/tokens.json`, generated from `tokens.scss` by `scripts/tokens-json.mjs` run in `prebuild`/`pretest`) and every component in its variants.
- `sitemap()`: `/`, `/about`, `/support`, `/news`, each game, each post; privacy/terms only when content exists. Base `publicEnv.siteUrl`.
- `robots()`: allow all, disallow `/studio`, `/design`, `/api`; sitemap URL.
- `POST /api/revalidate`: uses `parseBody` from `next-sanity/webhook` with `SANITY_REVALIDATE_SECRET`; invalid signature → 401; valid → `revalidateTag(body._type)` for `studio*` types only, 200 `{ revalidated: true }`; other types → 200 `{ revalidated: false }`.
- `opengraph-image`: paper background, logo, "Games that make you think." in Barlow (uses `ImageResponse`; colors imported from `tokens.json`, not literals).

- [ ] **Step 1:** Tests: revalidate route with bad signature → 401; with `_type: "studioGame"` → `revalidateTag("studioGame")` called; `_type: "project"` (portfolio) → not called; sitemap omits `/privacy` when `getLegalPage` returns null and includes `/games/terraforge` when that slug exists.
- [ ] **Step 2:** FAIL → implement → PASS → lint/build → commit `feat: news, design gallery, seo, revalidation`.

### Task 21: Seed content and launch checklist

**Files:** `scripts/seed-sanity.mjs`, `docs/launch-checklist.md`

- [ ] **Step 1:** `seed-sanity.mjs` (uses `SANITY_API_TOKEN` with write access; `createIfNotExists` with fixed ids `studioGame.terraforge` etc., so re-running never overwrites Chris's edits): the five games from LightHome with mockup genre/platform/status/blurb (TerraForge: full description paragraphs 1–2, the six features, facts Developer/Genre/Platforms/Players, primary CTA "Play free in browser" → `https://www.terraforgeworlds.com`, notify platform Android; Space Cowboy: coming-soon, iOS · Android; Mission Control: out-now Web; Exoplanet Explorer: coming-soon Web; Strata: in-development Web), featured = TerraForge, Space Cowboy, Mission Control (in that order); `studioSettings` with the beta callout copy ("NOW RECRUITING TESTERS" / "Play Space Cowboy before anyone else." / "Join the iOS and Android beta and help shape the game before launch.", platforms ios+android) and newsletter blurb ("New releases, beta invites and studio news. A few emails a year."). No bracket placeholders, no legal text, no FAQs, no posts.
- [ ] **Step 2:** Run it against the shared dataset; confirm in `/studio` that the documents appear and no portfolio document changed (`*[_type in ["project","caseStudy"]] | count` before/after equal).
- [ ] **Step 3:** `docs/launch-checklist.md`: Vercel project + `inkorangestudios.com` domain/DNS; env vars in Vercel (all names from `.env.example`); Turnstile hostnames (`inkorangestudios.com`, preview domain); Sanity CORS for production; Sanity webhook → `https://inkorangestudios.com/api/revalidate` (filter `_type match "studio*"`, secret); **Postmark: verify `inkorangestudios.com` sender domain (DKIM + Return-Path), set `FEEDBACK_FROM_EMAIL=hello@inkorangestudios.com`**; GTM container id; Chris to write Privacy, Terms, FAQs in Studio; replace placeholder art (cover art, studio photo, key art for non-TerraForge games); optional SVG logo.
- [ ] **Step 4:** Final verification: `npm run lint && npm test && npm run build` all pass; dev-server pass over every route at 1440 and 390 with screenshots; submit each form locally and confirm rows land in the `studio_*` tables (then delete the test rows). Commit `chore: seed content and launch checklist`.
