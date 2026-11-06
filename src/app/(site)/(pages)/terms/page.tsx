import type { Metadata } from "next";
import { LegalEmpty, Prose } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getLegalPage } from "@/lib/sanity/content";

export const revalidate = 3600;

const TITLE = "Terms of use";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage("terms");
  const hasBody = Boolean(page && page.body.length > 0);
  return { title: `${TITLE} — inkOrange Studios`, ...(hasBody ? {} : { robots: { index: false } }) };
}

export default async function Terms() {
  const page = await getLegalPage("terms");
  if (!page || page.body.length === 0) return <LegalEmpty title={TITLE} />;
  return <Prose title={TITLE} meta={page.updatedAt ? `Last updated ${formatDate(page.updatedAt)}` : undefined} body={page.body} />;
}
