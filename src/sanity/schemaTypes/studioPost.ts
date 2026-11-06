import { defineField, defineType } from "sanity";
import { bodyField, imageField } from "./shared";

export const studioPost = defineType({
  name: "studioPost",
  title: "News post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "date", title: "Date", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Update", value: "update" },
          { title: "Announcement", value: "announcement" },
          { title: "Devlog", value: "devlog" },
          { title: "Patch notes", value: "patch-notes" },
        ],
      },
      initialValue: "update",
      validation: (r) => r.required(),
    }),
    defineField({ name: "game", title: "Related game", type: "reference", to: [{ type: "studioGame" }] }),
    imageField("coverImage", "Cover image"),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3 }),
    bodyField(),
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "date", media: "coverImage" } },
});
