import type { Faq } from "@/lib/sanity/types";
import { Accordion } from "../Accordion/Accordion";
import { Heading } from "../Heading/Heading";
import { RichText } from "../RichText/RichText";
import styles from "./FaqList.module.scss";

export type FaqListProps = {
  items: Faq[];
};

type Group = { key: string; title: string; items: Faq[] };

function groupFaqs(items: Faq[]): Group[] {
  const general: Group = { key: "", title: "General", items: [] };
  const byGame = new Map<string, Group>();
  for (const faq of items) {
    if (!faq.game) {
      general.items.push(faq);
      continue;
    }
    const group = byGame.get(faq.game.slug) ?? { key: faq.game.slug, title: faq.game.name, items: [] };
    group.items.push(faq);
    byGame.set(faq.game.slug, group);
  }
  return [...(general.items.length ? [general] : []), ...byGame.values()];
}

function Items({ items }: { items: Faq[] }) {
  return (
    <div className={styles.items}>
      {items.map((faq) => (
        <Accordion key={faq.id} title={faq.question}>
          <RichText value={faq.answer} />
        </Accordion>
      ))}
    </div>
  );
}

/** Questions as accordions; once any question belongs to a game, grouped under game names with "General" first. */
export function FaqList({ items }: FaqListProps) {
  if (items.length === 0) return null;
  if (!items.some((f) => f.game)) return <Items items={items} />;
  return (
    <div className={styles.root}>
      {groupFaqs(items).map((group) => (
        <section key={group.key} className={styles.group}>
          <Heading as="h2" size="m">
            {group.title}
          </Heading>
          <Items items={group.items} />
        </section>
      ))}
    </div>
  );
}
