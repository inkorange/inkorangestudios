"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_ITEMS, type NavCurrent, type NavKey } from "@/lib/nav";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import styles from "./SiteHeader.module.scss";

export function MobileMenu({ active, current = "page" }: { active?: NavKey; current?: NavCurrent }) {
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.querySelector<HTMLElement>("button")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The sheet is hidden by CSS at the desktop breakpoint; don't leave it open behind that.
  useEffect(() => {
    if (!open || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(min-width: 64rem)");
    const onChange = (e: { matches: boolean }) => {
      if (e.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={styles.menu}>
      <div ref={toggleRef}>
        <IconButton
          icon={open ? "close" : "menu"}
          label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={sheetId}
          onClick={() => setOpen((v) => !v)}
        />
      </div>
      {open ? (
        <nav id={sheetId} ref={sheetRef} aria-label="Menu" className={styles.sheet}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={styles.item}
              aria-current={item.key === active ? current : undefined}
              onClick={close}
            >
              {item.label}
            </Link>
          ))}
          <div className={styles.cta}>
            <Button variant="accent" size="l" block href="#newsletter" onClick={close}>
              Get the newsletter
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
