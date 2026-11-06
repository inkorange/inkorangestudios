"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icon/Icon";
import styles from "./Select.module.scss";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  label: string;
  hideLabel?: boolean;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  tone?: "on-light" | "on-dark" | "on-card" | "on-accent";
  /** Fires with the new value on every change; use it to remember the choice and re-seed `defaultValue`. */
  onChange?: (value: string) => void;
};

/** Where the open menu sits, in viewport px (it is `position: fixed` in a portal). */
/** `minWidth` is the field's width; the menu grows to its widest option, up to `maxWidth`. */
type Placement = { left: number; minWidth: number; maxWidth: number; top?: number; bottom?: number; maxHeight: number };

const GAP = 6;
const EDGE = 12;
const MIN_HEIGHT = 120;
const TYPEAHEAD_MS = 500;
/** Rough menu height before it has rendered: option rows plus the list's padding. */
const estimateHeight = (count: number) => count * 44 + 12;

/**
 * Drop down when the whole menu fits below the trigger; otherwise drop up when it fits above;
 * otherwise use whichever side has more room and scroll inside the menu.
 */
export function placeMenu(
  trigger: Pick<DOMRect, "top" | "bottom" | "left" | "width">,
  needed: number,
  viewport: { width: number; height: number },
  menuWidth = 0,
): Placement {
  const below = viewport.height - trigger.bottom - GAP - EDGE;
  const above = trigger.top - GAP - EDGE;
  const maxWidth = viewport.width - EDGE * 2;
  const minWidth = Math.min(trigger.width, maxWidth);
  const width = Math.min(Math.max(minWidth, menuWidth), maxWidth);
  const left = Math.min(Math.max(trigger.left, EDGE), viewport.width - EDGE - width);
  const down = needed <= below || (needed > above && below >= above);
  return down
    ? { left, minWidth, maxWidth, top: trigger.bottom + GAP, maxHeight: Math.max(below, MIN_HEIGHT) }
    : { left, minWidth, maxWidth, bottom: viewport.height - trigger.top + GAP, maxHeight: Math.max(above, MIN_HEIGHT) };
}

/**
 * A select-only combobox (WAI-ARIA APG pattern): a focusable trigger showing the value and a
 * listbox menu drawn in a portal so overflow-clipped parents (the callout band) can't cut it off.
 * The value is submitted through a hidden input, so it works in plain forms and server actions.
 */
export function Select({ label, hideLabel = false, name, options, defaultValue, tone = "on-light", onChange }: SelectProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  const initial = options.some((o) => o.value === defaultValue) ? defaultValue! : (options[0]?.value ?? "");
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  const openMenu = useCallback(
    (at: number) => {
      if (options.length === 0) return;
      setActive(Math.min(Math.max(at, 0), options.length - 1));
      setOpen(true);
    },
    [options.length],
  );

  const commit = useCallback(
    (index: number) => {
      const next = options[index];
      setOpen(false);
      if (next && next.value !== value) {
        setValue(next.value);
        onChange?.(next.value);
      }
    },
    [options, value, onChange],
  );

  // Position the menu on open, and keep it pinned to the trigger on scroll and resize.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const trigger = triggerRef.current;
    const place = () =>
      setPlacement(
        placeMenu(
          trigger.getBoundingClientRect(),
          listRef.current?.scrollHeight ?? estimateHeight(options.length),
          { width: window.innerWidth, height: window.innerHeight },
          listRef.current?.offsetWidth ?? 0,
        ),
      );
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    // Re-place once the menu has rendered, using its real height and width.
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, options.length]);

  // Keep the active option in view while moving through a long list.
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${id}-opt-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, active, id]);

  function findByPrefix(char: string): number {
    const now = Date.now();
    const t = typeahead.current;
    t.text = now - t.at < TYPEAHEAD_MS ? t.text + char : char;
    t.at = now;
    const query = t.text.toLowerCase();
    const start = open ? active : selectedIndex;
    // Repeating one letter cycles through the options that start with it.
    const repeated = query.length > 1 && [...query].every((c) => c === query[0]);
    const needle = repeated ? query[0] : query;
    const from = repeated || query.length === 1 ? start + 1 : start;
    for (let i = 0; i < options.length; i++) {
      const idx = (from + i) % options.length;
      if (options[idx].label.toLowerCase().startsWith(needle)) return idx;
    }
    return -1;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = options.length - 1;
    if (!open) {
      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "Enter":
        case " ":
          e.preventDefault();
          openMenu(selectedIndex);
          return;
        case "Home":
          e.preventDefault();
          openMenu(0);
          return;
        case "End":
          e.preventDefault();
          openMenu(last);
          return;
      }
    } else {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (e.altKey) commit(active);
          else setActive((a) => Math.min(a + 1, last));
          return;
        case "ArrowUp":
          e.preventDefault();
          if (e.altKey) commit(active);
          else setActive((a) => Math.max(a - 1, 0));
          return;
        case "Home":
          e.preventDefault();
          setActive(0);
          return;
        case "End":
          e.preventDefault();
          setActive(last);
          return;
        case "PageDown":
          e.preventDefault();
          setActive((a) => Math.min(a + 10, last));
          return;
        case "PageUp":
          e.preventDefault();
          setActive((a) => Math.max(a - 10, 0));
          return;
        case "Enter":
        case " ":
          e.preventDefault();
          commit(active);
          return;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          return;
        case "Tab":
          // Commit the highlighted option and let focus move on as usual.
          commit(active);
          return;
      }
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
      const match = findByPrefix(e.key);
      if (match >= 0) {
        if (open) setActive(match);
        else openMenu(match);
      }
    }
  }

  return (
    <div className={styles.root} data-tone={tone}>
      <span id={labelId} className={styles.label} data-hidden={hideLabel}>
        {label}
      </span>
      <div className={styles.wrap}>
        <div
          ref={triggerRef}
          role="combobox"
          tabIndex={0}
          className={styles.trigger}
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? optionId(active) : undefined}
          data-open={open}
          onClick={() => (open ? setOpen(false) : openMenu(selectedIndex))}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
        >
          <span className={styles.value}>{selected?.label}</span>
          <span className={styles.chevron}>
            <Icon name="chevron-right" size={18} />
          </span>
        </div>
        <input type="hidden" name={name} value={value} />
      </div>
      {open && placement
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-labelledby={labelId}
              className={styles.menu}
              data-tone={tone}
              data-placement={placement.top === undefined ? "top" : "bottom"}
              style={{
                "--select-left": `${placement.left}px`,
                "--select-min-width": `${placement.minWidth}px`,
                "--select-max-width": `${placement.maxWidth}px`,
                "--select-top": placement.top === undefined ? "auto" : `${placement.top}px`,
                "--select-bottom": placement.bottom === undefined ? "auto" : `${placement.bottom}px`,
                "--select-max-height": `${placement.maxHeight}px`,
              }}
              // Keep focus on the trigger while the pointer picks an option.
              onMouseDown={(e) => e.preventDefault()}
            >
              {options.map((o, i) => (
                <li
                  key={o.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={o.value === value}
                  className={styles.option}
                  data-active={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => commit(i)}
                >
                  <span className={styles.check}>{o.value === value ? <Icon name="check" size={16} /> : null}</span>
                  {o.label}
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
