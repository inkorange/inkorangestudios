"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navStateForPath, type HeaderVariant, type NavKey } from "@/lib/nav";
import { Button } from "../Button/Button";
import { Container } from "../Container/Container";
import { Icon } from "../Icon/Icon";
import { Logo } from "../Logo/Logo";
import { NavPillBar } from "../NavPillBar/NavPillBar";
import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.scss";

export type SiteHeaderProps = {
  active?: NavKey;
  variant?: HeaderVariant;
  backLink?: { label: string; href: string };
};

const DEFAULT_BACK = { label: "Games", href: "/#games" };

/**
 * Renders the desktop and phone layouts together and switches them with CSS,
 * so the server markup never depends on viewport width.
 *
 * Mounted once by the site layout, so `active` and `variant` default to what the
 * current pathname implies (`navStateForPath`); explicit props win.
 */
export function SiteHeader({ active: activeProp, variant: variantProp, backLink = DEFAULT_BACK }: SiteHeaderProps) {
  const fromPath = navStateForPath(usePathname());
  const active = activeProp ?? fromPath.active;
  const variant = variantProp ?? fromPath.variant;
  return (
    <header className={styles.root} data-variant={variant}>
      <Container>
        <div className={styles.desktop}>
          <Logo href="/" />
          <NavPillBar active={active} />
          <Button variant="accent" href="#newsletter">
            Get the newsletter
          </Button>
        </div>
        <div className={styles.phone}>
          {variant === "game" ? (
            <>
              <Link href={backLink.href} className={styles.back}>
                <Icon name="chevron-left" />
                {backLink.label}
              </Link>
              <Logo href="/" size="s" />
            </>
          ) : (
            <Logo href="/" />
          )}
          <MobileMenu active={active} />
        </div>
      </Container>
    </header>
  );
}
