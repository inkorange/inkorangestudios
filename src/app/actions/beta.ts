"use server";

import { publicEnv } from "@/lib/env";
import { betaPlatformLabel } from "@/lib/games";
import { getGame } from "@/lib/sanity/content";
import type { Game } from "@/lib/sanity/types";
import { notifyOwner } from "@/lib/signups/notify";
import { verifyTurnstile } from "@/lib/signups/turnstile";
import { insertOnce, remoteIp } from "@/lib/signups/store";
import { rejection, validateBeta } from "@/lib/signups/validate";
import type { FormState } from "@/lib/signups/types";

/** The game, for its name and tester setting. Best effort: Sanity being down must not lose a signup. */
async function findGame(slug: string): Promise<Game | null> {
  try {
    return await getGame(slug);
  } catch {
    return null;
  }
}

export async function joinBeta(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = validateBeta(fd);
  if (!v.ok) return rejection(v);
  const { email, game, platform, source } = v.value;

  const token = String(fd.get("captchaToken") ?? "");
  if (!(await verifyTurnstile(token, await remoteIp()))) {
    return { status: "error", error: "Please complete the human check and try again." };
  }

  const found = await findGame(game);
  const name = found?.name ?? game;
  // A page cached before testing closed can still show the form.
  if (found?.beta?.state === "closed") {
    return { status: "error", error: `Beta testing for ${name} has closed. Thanks for your interest!` };
  }

  const r = await insertOnce("studio_beta_signups", { email, game, platform, source }, "email,game");
  if (!r.ok) return { status: "error", error: "Something went wrong. Please try again." };

  // Only for a new row: a repeat signup must not mail the owner again.
  if (r.isNew) {
    const where =
      source === "game-page"
        ? `the ${name} game page (${publicEnv.siteUrl}/games/${game})`
        : `the home page beta callout (${publicEnv.siteUrl}/#beta)`;
    try {
      await notifyOwner({
        subject: `Beta tester for ${name}: ${email}`,
        replyTo: email,
        lines: [
          `${email} opted in to beta test ${name}.`,
          "",
          `Email: ${email}`,
          `Game: ${name}`,
          `Platform: ${platform ? betaPlatformLabel(platform) : "not specified"}`,
          `Signed up on: ${where}`,
          "",
          "Reply to this email to send them the beta invite.",
        ],
      });
    } catch {
      // notifyOwner never throws by contract; the row is saved either way.
    }
  }
  return { status: "ok" };
}
