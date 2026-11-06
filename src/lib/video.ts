export type VideoSource = { kind: "embed"; src: string } | { kind: "file"; src: string } | { kind: "unsupported" };

const YOUTUBE_ID = /^[\w-]{6,}$/;
const VIMEO_ID = /^\d+$/;
const VIMEO_HASH = /^[a-z0-9]{6,}$/i;
const YOUTUBE_HOSTS = new Set(["youtube.com", "m.youtube.com", "music.youtube.com"]);
const UNSUPPORTED: VideoSource = { kind: "unsupported" };

function youtube(id: string | null | undefined): VideoSource {
  if (!id || !YOUTUBE_ID.test(id)) return UNSUPPORTED;
  return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` };
}

function vimeo(id: string | undefined, hash: string | null | undefined): VideoSource {
  if (!id || !VIMEO_ID.test(id)) return UNSUPPORTED;
  const h = hash && VIMEO_HASH.test(hash) ? `&h=${hash}` : "";
  return { kind: "embed", src: `https://player.vimeo.com/video/${id}?autoplay=1${h}` };
}

// Maps a trailer URL to something playable. YouTube and Vimeo become iframe embeds
// (autoplay is requested because this runs only after the visitor pressed play);
// other http(s) URLs are treated as direct video files. Anything we can't play
// (empty, non-http(s), a video host URL without a valid ID) is "unsupported".
export function parseVideo(url: string): VideoSource {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return UNSUPPORTED;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return UNSUPPORTED;

  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const segs = u.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    if (segs[0] === "watch") return youtube(u.searchParams.get("v"));
    if (segs[0] === "shorts" || segs[0] === "embed" || segs[0] === "live") return youtube(segs[1]);
    return UNSUPPORTED;
  }
  if (host === "youtu.be") return youtube(segs[0]);

  if (host === "vimeo.com") {
    const h = u.searchParams.get("h");
    if (segs[0] === "channels") return vimeo(segs[2], h);
    if (segs[0] === "groups") return segs[2] === "videos" ? vimeo(segs[3], h) : UNSUPPORTED;
    return vimeo(segs[0], segs[1] ?? h);
  }
  if (host === "player.vimeo.com") return segs[0] === "video" ? vimeo(segs[1], u.searchParams.get("h")) : UNSUPPORTED;

  return { kind: "file", src: u.href };
}

export function isAbsoluteUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
