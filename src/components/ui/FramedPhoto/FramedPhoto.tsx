import Image from "next/image";
import type { ImageRef } from "@/lib/sanity/types";
import { Placeholder } from "../Placeholder/Placeholder";
import styles from "./FramedPhoto.module.scss";

export type FramedPhotoProps = {
  photo: ImageRef;
  /** Label on the placeholder shown when there is no photo. */
  label: string;
};

/** A wide photo in a bordered, rounded frame; the hatched placeholder stands in until one is uploaded. */
export function FramedPhoto({ photo, label }: FramedPhotoProps) {
  return (
    <div className={styles.root}>
      {photo ? (
        <Image className={styles.image} src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 1200px, 100vw" />
      ) : (
        <Placeholder label={label} radius="none" />
      )}
    </div>
  );
}
