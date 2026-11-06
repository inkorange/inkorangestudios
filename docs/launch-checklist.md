# inkOrange Studios launch checklist

Work top to bottom. Env var names all come from `.env.example`.

## 1. Vercel and domain

- [ ] Create the Vercel project from this repo (branch `main` for production).
- [ ] Add the domain `inkorangestudios.com` (and `www`, redirecting to the apex) in Vercel.
- [ ] Point DNS at Vercel as the dashboard instructs; wait for the certificate.
- [ ] Add every env var below to Vercel (Production and Preview). Preview deploys share the production secrets, and Turnstile will not pass on random preview hostnames unless you add them (section 5).
  - [ ] `NEXT_PUBLIC_SITE_URL` = `https://inkorangestudios.com`
  - [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` (same project and dataset as the portfolio)
  - [ ] `SANITY_API_TOKEN`: optional, not used by the site (content reads are unauthenticated). Do not put an Editor token in Vercel.
  - [ ] `SANITY_REVALIDATE_SECRET` (a long random string; see section 3)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `POSTMARK_SERVER_TOKEN`, `FEEDBACK_FROM_EMAIL=hello@inkorangestudios.com`, `FEEDBACK_NOTIFY_EMAIL=thrillgraphics@gmail.com`
  - [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (set both; see section 5)
  - [ ] `NEXT_PUBLIC_GTM_ID` (Google Tag Manager container id; it only loads after a visitor accepts cookies)
  - `SANITY_WRITE_TOKEN` is only for seeding on your machine. Do not put it in Vercel.
- [ ] Deploy, then open the production URL and click through every page.

## 2. Seed the starting content

- [ ] In Sanity (manage.sanity.io, API, Tokens) create a token with the **Editor** role.
- [ ] Put it in `.env.local` as `SANITY_WRITE_TOKEN=...`.
- [ ] Run `npm run seed`. It is safe to run twice: it only creates documents that do not exist, so it never overwrites your edits.
- [ ] Open `/studio` and confirm the five games (TerraForge, Space Cowboy, Mission Control, Exoplanet Explorer, Strata) and the settings document appear.
- [ ] Open the home page and confirm the games show.
- [ ] Revoke or delete the Editor token afterwards.

## 3. Sanity: CORS and webhook

- [ ] Sanity CORS origins: add `https://inkorangestudios.com` (and the Vercel preview domain if you want Studio on previews). Credentials allowed.
- [ ] Create a webhook (manage.sanity.io, API, Webhooks):
  - URL: `https://inkorangestudios.com/api/revalidate`
  - Method: POST
  - Dataset: production
  - Trigger on: create, update, delete, published documents only (leave Drafts off)
  - The webhook's dataset must match `NEXT_PUBLIC_SANITY_DATASET`
  - Filter: `_type match "studio*"`
  - Projection: `{_type, _id}`
  - Secret: the same value as `SANITY_REVALIDATE_SECRET` in Vercel
- [ ] Publish a small edit in Studio and confirm it shows on the live site within a minute.

## 4. Postmark (notification emails)

- [ ] In Postmark, add the sender signature domain `inkorangestudios.com`.
- [ ] Add the DKIM record and the Return-Path CNAME it gives you to DNS; click Verify until both pass.
- [ ] Set `FEEDBACK_FROM_EMAIL=hello@inkorangestudios.com` in Vercel.
- [ ] Until the domain is verified, Postmark rejects the notification emails (logged as `[signups] postmark responded <status>`). Signups and messages are still saved, so nothing is lost; you just are not emailed.
- [ ] After verifying, submit the contact form on `/about` once and confirm the email arrives at `FEEDBACK_NOTIFY_EMAIL`.

## 5. Cloudflare Turnstile

- [ ] Create a Turnstile widget with hostnames `inkorangestudios.com` and the Vercel preview domain.
- [ ] Set **both** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. If only the secret is set, the server demands a token that the form can never produce, and every submission fails.
- [ ] Submit a form on the live site to confirm it works.

## 6. Content for you to write in Studio

The site shows empty states, never placeholder text, until these exist.

- [ ] Privacy policy (the page hides from search engines until it has content).
- [ ] Terms of service.
- [ ] FAQs.
- [ ] Support email (Settings).
- [ ] Social links (Settings).
- [ ] Studio photo (Settings).
- [ ] Cover art for every game, and key art for the games other than TerraForge.
- [ ] Confirm the seeded founded line is right.
- [ ] Confirm or rewrite the Exoplanet Explorer and Strata blurbs (the seed wrote first drafts).
- [ ] Press kit: the "Press" nav item and "Press kit" footer link currently just scroll to the footer. Set `pressKitUrl` per game in Studio to fill the game page's Press kit card.
- [ ] Optional: an SVG logo to replace the PNG.

## 7. Where signups land

Submissions go to the shared Supabase project. View them in the Supabase dashboard (Table Editor):

- `studio_newsletter_signups`
- `studio_beta_signups`
- `studio_launch_alerts`
- `studio_contact_messages`

The four tables already exist in the shared project (migration `supabase/migrations/0001_studio_signups.sql`, applied by hand; never run `supabase db push`).

Duplicate signups are stored once and shown as a normal success to the visitor.

## 8. Final pass

- [ ] Delete any test rows from the tables above. In particular, delete the QA rows with email `qa+t21@inkorangestudios.com` from `studio_newsletter_signups` and `studio_contact_messages`.
- [ ] Check `/sitemap.xml`, `/robots.txt` and a shared link preview (`/opengraph-image`).
- [ ] Accept and decline the cookie banner; confirm GTM only loads after Accept.
