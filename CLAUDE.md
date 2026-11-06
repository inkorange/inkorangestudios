# inkOrange Studios website

Next.js 16 (App Router), TypeScript strict, native SCSS modules. Node >=22, npm.

- Spec: `docs/superpowers/specs/2026-11-05-inkorange-studios-website-design.md`
- Plan: `docs/superpowers/plans/2026-11-05-inkorange-studios-website.md`

## Read first

Read `DESIGN.md` before any UI work and follow it. Pages compose components from `src/components/ui` only.

## Enforcement rules

- No Tailwind, CSS-in-JS, utility-class libraries or SpaceUI. One `.module.scss` per component.
- Raw color, size and font values live only in `src/styles/tokens.scss`; everything else uses `var(--...)`.
- `src/app/**` must not import `.scss` (except `src/app/layout.tsx` importing `@/styles/globals.scss`) and must not use `className` or `style`.
- Adding a token or a `src/components/ui` folder requires documenting it in `DESIGN.md` (a sync test enforces this).
- Tap targets at least 44px, visible focus ring, all motion off under `prefers-reduced-motion: reduce`.
- Run `npm test`, `npm run lint` and `npm run typecheck` before committing.

## Data services

- Supabase is a shared project. Tables are prefixed `studio_`, RLS on, service role only. Migrations are applied by hand, never with `supabase db push`.
- Sanity uses the same project and dataset as `~/web/portfolio`. Document types are prefixed `studio`. Never run `sanity schema deploy` or `sanity deploy` without first checking the portfolio's deployed workspaces.
- Never print or commit secrets. `.env.local` is gitignored; `.env.example` documents every variable.


<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
