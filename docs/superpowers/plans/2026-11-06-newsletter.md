# Newsletter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chris writes newsletter issues in the embedded Sanity Studio, previews and test-sends them, and sends each issue once to double-opt-in subscribers through Postmark's Broadcast stream.

**Architecture:** Pure modules (issue query + resolver, email renderer) run both in the Studio (preview) and on the server. Studio buttons create private request documents; a signed Sanity webhook hits `/api/newsletter/webhook`, which claims each request once in Supabase and sends in `after()`. Subscribers move pending → confirmed → unsubscribed in `studio_newsletter_signups`; Postmark's Subscription Change webhook feeds unsubscribes back.

**Tech Stack:** Next.js 16 App Router (route handlers, `after()`), Sanity Studio v6 (document actions, views), `@sanity/image-url`, Supabase (service role), Postmark HTTP API, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-06-newsletter-design.md` (read it; this plan argues from it).

## Global Constraints

- Read `CLAUDE.md`. Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md` and the route handler docs before writing routes.
- Sanity types prefixed `studio`; the dataset is shared with the portfolio. Never run `sanity schema deploy` / `sanity deploy`.
- Supabase: `studio_` tables, RLS on, no policies, `revoke all … from anon, authenticated`, `grant all … to service_role`, idempotent SQL in `supabase/migrations/`, applied by hand (never `supabase db push`).
- Never log or commit subscriber addresses, tokens or secrets. Log table names and status codes only (see `src/lib/signups/store.ts`).
- Every new env var goes in `.env.example` with a comment. Read env at request time, not module load.
- No raw colour literals in `src/**` (eslint `rawColor`). The email theme reads values through `tokenValue` / `tokenPx` from `src/lib/tokens.ts` (Ruling: this replaces the spec's "theme constant + sync test"; same single source, enforced by construction).
- `src/app/**` composes `src/components/ui` only, no `className`/`style`. The confirm page follows this; the raw-HTML route returns a `Response` and renders no JSX.
- Pure newsletter modules (`src/lib/newsletter/issue.ts`, `src/lib/newsletter/email/**`) import nothing server-only and no zod (they load in the Studio bundle; `tests/enforcement/client-bundle.test.ts` style).
- Tests: no real network. Mock `fetch` for Postmark, mock the Supabase client and the Sanity client.
- Run `npm test`, `npm run lint`, `npm run typecheck` before each commit. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ruling: "view in browser" lives at `/newsletter/issue/{issueId}` (not `/newsletter/{issueId}`) so it can't collide with the `/newsletter/confirm` page in another route tree. Cost if wrong: a URL string.

## Review Focus

1. **A webhook delivered twice, or two Studio taps in a row** → one test email, one broadcast. Task 8 tests concurrent `handleRequest` calls with the same request id and with two broadcast requests for one issue.
2. **A send dies mid-way** (timeout after Postmark accepted a batch) → no recipient gets it twice; the Studio shows the uncertain count. Task 8 tests resume turning `in_flight` into `uncertain` without calling Postmark.
3. **Someone re-subscribes in every state** (pending, confirmed, unsubscribed, expired token) → the form always says the same thing; only the right states get an email; a confirmed address is never downgraded. Task 6 tests the full matrix.
4. **An issue with missing pieces** (game with no art, deleted game reference, free section without image or button, empty intro) → renders cleanly, no "undefined", no broken `<img>`. Task 3/4 tests.
5. **WebP or huge images** (Space Cowboy's key art is WebP) → every email image URL has `fm=jpg` or `fm=png`, a width, and no `auto=format`. Task 4 tests.

---

### Task 1: Database migration and newsletter env

**Files:**
- Create: `supabase/migrations/0002_newsletter.sql`
- Modify: `src/lib/env.ts`, `src/lib/env.test.ts`, `.env.example`

**Interfaces:**
- Produces: `readNewsletterEnv(): NewsletterEnv` in `src/lib/env.ts`, where
  `type NewsletterEnv = { postmarkToken?: string; fromEmail?: string; testEmail?: string; broadcastStream?: string; webhookSecret?: string; postmarkWebhookUser?: string; postmarkWebhookPassword?: string; sanityToken?: string }` read from `POSTMARK_SERVER_TOKEN`, `NEWSLETTER_FROM_EMAIL`, `NEWSLETTER_TEST_EMAIL`, `POSTMARK_BROADCAST_STREAM`, `NEWSLETTER_WEBHOOK_SECRET`, `POSTMARK_WEBHOOK_USER`, `POSTMARK_WEBHOOK_PASSWORD`, `SANITY_API_TOKEN` (trimmed, blank → undefined, like `readRevalidateSecret`). Does not depend on Supabase vars.
- Produces tables (exact columns; later tasks use these names):
  - `studio_newsletter_signups` add: `status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed'))`, `confirm_token_hash text`, `confirm_sent_at timestamptz`, `confirmed_at timestamptz`, `unsubscribed_at timestamptz`, `unsubscribe_reason text`; unique index on `confirm_token_hash` where not null.
  - `studio_newsletter_requests (request_id text primary key, issue_id text not null, kind text not null, handled_at timestamptz not null default now())`
  - `studio_newsletter_sends (issue_id text primary key, request_id text not null, status text not null check (status in ('sending','sent','failed')), subject text, html text, text_body text, recipient_count int, failed_count int not null default 0, uncertain_count int not null default 0, error text, started_at timestamptz not null default now(), finished_at timestamptz, updated_at timestamptz not null default now())`
  - `studio_newsletter_send_batches (id uuid primary key default gen_random_uuid(), issue_id text not null references studio_newsletter_sends(issue_id), seq int not null, recipients text[] not null, status text not null default 'pending' check (status in ('pending','in_flight','sent','uncertain')), failed_count int not null default 0, updated_at timestamptz not null default now(), unique (issue_id, seq))`

- [ ] **Step 1: Write failing tests** in `src/lib/env.test.ts`: `readNewsletterEnv` returns each value trimmed; blank strings become undefined; works with Supabase vars unset.
- [ ] **Step 2: Run** `npx vitest run src/lib/env.test.ts` → FAIL (not exported).
- [ ] **Step 3: Implement** `readNewsletterEnv`; write `0002_newsletter.sql` following `0001`'s header, `if not exists` / `add column if not exists`, RLS + revoke + grant for each new table. Add the seven new/changed vars to `.env.example` with comments (`SANITY_API_TOKEN` comment now says "Editor role; the newsletter reads drafts and writes delivery status").
- [ ] **Step 4: Run** the env test → PASS; `npm run lint && npm run typecheck`.
- [ ] **Step 5: Commit** `feat(newsletter): migration and env`.

The migration is applied by the controller with Chris's go-ahead (MCP `apply_migration`), not by the implementer.

---

### Task 2: Postmark client

**Files:**
- Create: `src/lib/newsletter/postmark.ts`, `src/lib/newsletter/postmark.test.ts`

**Interfaces:**
- Produces (server-only module):
  - `type OutboundMessage = { to: string; subject: string; html: string; text: string; stream: string; from: string; tag?: string }`
  - `sendEmail(token: string, msg: OutboundMessage): Promise<{ ok: true; messageId: string } | { ok: false; status: number; code?: number }>` → `POST https://api.postmarkapp.com/email`
  - `sendBatch(token: string, msgs: OutboundMessage[]): Promise<{ ok: true; results: { to: string; errorCode: number }[] } | { ok: false; status: number }>` → `POST /email/batch`; throws `RangeError` for more than 500 messages.
  - `listSuppressed(token: string, stream: string): Promise<Set<string> | null>` → `GET /message-streams/{stream}/suppressions/dump`, lower-cased emails, `null` on any error.
- All calls: `X-Postmark-Server-Token`, JSON, `AbortSignal.timeout(15000)`; never log addresses or bodies.

- [ ] **Step 1: Failing tests** (mock `global.fetch`): `sendEmail` maps fields to `From/To/Subject/HtmlBody/TextBody/MessageStream/Tag` and returns `messageId`; non-2xx → `{ ok:false, status, code }` from Postmark's `ErrorCode`; `sendBatch` sends an array, maps per-message `ErrorCode`, rejects 501 messages; `listSuppressed` lower-cases `Suppressions[].EmailAddress`; network error → `null` / `{ok:false,status:0}`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(newsletter): postmark client`.

---

### Task 3: Email renderer (pure)

**Files:**
- Create: `src/lib/newsletter/email/types.ts`, `theme.ts`, `blocks.ts`, `render.ts`, `render.test.ts`

**Interfaces:**
- Produces `types.ts`:
  ```ts
  export type EmailImage = { src: string; alt: string; width: number; height: number };
  export type EmailChip = { label: string; tone: "accent" | "outline" };
  export type EmailButton = { label: string; href: string; tone: "accent" | "outline" };
  export type EmailBlock = { _type: "block"; children: { _type: "span"; text: string; marks?: string[] }[]; markDefs?: { _key: string; _type: "link"; href?: string }[] };
  export type EmailSection =
    | { kind: "game"; title: string; image: EmailImage | null; chips: EmailChip[]; body: EmailBlock[]; button: EmailButton }
    | { kind: "free"; eyebrow: string | null; title: string; image: EmailImage | null; body: EmailBlock[]; button: EmailButton | null };
  export type IssueData = { id: string; subject: string; preheader: string | null; issueLine: string | null; headline: string | null; intro: EmailBlock[]; sections: EmailSection[] };
  export type Footer = { siteUrl: string; mailingAddress: string; viewInBrowserUrl: string | null; unsubscribe: "placeholder" | "note" };
  export type RenderedEmail = { subject: string; html: string; text: string };
  ```
- Produces `render.ts`: `renderIssue(issue: IssueData, footer: Footer): RenderedEmail` and `renderConfirmation(opts: { confirmUrl: string; siteUrl: string; mailingAddress: string }): RenderedEmail` (subject "Confirm your inkOrange Studios newsletter subscription").
- `theme.ts` builds colours/radii from `tokenValue("--color-paper" | "--color-ink" | "--color-accent" | "--color-sand" | "--color-line" | "--color-on-dark")`; fonts are literal stacks `'Barlow Condensed','Arial Narrow',Arial,sans-serif` and `Inter,Arial,sans-serif`.
- `blocks.ts`: `blocksToHtml(blocks: EmailBlock[]): string` (paragraphs, `strong`, `em`, links with absolute `https?:`/`mailto:` hrefs only, everything HTML-escaped) and `blocksToText(blocks): string` (links as `text (url)`).

Layout A from the spec §3: table-based, 600px max, inline styles only, logo `{siteUrl}/brand/inkorange-logo.png`, one card per section, free sections on `--color-sand` with the watercolor as `background` attribute fallback, dark footer. `unsubscribe: "placeholder"` puts `{{{pm:unsubscribe}}}` as the unsubscribe link `href` in HTML and as a line in text; `"note"` writes "(Unsubscribe link appears here)". Preheader as hidden first text. No `<style>`/remote CSS.

- [ ] **Step 1: Failing tests** in `render.test.ts`:
  - `renderIssue` HTML contains subject-free body pieces: headline, intro text, each section title in order, chip labels, button labels with their hrefs.
  - section with `image: null` renders no `<img` for that card; every `<img` has `width=`, `height=`, `alt=`.
  - `blocksToHtml` escapes `<script>` text, drops `javascript:` links (text kept), keeps `mailto:`.
  - footer: mailing address present; `"placeholder"` → `{{{pm:unsubscribe}}}` appears in both `html` and `text`; `"note"` → it appears in neither.
  - `viewInBrowserUrl: null` → no "View in browser" link.
  - output contains no `undefined`, no `null`, and no `#` colour literal not produced by `tokenValue` (assert the accent appears as `tokenValue("--color-accent")`).
  - `renderConfirmation` contains the confirm URL as a button href and in the text part; no unsubscribe placeholder.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; lint (rawColor must pass).
- [ ] **Step 5: Commit** `feat(newsletter): email renderer`.

---

### Task 4: Issue query and resolver (pure)

**Files:**
- Create: `src/lib/newsletter/issue.ts`, `src/lib/newsletter/issue.test.ts`

**Interfaces:**
- Consumes: `IssueData`, `EmailSection`, `EmailImage` from Task 3; `statusLabel` from `src/lib/games.ts`.
- Produces:
  - `ISSUE_QUERY: string`: GROQ for one issue by `$id` with sections expanded: game sections dereference `game->{ name, "slug": slug.current, status, platforms, primaryCta, "betaSignup": betaTesting.signup, keyArt, coverArt }`; images keep `asset`, `crop`, `hotspot`, `alt`.
  - `SETTINGS_QUERY: string`: `*[_id == "studioSettings"][0].newsletter{ mailingAddress, fromName }`.
  - `type ImageConfig = { projectId: string; dataset: string }`
  - `resolveIssue(raw: unknown, opts: { siteUrl: string; images: ImageConfig }): IssueData | null` (null without `_id`, subject or any renderable section).
  - `emailImageUrl(source, cfg: ImageConfig, kind: "card" | "icon"): EmailImage | null`: card `width(1200).height(600).fit("crop")` honouring hotspot/crop, icon `width(128).height(128)`; `.format(isPng ? "png" : "jpg").quality(75)`; never `.auto("format")`.

Button rules (spec §2), in order: section override (both label and URL) → `betaSignup === "yes"` gives `{ "Join the beta", {siteUrl}/games/{slug}#beta, accent }` → `primaryCta` gives its label/URL, outline → `{ "Game details", {siteUrl}/games/{slug}, outline }`. Chips: status chip (`accent` when status is `out-now` or beta is open; label from `statusLabel` in `src/lib/games.ts`, uppercase not applied here) then platform chips (outline). Art: section image → `keyArt` → `coverArt` → `null`. A game section whose reference is missing is dropped. Relative button URLs are made absolute on `siteUrl`.

- [ ] **Step 1: Failing tests**: each button rule; chip order and tones; art fallback chain; dropped section with a null `game`; free section with no image/button; WebP asset ref (`image-…-1672x941-webp`) yields a URL with `fm=jpg` and `w=1200`, and no `auto=format`; PNG ref yields `fm=png`; returns `null` for missing subject or no sections.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** (use `@sanity/image-url` directly with `ImageConfig`; don't import `src/lib/sanity/image.ts`, which reads `publicEnv`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(newsletter): issue query and resolver`.

---

### Task 5: Sanity schema

**Files:**
- Create: `src/sanity/schemaTypes/studioNewsletterIssue.ts`, `studioNewsletterRequest.ts`, `studioNewsletterDelivery.ts`
- Modify: `src/sanity/schemaTypes/index.ts`, `studioSettings.ts`, `schema.test.ts`, `src/sanity/structure.ts`, `sanity.config.ts`

**Interfaces:**
- Produces document types (field names are used by Task 4's query and Tasks 8/12):
  - `studioNewsletterIssue`: `subject` (string, required, max 150), `preheader` (string, max 120), `issueLine`, `headline` (strings), `intro` (array of `block`, styles Normal only, no lists, marks strong/em/link), `sections` (array, min 1) of `gameSection { game (ref studioGame, required), body (same block config, required), image (imageField), buttonLabel, buttonUrl (url, http/https) }` and `freeSection { eyebrow, title (required), body (required), image (imageField), buttonLabel, buttonUrl }` with a validation that label and URL come as a pair. Preview: subject + issueLine.
  - `studioNewsletterRequest`: `issueId` (string), `kind` (string: test|count|broadcast|resume), `revision` (string), `requestedAt` (datetime). All `readOnly`.
  - `studioNewsletterDelivery`: `status` (idle|sending|sent|failed), `audienceCount` (number), `countedAt`, `lastTest { at, revision }`, `sentAt`, `recipientCount`, `failedCount`, `uncertainCount`, `error` (string). All `readOnly`.
  - `studioSettings.newsletter { mailingAddress (text, rows 3), fromName (string, initialValue "inkOrange Studios") }`.
- Structure: "Newsletter" list item (`studioNewsletterIssue`) after News. Request and delivery types never appear in the desk and are filtered from new-document templates in `sanity.config.ts`.

- [ ] **Step 1: Failing tests** in `schema.test.ts`: the three types are registered and prefixed; every image field (including in section objects) has a required alt (existing test should cover; extend its walker if it doesn't reach array members); request and delivery are excluded from templates; settings has `newsletter.mailingAddress`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS; typecheck.
- [ ] **Step 5: Commit** `feat(newsletter): studio schema`.

---

### Task 6: Subscribers, signup action and confirm page

**Files:**
- Create: `src/lib/newsletter/subscribers.ts`, `subscribers.test.ts`, `src/app/(site)/(pages)/newsletter/confirm/page.tsx`, `page.test.tsx`
- Modify: `src/app/actions/newsletter.ts`, `src/components/forms/NewsletterForm.tsx`, `src/lib/signups/actions.test.ts`

**Interfaces:**
- Consumes: `sendEmail` (Task 2), `renderConfirmation` (Task 3), `readNewsletterEnv` (Task 1), `createServiceClient`.
- Produces (server-only):
  - `subscribe(email: string, source: string, now?: Date): Promise<{ ok: boolean }>`
  - `confirmSubscription(token: string, now?: Date): Promise<"confirmed" | "expired" | "invalid">`
  - `markUnsubscribed(email: string, reason: string, now?: Date): Promise<void>`
  - `CONFIRM_TTL_DAYS = 7`, `RESEND_THROTTLE_MINUTES = 10`
- Token: 32 random bytes base64url; store `sha256` hex only. Confirm URL `{siteUrl}/newsletter/confirm?token=…`.

State matrix for `subscribe` (always returns `{ok:true}` unless the database fails):

| existing row | action |
|---|---|
| none | insert `pending`, token, send email |
| `pending`, `confirm_sent_at` < 10 min ago | nothing |
| `pending`, older | new token, send email |
| `confirmed` | nothing (never downgrade) |
| `unsubscribed` | back to `pending`, new token, clear `unsubscribed_at`, send email |

A Postmark failure leaves the row `pending` and still returns `{ok:true}` (spec §6). `confirmSubscription`: hash lookup; `confirm_sent_at` older than 7 days → `"expired"`; else set `confirmed`, `confirmed_at`, clear token → `"confirmed"`; no row → `"invalid"`.

Action: keep validation, honeypot and Turnstile exactly as now; replace `insertOnce` with `subscribe`. Form success message: "Check your inbox to confirm your subscription."

Confirm page: server component reading `searchParams` (async in Next 16, check the docs), calls `confirmSubscription`, renders with existing ui components only (`Section`, `Heading`/`Display`, `Text`/`Prose`, `Button` to `/`): "You're subscribed" / "This link has expired. Sign up again in the footer." / "This link isn't valid." `robots: noindex` in metadata. No new ui component.

- [ ] **Step 1: Failing tests**: every row of the matrix (mock Supabase builder and `sendEmail`; assert which updates/inserts run and whether an email is sent); the stored value is a 64-char hex hash, never the token; `confirmSubscription` confirmed/expired/invalid; `markUnsubscribed` sets status, timestamp and reason. Update `actions.test.ts` newsletter cases to mock `subscribe`. Page test: each outcome's heading text, and that it renders inside the site layout components (no `className`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` → PASS; lint (page rules).
- [ ] **Step 5: Commit** `feat(newsletter): double opt-in signup and confirm page`.

---

### Task 7: Beta anchor on the game page

**Files:**
- Modify: `src/components/ui/GameLayout/GameLayout.tsx`, `GameLayout.test.tsx`, `DESIGN.md` (GameLayout entry: "the beta slot carries `id="beta"` so links can jump to the signup")

- [ ] **Step 1: Failing test**: the `data-slot="beta"` wrapper has `id="beta"`.
- [ ] **Step 2: Run** → FAIL. **Step 3:** add the id. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: #beta anchor on the game page beta band`.

---

### Task 8: Send engine

**Files:**
- Create: `src/lib/newsletter/sanityServer.ts`, `src/lib/newsletter/send.ts`, `send.test.ts`

**Interfaces:**
- Consumes: Tasks 1–4; `apiVersion` from `src/lib/sanity/client.ts`.
- Produces:
  - `sanityServer.ts` (server-only): `getWriteClient(token: string)` (no CDN, `perspective: "raw"`), `readIssueForSend(client, issueId, { draft: boolean }): Promise<{ raw: unknown; revision: string; hasDraft: boolean }>` (reads `drafts.{id}` when `draft` and it exists, else published; `revision` is `_rev`), `readSettings(client)`, `patchDelivery(client, issueId, fields)` (`createIfNotExists` `{ _id: "newsletter.delivery." + issueId, _type: "studioNewsletterDelivery", status: "idle" }` then `patch().set(fields)`).
  - `send.ts`: `type NewsletterRequest = { requestId: string; issueId: string; kind: "test" | "count" | "broadcast" | "resume"; revision: string | null }` and `handleRequest(req: NewsletterRequest, deps?: Partial<Deps>): Promise<void>`, with `Deps` injectable for tests (clock, Supabase client, Sanity client, Postmark functions, env).
  - `audience(): Promise<string[]>`: confirmed rows minus `listSuppressed` (when it returns a set).
- Behaviour (spec §4), in order:
  1. Insert `studio_newsletter_requests(request_id)`; unique violation (`23505`) → return silently.
  2. Missing Postmark token, from address, stream (broadcast only) or test address (test only) → `patchDelivery({ error: "<which setting> is not set" })`, return.
  3. `count`: `patchDelivery({ audienceCount, countedAt })`.
  4. `test`: read draft-or-published, resolve, render with `unsubscribe: "note"`, `viewInBrowserUrl: null`, subject `"[Test] " + subject`, send to `testEmail` on stream `outbound`; `patchDelivery({ lastTest: { at, revision }, audienceCount, error: null })`.
  5. `broadcast`: read published; refuse (`patchDelivery({ error })`) when `hasDraft`, revision ≠ `req.revision`, mailing address empty, or resolve fails. Insert `studio_newsletter_sends` (`issue_id` primary key; `23505` → return). `patchDelivery({ status: "sending", error: null })`. Render with `unsubscribe: "placeholder"` and `viewInBrowserUrl: {siteUrl}/newsletter/issue/{issueId}`; store subject/html/text exactly as rendered (Task 11 replaces the placeholder when serving). Snapshot audience into batches of 500 (`seq` 0…n), set the send's `recipient_count` and `patchDelivery({ recipientCount })`. Then `runBatches`.
  6. `runBatches(issueId)`: for each `pending` batch by `seq`: conditional update `status='in_flight' where id=… and status='pending'` returning rows; zero rows → skip. `sendBatch` (one message per recipient, `From: "{fromName} <{fromEmail}>"`, stream `broadcastStream`, tag `issue-{issueId}`). Success → `sent` with `failed_count` = results with `errorCode ≠ 0`. `{ ok:false, status: 0 }` (timeout or network: the call may have reached Postmark) → `uncertain`, never retried. `{ ok:false, status ≥ 400 }` (Postmark answered and rejected it) → back to `pending`, stop the loop, mark the send `failed` with the status in `error` and `patchDelivery({ status: "failed", error })`, so "Resume sending" can retry it. After the loop: all batches `sent`/`uncertain` → send `sent`, `finished_at`, counts; `patchDelivery({ status: "sent", sentAt, recipientCount, failedCount, uncertainCount })`.
  7. `resume`: requires a send row with status `sending` or `failed`; set it back to `sending`; every `in_flight` batch → `uncertain` (never re-sent); then `runBatches`.
  8. `count` requests and webhook replays never change `status`.
- Never log recipients or html.

- [ ] **Step 1: Failing tests** (all deps injected/mocked):
  - same request id twice (concurrently via `Promise.all`) → handled once.
  - two broadcast requests for one issue → one set of batches, Postmark called once per batch.
  - broadcast refused with a draft, with a revision mismatch, with no mailing address → no send row, `error` written.
  - 1,201 confirmed recipients minus 1 suppressed → three batches (500/500/200).
  - `sendBatch` per-message error codes → `failedCount` summed.
  - network error during a batch → batch `uncertain`, not retried; a 422 response → batch back to `pending`, send `failed`; resume → `in_flight` batches become `uncertain` and Postmark is not called for them; `pending` batches are sent.
  - test request reads the draft when one exists, sends only to `testEmail`, subject prefixed, uses stream `outbound`.
  - missing env → `error` written, nothing sent.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(newsletter): send engine`.

---

### Task 9: Sanity webhook route

**Files:**
- Create: `src/app/api/newsletter/webhook/route.ts`, `route.test.ts`

**Interfaces:**
- Consumes: `handleRequest`, `readNewsletterEnv`; `parseBody` from `next-sanity/webhook`; `after` from `next/server`.
- `export const maxDuration = 300`. POST only. No secret → 500 "Newsletter webhook is not configured". Invalid signature → 401. Body must have `_id` starting `newsletter.request.`, `issueId`, valid `kind`; else 400. Valid → `after(() => handleRequest({ requestId: _id, issueId, kind, revision }))` and 202 `{ accepted: true }`.

- [ ] **Step 1: Failing tests** modelled on `src/app/api/revalidate/route.test.ts` (signed bodies, fake timer helper): unconfigured 500; bad signature 401; wrong `_id` prefix / kind 400; valid → 202 and `handleRequest` called once with the mapped request (mock `next/server`'s `after` to run the callback).
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(newsletter): sanity webhook route`.

---

### Task 10: Postmark webhook route

**Files:**
- Create: `src/app/api/postmark/webhook/route.ts`, `route.test.ts`

**Interfaces:**
- Consumes: `markUnsubscribed` (Task 6).
- Basic auth from `POSTMARK_WEBHOOK_USER`/`POSTMARK_WEBHOOK_PASSWORD`, compared with `crypto.timingSafeEqual` on equal-length buffers; unset → 500; mismatch → 401. Body `RecordType: "SubscriptionChange"` with `SuppressSending: true` → `markUnsubscribed(Recipient.toLowerCase(), SuppressionReason)`; `SuppressSending: false` or other record types → 200 no-op. Always 200 once authenticated (Postmark retries non-2xx).

- [ ] **Step 1: Failing tests**: unconfigured 500; wrong password 401; suppression → `markUnsubscribed` called with lower-cased email and reason; reactivation → not called; malformed JSON → 400.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(newsletter): postmark subscription webhook`.

---

### Task 11: View in browser

**Files:**
- Create: `src/app/newsletter/issue/[issueId]/route.ts`, `route.test.ts`

**Interfaces:**
- GET: reads `studio_newsletter_sends` by `issue_id` where `status = 'sent'`; none → 404. Returns the stored html with every `{{{pm:unsubscribe}}}` replaced by `{siteUrl}/#newsletter` and the "View in browser" link removed or left (builder's call), headers `content-type: text/html; charset=utf-8`, `x-robots-tag: noindex`, `cache-control: public, max-age=300`. `issueId` must match `^[A-Za-z0-9._-]{1,128}$`, else 404.

- [ ] **Step 1: Failing tests**: 404 for unknown, unsent and malformed ids; 200 with html, noindex header and no `pm:unsubscribe` left.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5: Commit** `feat(newsletter): view in browser`.

---

### Task 12: Studio actions, preview and delivery status

**Files:**
- Create: `src/sanity/newsletter/actions.tsx`, `EmailPreview.tsx`, `DeliveryStatus.tsx`, `useDelivery.ts`, `actions.test.tsx`
- Modify: `sanity.config.ts` (document actions for `studioNewsletterIssue`), `src/sanity/structure.ts` (document views: form, "Email preview" component view)

**Interfaces:**
- Consumes: `ISSUE_QUERY`, `SETTINGS_QUERY`, `resolveIssue` (Task 4), `renderIssue` (Task 3), document types (Task 5).
- Read the Sanity docs for v6 document actions (`DocumentActionComponent`, `useDocumentOperation`, `useClient`, `useEditState`) and `S.view.component` before writing; confirm the private-path assumptions from spec §4 (query a `newsletter.*` doc unauthenticated → not returned; webhook fires on path docs). If either assumption fails, stop and report.
- `useDelivery(issueId)`: live `client.listen` + initial fetch of `newsletter.delivery.{issueId}`.
- `createRequest(client, issueId, kind, revision)`: `client.create({ _id: "newsletter.request." + crypto.randomUUID(), _type: "studioNewsletterRequest", issueId, kind, revision, requestedAt })`.
- Actions (labels exact):
  - "Send test": always enabled for a saved issue; creates `test` with the draft's or published `_rev`; toast "Test on its way to your inbox".
  - "Send to subscribers": disabled with a title explaining why unless published, no draft, and delivery `status` is `idle`/absent or `failed` with `recipientCount` unset. On open: creates `count`, dialog shows "Counting…" until `countedAt` is newer than the open time, then `Send "{subject}" to {n} confirmed subscribers?` with Cancel / Send. Send creates `broadcast` with the published `_rev`.
  - "Resume sending": when `status === "failed"` with `recipientCount` set (a send that started), or `status === "sending"` and the delivery doc's `_updatedAt` is more than 15 minutes old.
- `EmailPreview`: fetches the issue (draft perspective) and settings with the Studio client, `resolveIssue`, `renderIssue` with `unsubscribe: "note"`, shows the HTML in a sandboxed `iframe` (`sandbox=""`, `srcDoc`), phone/desktop width toggle.
- `DeliveryStatus`: a banner at the top of the preview view (and in the "Send to subscribers" dialog) with: last test time, "Sending…", "Sent to N on {date}", failed/uncertain counts, or the error text.
- Duplicate stays enabled (spec §4).

- [ ] **Step 1: Failing tests** (`actions.test.tsx`, Testing Library, Sanity hooks mocked): disabled reasons for draft present / already sent / sending; `count` request created on open; send creates `broadcast` with the published rev; "Resume sending" visibility rule; `createRequest` id prefix.
- [ ] **Step 2–4:** FAIL → implement → PASS. Then load `/studio` in the dev server and check the preview renders an issue (screenshot for Chris).
- [ ] **Step 5: Commit** `feat(newsletter): studio send actions and email preview`.

---

### Task 13: Wire-up check and handover notes

**Files:**
- Modify: `docs/superpowers/specs/2026-11-06-newsletter-design.md` (the `/newsletter/issue/{id}` path and the tokens.ts ruling), `.env.example` (final check)

- [ ] **Step 1:** `npm test && npm run lint && npm run typecheck` all clean.
- [ ] **Step 2:** End-to-end in the dev server with Postmark unset: sign up in the footer → row `pending`, form shows the new message; confirm page with a hand-made token (insert via test helper only, never commit) shows "You're subscribed". Create an issue in the Studio, open Email preview, screenshot desktop and phone for Chris.
- [ ] **Step 3:** Write the PR body's "Manual steps" from spec §7 (Postmark domain and Broadcast stream, Postmark webhook URL with basic auth, Sanity webhook filter/projection/secret, migration, env vars incl. `SANITY_API_TOKEN` Editor role, mailing address, the two test signups).
- [ ] **Step 4: Commit** `docs(newsletter): handover notes`.
