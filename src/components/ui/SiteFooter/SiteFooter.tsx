import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "../Container/Container";
import { Eyebrow } from "../Eyebrow/Eyebrow";
import { CookieSettingsButton } from "./CookieSettingsButton";
import styles from "./SiteFooter.module.scss";

export type SiteFooterProps = {
  /** The newsletter signup form (provided by the page). */
  newsletter: ReactNode;
  variant?: "full" | "compact";
  socialLinks: { label: string; href: string }[];
  supportEmail?: string;
  /** Optional game links for the Games column. */
  games?: { label: string; href: string }[];
  /** Below `lg`, add `--sticky-bar-space` of bottom padding so a `StickyPlayBar` after the footer never covers it. */
  stickyBarSpace?: boolean;
};

type FooterLink = { label: string; href: string; external?: boolean };

function LinkColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className={styles.column}>
      <Eyebrow tone="on-dark-4">{title}</Eyebrow>
      <ul className={styles.links} role="list">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <FooterAnchor link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterAnchor({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a className={styles.link} href={link.href} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    );
  }
  if (link.href.startsWith("mailto:")) {
    return (
      <a className={styles.link} href={link.href}>
        {link.label}
      </a>
    );
  }
  return (
    <Link className={styles.link} href={link.href}>
      {link.label}
    </Link>
  );
}

export function SiteFooter({ newsletter, variant = "full", socialLinks, supportEmail, games = [], stickyBarSpace = false }: SiteFooterProps) {
  const gamesLinks: FooterLink[] = [{ label: "All games", href: "/#games" }, ...games];
  const studioLinks: FooterLink[] = [
    { label: "About", href: "/about" },
    { label: "News", href: "/news" },
    // No "Press kit" link until a global press-kit URL exists; game pages link their own.
  ];
  const helpLinks: FooterLink[] = [
    { label: "Support", href: "/support" },
    ...(supportEmail ? [{ label: "Player support", href: `mailto:${supportEmail}` }] : []),
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ];
  const followLinks: FooterLink[] = socialLinks.map((s) => ({ ...s, external: true }));
  const row: FooterLink[] = [
    { label: "About", href: "/about" },
    { label: "Support", href: "/support" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    ...followLinks,
  ];

  return (
    <footer id="newsletter" className={styles.root} data-variant={variant} data-sticky-bar={stickyBarSpace}>
      <Container>
        <div className={styles.inner}>
          <div className={styles.signup}>
            <div className={styles.copy}>
              <h2 className={styles.title}>Get the newsletter</h2>
              {variant === "full" ? <p className={styles.intro}>New releases, beta invites and studio news. A few emails a year.</p> : null}
            </div>
            <div className={styles.form}>{newsletter}</div>
          </div>

          {variant === "full" ? (
            <div className={styles.columns}>
              <LinkColumn title="Games" links={gamesLinks} />
              <LinkColumn title="Studio" links={studioLinks} />
              <LinkColumn title="Help" links={helpLinks} />
              {followLinks.length > 0 ? <LinkColumn title="Follow" links={followLinks} /> : null}
            </div>
          ) : (
            <ul className={styles.row} role="list">
              {row.map((link) => (
                <li key={link.href + link.label}>
                  <FooterAnchor link={link} />
                </li>
              ))}
            </ul>
          )}

          <div className={styles.bottom}>
            <p className={styles.copyright}>© {new Date().getFullYear()} inkOrange Studios · New York</p>
            <CookieSettingsButton />
          </div>
        </div>
      </Container>
    </footer>
  );
}
