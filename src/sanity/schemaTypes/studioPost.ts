import { defineField, defineType } from "sanity";
import { bodyField, imageField } from "./shared";

type PostDoc = { format?: string };

const isLink = (doc: unknown) => (doc as PostDoc | undefined)?.format === "link";

export const studioPost = defineType({
  name: "studioPost",
  title: "News post",
  type: "document",
  fields: [
    defineField({
      name: "format",
      title: "Post type",
      type: "string",
      description: "Write an article here, or link to an article about us on another site.",
      options: {
        list: [
          { title: "Our article", value: "article" },
          { title: "Link to an outside article", value: "link" },
        ],
        layout: "radio",
      },
      initialValue: "article",
    }),
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "url",
      title: "Article link",
      type: "url",
      description: "The full address of the article, starting with https://. It opens in a new tab.",
      hidden: ({ document }) => !isLink(document),
      validation: (r) =>
        r.uri({ scheme: ["https"] }).custom((value, { document }) => (isLink(document) && !value ? "Add the article's link." : true)),
    }),
    defineField({
      name: "source",
      title: "Published by",
      type: "string",
      description: "The site or publication, e.g. Pocket Gamer. Shown on the card in place of the post type.",
      hidden: ({ document }) => !isLink(document),
      validation: (r) => r.custom((value, { document }) => (isLink(document) && !value ? "Name the site that published it." : true)),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      hidden: ({ document }) => isLink(document),
      validation: (r) => r.custom((value, { document }) => (!isLink(document) && !value?.current ? "Required" : true)),
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
      hidden: ({ document }) => isLink(document),
      validation: (r) => r.custom((value, { document }) => (!isLink(document) && !value ? "Required" : true)),
    }),
    defineField({
      name: "game",
      title: "Related game",
      type: "reference",
      to: [{ type: "studioGame" }],
      description: "Shows the post under that game's news filter and on its page.",
    }),
    imageField("coverImage", "Cover image"),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3, hidden: ({ document }) => isLink(document) }),
    { ...bodyField(), hidden: ({ document }: { document?: unknown }) => isLink(document) },
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: {
    select: { title: "title", date: "date", source: "source", format: "format", media: "coverImage" },
    prepare: ({ title, date, source, format, media }) => ({
      title,
      subtitle: format === "link" ? `${date ?? ""} · Link: ${source ?? "outside article"}` : date,
      media,
    }),
  },
});
