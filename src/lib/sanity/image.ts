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

/** Null when the asset or alt text is missing, or the asset ref is unparseable and no dimensions are given. Height keeps the source aspect ratio. */
export function toImageRef(img: SanityImageInput, width: number): ImageRef {
  if (!img || !img.asset || !img.alt?.trim()) return null;
  const dims = dimensionsOf(img);
  if (!dims) return null;
  const src = urlFor(img as SanityImageSource).width(width).auto("format").url();
  return {
    src,
    alt: img.alt.trim(),
    width,
    height: Math.round((width * dims.height) / dims.width),
  };
}
