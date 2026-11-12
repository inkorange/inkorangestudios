import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField } from "./shared";

/** A free educational tool: listed on /learn and (the first two) on the home page, linking out to its own site. */
export const studioTool = defineType({
  name: "studioTool",
  title: "Educational tool",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Out now", value: "out-now" },
          { title: "Coming soon", value: "coming-soon" },
          { title: "In development", value: "in-development" },
          { title: "Announcing soon", value: "announcing-soon" },
        ],
        layout: "radio",
      },
      initialValue: "out-now",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "url",
      title: "Tool URL",
      type: "url",
      description: "Where the tool lives. Opens in a new tab. The \"Try it free\" button shows only while the tool is out now.",
      validation: (r) =>
        r
          .uri({ scheme: ["https"] })
          .custom((url, ctx) => (!url && ctx.document?.status === "out-now" ? "A tool that is out now needs its URL." : true)),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description: "One or two sentences: what it teaches and how.",
      validation: (r) => r.required(),
    }),
    imageField("banner", "Banner or screenshot", "Wide, 16:9. Shown at the top of the card."),
    defineField({
      name: "links",
      title: "More links",
      type: "array",
      description: "Optional: articles, videos or press about the tool. Each opens in a new tab.",
      of: [
        defineArrayMember({
          type: "object",
          name: "toolLink",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              description: "e.g. Read: How I built Molecular",
              validation: (r) => r.required(),
            }),
            defineField({ name: "url", title: "URL", type: "url", validation: (r) => r.required().uri({ scheme: ["https"] }) }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      description: "Lower comes first. The first two show on the home page.",
    }),
  ],
  orderings: [{ title: "Sort order", name: "sortOrder", by: [{ field: "sortOrder", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "status", media: "banner" } },
});
