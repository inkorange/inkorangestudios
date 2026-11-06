import type { Metadata } from "next";
import { LegalEmpty, Prose } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getLegalPage } from "@/lib/sanity/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const TITLE = "Privacy policy";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getLegalPage("privacy");
  const hasBody = Boolean(page && page.body.length > 0);
  return pageMetadata({ title: `${TITLE} — inkOrange Studios`, description: "How inkOrange Studios collects, uses and protects your information.", path: "/privacy", noindex: !hasBody });
}

export default async function Privacy() {
  const page = await getLegalPage("privacy");
  if (!page || page.body.length === 0) return <LegalEmpty title={TITLE} />;
  return <Prose title={TITLE} meta={page.updatedAt ? `Last updated ${formatDate(page.updatedAt, { case: "title" })}` : undefined} body={page.body} />;
}
