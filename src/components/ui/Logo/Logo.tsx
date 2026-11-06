import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.scss";

export type LogoProps = {
  size?: "s" | "m" | "l";
  href?: string;
  /** One-time sketch, paint, digital reveal. Off under reduced motion. */
  animate?: boolean;
};

export function Logo({ size = "m", href, animate = false }: LogoProps) {
  const image = (
    <span className={styles.root} data-size={size} data-animate={animate}>
      <Image
        className={styles.image}
        src="/brand/inkorange-logo.png"
        alt="inkOrange Studios"
        width={2199}
        height={829}
        sizes="220px"
        priority={animate}
      />
    </span>
  );
  if (!href) return image;
  return (
    <Link href={href} className={styles.link}>
      {image}
    </Link>
  );
}
