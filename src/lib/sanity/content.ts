import "server-only";
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
  post: ["studioPost"],
  page: ["studioPage"],
  faq: ["studioFaq"],
  settings: ["studioSettings"],
};

/** Runs a content read; logs once and returns the empty value on any failure. */
async function safely<T>(name: string, empty: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
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

export function getGames(): Promise<GameSummary[]> {
  return safely("getGames", [], async () =>
    compact(rows(await sanityFetch(GAMES_QUERY, {}, TAGS.game)).map(mapGameSummary)),
  );
}

export function getFeatured(): Promise<Featured[]> {
  return safely("getFeatured", [], async () =>
    compact(rows(await sanityFetch(FEATURED_QUERY, {}, TAGS.game)).map(mapGame)).map(toFeatured),
  );
}

export function getGame(slug: string): Promise<Game | null> {
  return safely("getGame", null, async () => mapGame(await sanityFetch(GAME_QUERY, { slug }, TAGS.game)));
}

export function getGameSlugs(): Promise<string[]> {
  return safely("getGameSlugs", [], async () =>
    rows(await sanityFetch(GAME_SLUGS_QUERY, {}, TAGS.game)).filter((s): s is string => typeof s === "string" && s.trim() !== ""),
  );
}

export function getPosts(limit?: number, gameSlug?: string): Promise<PostSummary[]> {
  return safely("getPosts", [], async () => {
    const query = postsQuery({ limit, filterByGame: Boolean(gameSlug) });
    const params = gameSlug ? { gameSlug } : {};
    return compact(rows(await sanityFetch(query, params, TAGS.post)).map(mapPostSummary));
  });
}

export function getPost(slug: string): Promise<Post | null> {
  return safely("getPost", null, async () => mapPost(await sanityFetch(POST_QUERY, { slug }, TAGS.post)));
}

export function getLegalPage(slug: "privacy" | "terms"): Promise<LegalPage | null> {
  return safely("getLegalPage", null, async () => mapLegalPage(await sanityFetch(LEGAL_PAGE_QUERY, { slug }, TAGS.page)));
}

export function getFaqs(): Promise<Faq[]> {
  return safely("getFaqs", [], async () => compact(rows(await sanityFetch(FAQS_QUERY, {}, TAGS.faq)).map(mapFaq)));
}

export function getSettings(): Promise<SiteSettings> {
  return safely("getSettings", mapSettings(null), async () => mapSettings(await sanityFetch(SETTINGS_QUERY, {}, TAGS.settings)));
}
