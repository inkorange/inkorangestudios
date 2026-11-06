export type VideoSource = { kind: "embed"; src: string } | { kind: "file"; src: string };

const YOUTUBE_ID = /^[\w-]{6,}$/;
const VIMEO_ID = /^\d+$/;

// Maps a trailer URL to something playable. YouTube and Vimeo become iframe embeds
// (autoplay is requested because this runs only after the visitor pressed play);
// anything else is treated as a direct video file.
export function parseVideo(url: string): VideoSource {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { kind: "file", src: url };
  }
  const host = u.hostname.replace(/^www\./, "");

  let id: string | null = null;
  if (host === "youtube.com" || host === "m.youtube.com") {
    id = u.pathname === "/watch" ? u.searchParams.get("v") : null;
  } else if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0] || null;
  }
  if (id && YOUTUBE_ID.test(id)) {
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` };
  }

  if (host === "vimeo.com") {
    const vid = u.pathname.slice(1).split("/")[0];
    if (VIMEO_ID.test(vid)) return { kind: "embed", src: `https://player.vimeo.com/video/${vid}?autoplay=1` };
  }
  return { kind: "file", src: url };
}

export function isAbsoluteUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
