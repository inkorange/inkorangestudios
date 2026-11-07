import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField } from "./shared";

export const studioSettings = defineType({
  name: "studioSettings",
  title: "Settings",
  type: "document",
  fields: [
    defineField({
      name: "supportEmail",
      title: "Support email",
      type: "string",
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialLink",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "betaCallout",
      title: "Beta callout",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
        defineField({
          name: "game",
          title: "Game",
          type: "reference",
          to: [{ type: "studioGame" }],
        }),
        defineField({
          name: "platforms",
          title: "Platforms",
          description:
            "Which beta platforms the signup offers. With both, visitors pick one.",
          type: "array",
          of: [{ type: "string" }],
          options: {
            list: [
              { title: "iOS", value: "ios" },
              { title: "Android", value: "android" },
            ],
          },
          validation: (r) => r.unique(),
        }),
      ],
    }),
    defineField({
      name: "newsletter",
      title: "Newsletter",
      type: "object",
      fields: [
        defineField({
          name: "mailingAddress",
          title: "Mailing address",
          type: "text",
          rows: 3,
          description:
            "Your postal address. It goes in the footer of every email (required by law).",
        }),
        defineField({
          name: "fromName",
          title: "From name",
          type: "string",
          description: "The sender name people see in their inbox.",
          initialValue: "inkOrange Studios",
        }),
      ],
    }),
    defineField({
      name: "newsletterBlurb",
      title: "Newsletter blurb",
      type: "text",
      rows: 2,
    }),
    imageField("studioPhoto", "Studio photo"),
    defineField({ name: "foundedLine", title: "Founded line", type: "string" }),
  ],
  preview: { prepare: () => ({ title: "Settings" }) },
});
