import { defineField, defineType } from "sanity";

/** Created only by the Studio actions, under the `newsletter.` path. Never edited by hand. */
export const studioNewsletterRequest = defineType({
  name: "studioNewsletterRequest",
  title: "Newsletter request",
  type: "document",
  readOnly: true,
  fields: [
    defineField({
      name: "issueId",
      title: "Issue",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      readOnly: true,
      options: { list: ["test", "count", "broadcast", "resume"] },
    }),
    defineField({
      name: "revision",
      title: "Issue revision",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "requestedAt",
      title: "Requested at",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: { select: { title: "kind", subtitle: "issueId" } },
});
