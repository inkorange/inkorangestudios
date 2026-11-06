import { defineArrayMember, defineField, defineType } from "sanity";
import { bodyField, imageField } from "./shared";

export const studioGame = defineType({
  name: "studioGame",
  title: "Game",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
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
      initialValue: "in-development",
      validation: (r) => r.required(),
    }),
    defineField({ name: "genres", title: "Genres", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "platforms", title: "Platforms", type: "array", of: [{ type: "string" }] }),
    defineField({
      name: "blurb",
      title: "Short blurb",
      type: "text",
      rows: 3,
      validation: (r) => r.required(),
    }),
    bodyField("description", "Description"),
    imageField("keyArt", "Key art", "Wide hero art."),
    imageField("coverArt", "Cover art (3:4)", "Portrait cover, 3:4."),
    defineField({
      name: "trailer",
      title: "Trailer",
      type: "object",
      fields: [
        defineField({ name: "url", title: "URL", type: "url", description: "YouTube or Vimeo link." }),
        imageField("poster", "Poster"),
        defineField({ name: "duration", title: "Duration", type: "string", description: "e.g. 1:42" }),
      ],
    }),
    defineField({
      name: "screenshots",
      title: "Screenshots",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "screenshot",
          fields: [
            imageField("image", "Image"),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
          preview: { select: { title: "caption", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "feature",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
            defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
          ],
          preview: { select: { title: "title", subtitle: "body" } },
        }),
      ],
    }),
    defineField({
      name: "facts",
      title: "Facts",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "fact",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
            defineField({ name: "value", title: "Value", type: "string", validation: (r) => r.required() }),
          ],
          preview: { select: { title: "label", subtitle: "value" } },
        }),
      ],
    }),
    defineField({ name: "priceLabel", title: "Price label", type: "string", description: "Leave empty to hide." }),
    defineField({
      name: "primaryCta",
      title: "Primary call to action",
      type: "object",
      fields: [
        defineField({ name: "label", title: "Label", type: "string" }),
        defineField({ name: "url", title: "URL", type: "url" }),
      ],
    }),
    defineField({
      name: "notifyPlatform",
      title: "Notify me for a platform",
      type: "object",
      fields: [
        defineField({ name: "enabled", title: "Enabled", type: "boolean", initialValue: false }),
        defineField({ name: "platform", title: "Platform name", type: "string" }),
      ],
    }),
    defineField({
      name: "betaTesting",
      title: "Beta testers",
      description: "Whether this game's page asks visitors to sign up as beta testers.",
      type: "object",
      fields: [
        defineField({
          name: "signup",
          title: "Tester signup",
          type: "string",
          options: {
            list: [
              { title: "Yes: show the tester signup", value: "yes" },
              { title: "No: show nothing", value: "no" },
              { title: "Closed: say testing is closed and general release is open", value: "closed" },
            ],
            layout: "radio",
          },
          initialValue: "no",
        }),
        defineField({
          name: "platforms",
          title: "Beta platforms",
          description: "Which platforms the signup offers. With both, visitors pick one.",
          type: "array",
          of: [{ type: "string" }],
          options: {
            list: [
              { title: "iOS", value: "ios" },
              { title: "Android", value: "android" },
            ],
          },
          validation: (r) => r.unique(),
          hidden: ({ parent }) => parent?.signup !== "yes",
        }),
        defineField({
          name: "title",
          title: "Title",
          type: "string",
          description: 'Leave empty for "Play <game> before anyone else." or, when closed, "Testing is now closed."',
          hidden: ({ parent }) => parent?.signup === "no" || !parent?.signup,
        }),
        defineField({
          name: "body",
          title: "Body",
          type: "text",
          rows: 3,
          description: "Leave empty for the default line.",
          hidden: ({ parent }) => parent?.signup === "no" || !parent?.signup,
        }),
      ],
      options: { collapsible: true, collapsed: false },
    }),
    defineField({ name: "pressKitUrl", title: "Press kit URL", type: "url" }),
    defineField({ name: "featured", title: "Featured on home", type: "boolean", initialValue: false }),
    defineField({ name: "featuredOrder", title: "Featured order", type: "number" }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number" }),
  ],
  preview: { select: { title: "name", subtitle: "status", media: "coverArt" } },
});
