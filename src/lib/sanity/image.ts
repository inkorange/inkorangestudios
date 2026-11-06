import createImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { publicEnv } from "@/lib/env";
import type { ImageRef } from "@/lib/sanity/types";

export function urlFor(source: SanityImageSource) {
  return createImageUrlBuilder({
    projectId: publicEnv.sanityProjectId,
    dataset: publicEnv.sanityDataset,
  }).image(source);
}

export type SanityImageInput = {
  alt?: string | null;
  asset?: {
    _ref?: string;
    _id?: string;
    metadata?: { dimensions?: { width: number; height: number } };
  } | null;
  dimensions?: { width: number; height: number };
  [key: string]: unknown;
} | null | undefined;

const REF_PATTERN = /^image-[A-Za-z0-9]+-(\d+)x(\d+)-[a-z0-9]+$/;

function dimensionsOf(img: NonNullable<SanityImageInput>) {
  const fromMeta = img.dimensions ?? img.asset?.metadata?.dimensions;
  if (fromMeta?.width && fromMeta?.height) return fromMeta;
  const ref = img.asset?._ref ?? img.asset?._id;
  const m = ref ? REF_PATTERN.exec(ref) : null;
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
}

type Crop = { top: number; bottom: number; left: number; right: number };
type Hotspot = { x: number; y: number; width: number; height: number };

const fraction = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;

/** The Studio crop (fractions trimmed from each edge), when well-formed and leaving some image. */
function cropOf(v: unknown): Crop | undefined {
  if (!v || typeof v !== "object") return undefined;
  const { top, bottom, left, right } = v as Record<string, unknown>;
  if (![top, bottom, left, right].every(fraction)) return undefined;
  const c = { top, bottom, left, right } as Crop;
  return c.left + c.right < 1 && c.top + c.bottom < 1 ? c : undefined;
}

function hotspotOf(v: unknown): Hotspot | undefined {
  if (!v || typeof v !== "object") return undefined;
  const { x, y, width, height } = v as Record<string, unknown>;
  return [x, y, width, height].every(fraction) ? ({ x, y, width, height } as Hotspot) : undefined;
}

/**
 * Null when the asset or alt text is missing, or the asset ref is unparseable and no dimensions are given.
 * The Studio crop and hotspot go to the URL builder (the crop becomes a `rect`), and the height keeps the
 * aspect ratio of the cropped region.
 */
export function toImageRef(img: SanityImageInput, width: number): ImageRef {
  if (!img || !img.asset || !img.alt?.trim()) return null;
  const ref = img.asset._ref ?? img.asset._id;
  const dims = dimensionsOf(img);
  if (!ref || !dims) return null;
  const crop = cropOf(img.crop);
  const hotspot = hotspotOf(img.hotspot);
  const source = { asset: { _ref: ref }, ...(crop ? { crop } : {}), ...(hotspot ? { hotspot } : {}) };
  const src = urlFor(source).width(width).auto("format").url();
  const visibleWidth = dims.width * (1 - (crop ? crop.left + crop.right : 0));
  const visibleHeight = dims.height * (1 - (crop ? crop.top + crop.bottom : 0));
  return {
    src,
    alt: img.alt.trim(),
    width,
    height: Math.round((width * visibleHeight) / visibleWidth),
  };
}
