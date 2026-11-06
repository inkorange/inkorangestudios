# Newsletter: write in the Studio, send through Postmark

Date: 2026-11-06
Status: draft for approval
Builds on: `docs/superpowers/specs/2026-11-05-inkorange-studios-website-design.md`

## Intent

Chris wants to email the people who subscribe in the site footer: a studio
roundup that walks through what's new with each project (Exoplanet Explorer,
TerraForge, Space Cowboy, other sites like "Molecular") and, above all,
recruits beta testers. He chose to build this into the site and send through
Postmark (already used for owner notices) instead of adopting Mailchimp or
Buttondown: no extra subscription, emails that match the site, subscribers in
his own Supabase.

He writes issues where he already writes content, the embedded Sanity Studio
at `/studio`, often from his phone while away from the desk.

## Goals

1. Write an issue in the Studio as a list of sections, each about one project.
2. A section linked to a game fills in that game's art, name and status tags;
   Chris writes the update text and can override the button.
3. Free sections for anything that isn't a game document (title, text, image,
   link).
4. Preview the exact email, send a test to himself, then send to every
   confirmed subscriber, from buttons on the issue in the Studio.
5. An issue can never go out to subscribers twice.
6. New subscribers confirm their email (double opt-in) before receiving issues.
7. One-click unsubscribe on every issue, reflected back in Supabase.
8. Images are resized and re-encoded for email automatically.

## Non-goals

- Scheduled sending. Sending is always a button press.
- Personalisation (names, merge fields) or segments. One list, one email.
- A subscriber admin screen. Supabase and Postmark dashboards cover it.
- Adding beta testers or launch-alert signups to the newsletter list.
- A drag-and-drop email editor.
- An on-site archive of issues. ("View in browser" is a goal; listing issues
  on the News page is not.)
- Open/click analytics in the site. Postmark's dashboard shows them.

## Anti-goals (a failure even if it "works")

- Any path that lets a non-editor trigger a send, or lets one press send the
  issue twice (retries, double taps, webhook redelivery).
- An email to an unconfirmed or unsubscribed address.
- The signup form revealing whether an address is already subscribed.
- Logging or committing subscriber addresses, tokens or secrets.
- Images that break in Outlook/Gmail (WebP, multi-MB originals).
- Touching the portfolio's Sanity types or other apps' Supabase tables.

## Constraints

Everything in `CLAUDE.md` applies, in particular:

- Sanity types are prefixed `studio`; the dataset is shared with
  `~/web/portfolio`. No `sanity schema deploy` / `sanity deploy` (the Studio is
  embedded and ships with the site).
- Supabase tables are prefixed `studio_`, RLS on, no policies, service role
  only, explicit grants. Migrations are SQL files in `supabase/migrations/`
  applied by hand, never `supabase db push`. Idempotent statements.
- Never print or commit secrets; every new variable goes in `.env.example`.
- Site UI follows `DESIGN.md`; `src/app/**` composes `src/components/ui` only.
  The email template is not site UI (see "Email rendering").
- Next.js 16: read `node_modules/next/dist/docs/` before writing route
  handlers, `after()` or server actions.

## What Chris decided

- **Layout A** from the mockups: logo and issue line at the top, optional
  headline and intro, then one full-width card per section (art, status chips,
  title, text, one button), free sections on the watercolor wash, dark footer.
- **Sending from the Studio**: Preview, Send test (to himself only), Send to
  subscribers with a confirmation that names the recipient count; the issue is
  then marked sent with the date and can't be sent again.
- **Double opt-in**.
- **Images scaled for email** automatically.
- System font fallback for display type in email clients is acceptable.

## The design

### 1. Content: `studioNewsletterIssue` (Sanity)

Fields:

- `subject` (string, required): the email subject.
- `preheader` (string, ≤ 120 chars): the inbox preview line.
- `issueLine` (string, optional): e.g. "Studio notes · No. 1 · November 2026".
- `headline` (string, optional) and `intro` (portable text, optional).
- `sections` (array, required, ≥ 1) of:
  - `gameSection`: `game` (reference to `studioGame`, required), `body`
    (portable text, required), optional `buttonLabel` + `buttonUrl`
    overrides, optional `image` override (with alt).
  - `freeSection`: `eyebrow` (string, optional, e.g. "Also new"), `title`
    (required), `body` (portable text, required), `image` (optional, alt
    required), `buttonLabel` + `buttonUrl` (optional, both or neither).
- Delivery state is not stored on the issue (see §4).

Portable text in issues allows paragraphs, bold, italic and links only (no
headings, lists or images inside the body) so the email renderer stays small
and safe.

The type appears in the Studio desk as "Newsletter" under News. It is not
listed on the site.

### 2. What a game section shows

From the referenced game, at send time (not frozen at write time, except as
recorded in §4):

- **Art**: the section's own image if set, else the game's key art, else its
  cover art, else no image (no placeholder in email).
- **Chips**: the status chip (accent for "Out now" and for an open beta,
  outline otherwise) and the platform chips, mirroring the game page's
  top row. Genres are not shown.
- **Title**: the game name.
- **Button**, first that applies:
  1. the section's override;
  2. the game's beta signup is open → "Join the beta" to
     `/games/{slug}#beta` (the game page has no such anchor yet: add
     `id="beta"` to its beta band);
  3. the game has a primary CTA → its label and URL;
  4. otherwise "Game details" → `/games/{slug}`.

Store badges are not shown in email (they're images that need extra care and
the button already covers the action). *Builder's call if trivial.*

### 3. Email rendering

- A pure module (no server-only imports) renders an issue to
  `{ subject, html, text }`. The same function feeds the Studio preview (in
  the browser), the test send, the broadcast and "view in browser".
- HTML is table-based with inline styles, 600px max width, built from the
  `tokens.scss` values (colours, radii) copied into one email-theme constant.
  Exempt from the "raw values only in tokens.scss" rule because email clients
  can't read CSS variables; the theme constant is the single place they live,
  and a test asserts it matches `tokens.scss`.
- The builder chooses between a small hand-written renderer and a library
  (e.g. React Email). Either way: no remote CSS, no web fonts required (Barlow
  Condensed via `font-family` with "Arial Narrow", Arial fallbacks), and a
  plain-text part generated from the same content.
- Images go through the Sanity image URL builder: card art `w=1200`, 2:1
  crop honouring the Studio hotspot, icons `w=128`, `fm=jpg` for photos (PNG
  only where transparency matters), `q=75`, `auto=format` **off** (it can
  return WebP). Every `<img>` has width/height and alt.
- Links get absolute URLs on `NEXT_PUBLIC_SITE_URL`.
- Footer: logo, "You're getting this because you signed up at
  inkorangestudios.com", unsubscribe link (Postmark's `{{{pm:unsubscribe}}}`
  placeholder in both the HTML and text parts of the broadcast; stripped
  from the frozen copy used for "view in browser"; a plain note in previews
  and tests), "View in
  browser" link, and the mailing address from Settings (§6). Sending is
  blocked while the address is empty.
- "View in browser": a public route `/newsletter/{issueId}` that renders the
  same HTML for a **sent** issue only (404 otherwise), `noindex`. This is a raw
  HTML response, not a site page, so the `src/app/**` className rule doesn't
  apply to the email markup (it's produced by the renderer module).

### 4. Sending (Studio buttons → request documents → signed webhook → server)

Why this shape: the Studio runs in the browser, so a button can't hold a
secret, and the site has no login of its own. The Studio logs in with a
cookie on Sanity's domain, so site code can't read the editor's token either.
The only identity the site can trust is "someone with edit rights in the
Sanity project". So the Studio buttons don't call the site directly: each
press **creates a request document** (only editors can), and a **signed
Sanity webhook** (the same pattern as `/api/revalidate`) tells the site to
act.

**Private documents.** The dataset is publicly readable. Documents whose
`_id` contains a dot (a "path", e.g. `newsletter.request.<uuid>`) are not
returned to unauthenticated reads, but logged-in Studio users and the server
token see them. All request and delivery documents live under the
`newsletter.` path. Issues themselves are ordinary documents and become public
when published (which the broadcast requires; see below), same as a sent
issue's "view in browser" page. *Builder: confirm path privacy and that
webhooks fire for path documents before relying on it; if either fails, stop
and report.*

Documents (server-owned except where noted):

- `studioNewsletterRequest`, `_id: newsletter.request.<uuid>`: created by
  the Studio action, never edited. Fields: `issueId`, `kind` (`test` |
  `count` | `broadcast` | `resume`), `revision` (the issue revision the
  editor was looking at), `requestedAt`. Created directly as a published
  document (no draft), so the webhook fires once on create.
- `studioNewsletterDelivery`, `_id: newsletter.delivery.<issueId>`: written
  only by the server. Fields: `status` (`idle` | `sending` | `sent` |
  `failed`), `audienceCount` + `countedAt`, `lastTest` (`at`, `revision`),
  `sentAt`, `recipientCount`, `failedCount`, `uncertainCount`, `error`. It is
  not a field on the issue, so drafts, publishing, restoring history and
  Duplicate never copy or overwrite it. Neither type appears in the desk
  list; the issue view reads its delivery document live.

Studio side (custom document actions on `studioNewsletterIssue` only):

- **Preview**: renders the current draft in the Studio. The renderer is a
  pure module (data in, `{ subject, html, text }` out, no server-only
  imports) so the Studio can run it in the browser with data it fetches
  through its own logged-in client. No preview route on the site.
- **Send test**: creates a `test` request. The server renders the **draft
  if one exists, else the published issue** (reading drafts with the server
  token), so nothing has to be published to test. Tests go to
  `NEWSLETTER_TEST_EMAIL` only. Subject prefixed "[Test] ".
- **Send to subscribers**: enabled only when the issue is published, has no
  unpublished changes, and the delivery status is `idle` (or `failed` before
  any message went out). Otherwise the action says why ("Publish your
  changes first", "Already sent on …"). Opening it creates a `count` request
  and shows "Counting…" until `audienceCount` lands on the delivery document,
  then "Send "{subject}" to {n} confirmed subscribers?". Confirm creates a
  `broadcast` request carrying the published revision. *My call: refuse
  while a draft exists, rather than publish silently, so what's sent is
  exactly what was last reviewed.*
- **Resume**: shown only when status is `sending` and nothing has happened
  for 15 minutes; creates a `resume` request.
- The issue's document view shows delivery status live: last test,
  "Sending…", "Sent to N on {date}", uncertain/failed counts, or the error.
- Duplicate stays available: a copy has no requests and no delivery document,
  so it starts fresh.

Server side: `POST /api/newsletter/webhook`, with `maxDuration` set
explicitly (`after()` runs up to it).

- Verifies the Sanity webhook signature with `NEWSLETTER_WEBHOOK_SECRET`
  (refuses to run without it, like revalidate). Webhook: type
  `studioNewsletterRequest`, **create only**, published documents, projection
  `{_id, issueId, kind, revision}`.
- **Every request is handled at most once**: insert its `_id` into
  `studio_newsletter_requests (request_id unique, …)` first; a conflict means
  it was already handled (webhook retry): stop. This covers retries,
  redelivery and replays.
- Responds 200 quickly and does the work in `after()`.
- **test**: render, send one message on the transactional stream, write
  `lastTest` and `audienceCount` to the delivery document.
- **count**: write `audienceCount`.
- **broadcast**, exactly once per issue:
  1. Re-read the published issue; refuse (write `error`) if its revision
     differs from the request's, or it has a draft, or the mailing address is
     empty.
  2. Claim the issue by inserting `studio_newsletter_sends(issue_id unique,
     request_id, status='sending', started_at)`. A conflict means it's
     already claimed: stop.
  3. Write delivery `status = "sending"`.
  4. Snapshot the audience (confirmed, not unsubscribed, not suppressed on
     the stream) and the rendered subject/html/text into the send row, so
     "view in browser" shows what was sent even if the game changes later.
  5. Split into batches of ≤ 500 recipients, stored as
     `studio_newsletter_send_batches` rows (`pending`). For each batch:
     atomically move `pending → in_flight` (a conditional update; zero rows
     updated means someone else has it), call Postmark's batch API on the
     Broadcast stream (one message per recipient, never a visible list),
     then record per-message results and mark it `sent`.
  6. Mark the send `sent` (or `failed`), write `sentAt`, `recipientCount`,
     `failedCount`, `uncertainCount` to the delivery document.
- **resume**: continues `pending` batches only. A batch left `in_flight`
  (the call may or may not have reached Postmark) is marked `uncertain` and
  **never re-sent**; its recipients are counted in `uncertainCount` and shown
  in the Studio. *My call: nobody gets the issue twice; at this list size
  an uncertain batch is rare and visible.*

Draft-reads and delivery writes use `SANITY_API_TOKEN`, which is already set
in Vercel for preview and production (until now unused by the site). It must
have the Editor role (see §7).

### 5. Subscribers: double opt-in and unsubscribe

Supabase changes (new migration `0002_newsletter.sql`, applied by hand):

- `studio_newsletter_signups` gains `status` (`pending` | `confirmed` |
  `unsubscribed`, default `pending`), `confirm_token_hash`,
  `confirm_sent_at`, `confirmed_at`, `unsubscribed_at`. Existing rows become
  `pending` (they're Chris's tests).
- `unsubscribe_reason` (text, nullable).
- New `studio_newsletter_requests`, `studio_newsletter_sends` and
  `studio_newsletter_send_batches` (§4).
- Same RLS/grant pattern as `0001`.

Flow:

1. Footer signup (existing form, Turnstile and honeypot unchanged). New
   address → `pending` row, a random token (only its SHA-256 hash stored), and
   a confirmation email on the transactional stream. Success message becomes
   "Check your inbox to confirm your subscription."
2. Same message for every outcome so the form never reveals membership:
   - pending → new token, resend the email (throttled: at most one per
     address per 10 minutes);
   - confirmed → no email;
   - unsubscribed → back to `pending` with a new token and email (they asked
     again).
3. `GET /newsletter/confirm?token=…` → a site page (composed from
   `src/components/ui`) saying "You're subscribed" or "This link has expired"
   (7 days) with the footer form to try again. Confirm marks `confirmed` and
   clears the token. *The page needs no new ui components unless the builder
   finds a real gap.* Link scanners prefetching GETs is an accepted risk at
   this scale; the builder may require a button press (POST) if cheap.
4. Unsubscribe: Postmark's managed one-click unsubscribe on the Broadcast
   stream. A Postmark **Subscription Change** webhook to
   `POST /api/postmark/webhook` (HTTP basic auth from
   `POSTMARK_WEBHOOK_USER`/`POSTMARK_WEBHOOK_PASSWORD`, checked in constant
   time) marks the row `unsubscribed` for any suppression reason
   (unsubscribe, hard bounce, spam complaint, manual), storing the reason.
   If Postmark later reactivates the
   address (`SuppressSending: false`), leave the row as is; re-subscribing
   goes through the form.
5. Before every broadcast the audience also excludes addresses Postmark
   reports as suppressed on the stream (one call to the stream's suppression
   dump).

Confirmation email: same visual shell as issues (logo, one paragraph, a
"Confirm my subscription" button, footer with mailing address, no
unsubscribe link needed).

### 6. Settings and environment

`studioSettings` gains `newsletter`:

- `mailingAddress` (text, required to send): CAN-SPAM postal address.
- `fromName` (string, default "inkOrange Studios").

New environment variables (all in `.env.example` with comments):

- `NEWSLETTER_FROM_EMAIL`: verified sender, e.g. `news@inkorangestudios.com`.
- `NEWSLETTER_TEST_EMAIL`: where tests go.
- `POSTMARK_BROADCAST_STREAM`: the Broadcast stream id, e.g. `newsletter`.
- `NEWSLETTER_WEBHOOK_SECRET`: Sanity webhook secret for sending.
- `POSTMARK_WEBHOOK_USER`, `POSTMARK_WEBHOOK_PASSWORD`: basic auth for the
  Postmark webhook.
- Reuses `POSTMARK_SERVER_TOKEN`, `SANITY_API_TOKEN` (Editor role), Supabase keys.

If Postmark or the broadcast stream isn't configured, the Studio shows why in
the delivery status instead of failing silently. Signups still save; the
confirmation email simply can't go out until Postmark works (the row stays
`pending`, and signing up again resends).

### 7. Chris's manual steps (documented in the PR)

1. Verify the sending domain in Postmark (DKIM, Return-Path).
2. Create the Broadcast message stream; set managed unsubscribe.
3. Add the Subscription Change webhook (URL with basic auth).
4. Add the Sanity webhook for `/api/newsletter/webhook`: type
   `studioNewsletterRequest`, create only, the projection above, secret set.
5. Apply `0002_newsletter.sql` by hand.
6. Set the new env vars in Vercel. Confirm the existing `SANITY_API_TOKEN`
   has the Editor role in sanity.io/manage → API → Tokens (it can then write
   the whole shared project, portfolio included: accepted by Chris). Fill in
   the mailing address in Settings.
7. Delete or re-subscribe the two test signups.

## Testing expectations

- Unit tests for the renderer (each section kind, fallbacks, button rules,
  image URLs never WebP, absolute links, footer address, text part).
- Unit tests for the signup state machine (every row state × resubmit) and
  confirmation token expiry.
- Route tests for both webhooks: bad signature/auth rejected, a request
  handled once under retries, broadcast refused with a draft or a revision
  mismatch, broadcast claimed once under concurrent calls, a batch claimed
  once by concurrent resumes, `in_flight` batches become `uncertain` and are
  never re-sent, Postmark per-message errors recorded.
- Schema tests (alt on every image, prefixes) extend the existing ones.
- No test sends real email; Postmark and Supabase are mocked at the fetch /
  client boundary.

## Left to the builder

- Renderer approach (hand-written vs library, but it must run in the
  browser too), file layout, exact field
  titles and help text.
- Studio UI details for preview and delivery status.
- Rate-limit mechanism for confirmation resends.
- Postmark's newer bulk API for broadcast streams instead of the batch
  endpoint, if it's documented and makes batch bookkeeping simpler while
  keeping the at-most-once rules above.
- Whether the confirm link needs a button press.
- Store badges in email (only if trivial).
