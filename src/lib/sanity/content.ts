import "server-only";
import { cache } from "react";
import { publicEnv } from "@/lib/env";
import {
  FAQS_QUERY,
  FEATURED_QUERY,
  GAME_QUERY,
  GAME_SLUGS_QUERY,
  GAMES_QUERY,
  LEGAL_PAGE_QUERY,
  POST_QUERY,
  postsQuery,
  SETTINGS_QUERY,
} from "./queries";
import { sanityFetch } from "./client";
import { mapFaq, mapGame, mapGameSummary, mapLegalPage, mapPost, mapPostSummary, mapSettings, toFeatured } from "./mappers";
import type { Faq, Featured, Game, GameSummary, LegalPage, Post, PostSummary, SiteSettings } from "./types";

const TAGS = {
  game: ["studioGame"],
  // post, faq and settings dereference game->, so publishing a game must revalidate them too.
  post: ["studioPost", "studioGame"],
  page: ["studioPage"],
  faq: ["studioFaq", "studioGame"],
  settings: ["studioSettings", "studioGame"],
};

const isTest = () => process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

/*
 * Errors are swallowed only while `next build` prerenders (and in tests), so an
 * empty or unreachable dataset still builds: pages render their empty states
 * (Review Focus 4). At runtime (ISR revalidation, on-demand pages, `next dev`)
 * they are rethrown: Next keeps serving the last good page instead of caching
 * an empty site or a 404, and a request with nothing cached shows src/app/error.tsx.
 */
const swallowErrors = () => process.env.NEXT_PHASE === "phase-production-build" || isTest();

/** A production build or server without a Sanity project would publish an empty site: refuse. */
function assertConfigured() {
  if (!publicEnv.sanityProjectId && process.env.NODE_ENV === "production" && !isTest()) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set; refusing to build or serve the site without its content.");
  }
}

/** Runs a content read. During the build (and tests) a failure logs once and returns the empty value; at runtime it throws. */
async function safely<T>(name: string, empty: T, run: () => Promise<T>): Promise<T> {
  assertConfigured();
  try {
    return await run();
  } catch (err) {
    if (!swallowErrors()) throw err;
    console.error(`[content] ${name} failed`, err);
    return empty;
  }
}

function rows(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : [];
}

function compact<T>(items: (T | null)[]): T[] {
  return items.filter((i): i is T => i !== null);
}

function getGamesUncached(): Promise<GameSummary[]> {
  return safely("getGames", [], async () =>
    compact(rows(await sanityFetch(GAMES_QUERY, {}, TAGS.game)).map(mapGameSummary)),
  );
}

function getFeaturedUncached(): Promise<Featured[]> {
  return safely("getFeatured", [], async () =>
    compact(rows(await sanityFetch(FEATURED_QUERY, {}, TAGS.game)).map(mapGame)).map(toFeatured),
  );
}

function getGameUncached(slug: string): Promise<Game | null> {
  return safely("getGame", null, async () => mapGame(await sanityFetch(GAME_QUERY, { slug }, TAGS.game)));
}

export function getGameSlugs(): Promise<string[]> {
  return safely("getGameSlugs", [], async () =>
    rows(await sanityFetch(GAME_SLUGS_QUERY, {}, TAGS.game)).filter((s): s is string => typeof s === "string" && s.trim() !== ""),
  );
}

function getPostsUncached(limit?: number, gameSlug?: string): Promise<PostSummary[]> {
  return safely("getPosts", [], async () => {
    const query = postsQuery({ limit, filterByGame: Boolean(gameSlug) });
    const params = gameSlug ? { gameSlug } : {};
    return compact(rows(await sanityFetch(query, params, TAGS.post)).map(mapPostSummary));
  });
}

function getPostUncached(slug: string): Promise<Post | null> {
  return safely("getPost", null, async () => mapPost(await sanityFetch(POST_QUERY, { slug }, TAGS.post)));
}

function getLegalPageUncached(slug: "privacy" | "terms"): Promise<LegalPage | null> {
  return safely("getLegalPage", null, async () => mapLegalPage(await sanityFetch(LEGAL_PAGE_QUERY, { slug }, TAGS.page)));
}

function getFaqsUncached(): Promise<Faq[]> {
  return safely("getFaqs", [], async () => compact(rows(await sanityFetch(FAQS_QUERY, {}, TAGS.faq)).map(mapFaq)));
}

function getSettingsUncached(): Promise<SiteSettings> {
  return safely("getSettings", mapSettings(null), async () => mapSettings(await sanityFetch(SETTINGS_QUERY, {}, TAGS.settings)));
}

// Per-request dedupe: layouts and pages read the same content, so each fetch runs once per render.
export const getGames = cache(getGamesUncached);
export const getFeatured = cache(getFeaturedUncached);
export const getGame = cache(getGameUncached);
export const getPosts = cache(getPostsUncached);
export const getPost = cache(getPostUncached);
export const getLegalPage = cache(getLegalPageUncached);
export const getFaqs = cache(getFaqsUncached);
export const getSettings = cache(getSettingsUncached);
