import { defineField, defineType } from "sanity";
import { bodyField } from "./shared";

export const studioFaq = defineType({
  name: "studioFaq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({ name: "question", title: "Question", type: "string", validation: (r) => r.required() }),
    bodyField("answer", "Answer"),
    defineField({ name: "game", title: "Related game", type: "reference", to: [{ type: "studioGame" }] }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "question" } },
});
