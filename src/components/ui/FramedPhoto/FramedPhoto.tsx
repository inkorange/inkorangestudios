import Image from "next/image";
import type { ImageRef } from "@/lib/sanity/types";
import { Placeholder } from "../Placeholder/Placeholder";
import styles from "./FramedPhoto.module.scss";

export type FramedPhotoProps = {
  photo: ImageRef;
  /** Label on the placeholder shown when there is no photo. */
  label: string;
  /** Keep the photo's own proportions instead of cropping it to 16:9. */
  natural?: boolean;
  /** Load it first: set when the photo is the page's headline image. */
  priority?: boolean;
};

const SIZES = "(min-width: 1024px) 1200px, 100vw";

/** A wide photo in a bordered, rounded frame; the hatched placeholder stands in until one is uploaded. */
export function FramedPhoto({ photo, label, natural = false, priority = false }: FramedPhotoProps) {
  const shape = natural && photo ? "natural" : "wide";
  return (
    <div className={styles.root} data-shape={shape}>
      {!photo ? (
        <Placeholder label={label} radius="none" />
      ) : shape === "natural" ? (
        <Image className={styles.natural} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={SIZES} priority={priority} />
      ) : (
        <Image className={styles.image} src={photo.src} alt={photo.alt} fill sizes={SIZES} priority={priority} />
      )}
    </div>
  );
}
