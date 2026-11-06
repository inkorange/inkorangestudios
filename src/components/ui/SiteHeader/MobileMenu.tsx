"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_ITEMS, type NavKey } from "@/lib/nav";
import { Button } from "../Button/Button";
import { IconButton } from "../IconButton/IconButton";
import styles from "./SiteHeader.module.scss";

export function MobileMenu({ active }: { active?: NavKey }) {
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
              aria-current={item.key === active ? "page" : undefined}
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
