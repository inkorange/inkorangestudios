import { serializeJsonLd, type JsonLdObject } from "@/lib/jsonLd";

/** Structured data for search engines, as Next recommends: an inline, escaped ld+json script. */
export function JsonLd({ data }: { data: JsonLdObject }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
