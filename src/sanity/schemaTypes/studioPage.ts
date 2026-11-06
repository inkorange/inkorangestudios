import { defineField, defineType } from "sanity";
import { bodyField } from "./shared";

export const studioPage = defineType({
  name: "studioPage",
  title: "Page",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "e.g. privacy, terms",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "updatedAt", title: "Last updated", type: "date" }),
    bodyField(),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
