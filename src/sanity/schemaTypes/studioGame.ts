import { defineArrayMember, defineField, defineType } from "sanity";
import { bodyField, imageField } from "./shared";

/** Whether the game's Platforms checkboxes include `platform`. */
function hasPlatform(document: Record<string, unknown> | undefined, platform: string): boolean {
  return Array.isArray(document?.platforms) && document.platforms.includes(platform);
}

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
    defineField({
      name: "platforms",
      title: "Platforms",
      description: "Where the game can be played. Each shows with its logo on the game page.",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Android", value: "Android" },
          { title: "iOS", value: "iOS" },
          { title: "Web", value: "Web" },
        ],
      },
      validation: (r) => r.unique(),
    }),
    defineField({
      name: "storeLinks",
      title: "Store links",
      description: "Add a link and the game page shows that store's badge. Each field appears once its platform is ticked above. Links show only while the status is Out now or Coming soon (beta).",
      type: "object",
      fields: [
        defineField({
          name: "googlePlay",
          title: "Google Play URL",
          type: "url",
          validation: (r) => r.uri({ scheme: ["https"] }),
          hidden: ({ document }) => !hasPlatform(document, "Android"),
        }),
        defineField({
          name: "appStore",
          title: "App Store URL",
          type: "url",
          validation: (r) => r.uri({ scheme: ["https"] }),
          hidden: ({ document }) => !hasPlatform(document, "iOS"),
        }),
        defineField({
          name: "web",
          title: "Web URL",
          description: "Where to play in the browser.",
          type: "url",
          validation: (r) => r.uri({ scheme: ["https"] }),
          hidden: ({ document }) => !hasPlatform(document, "Web"),
        }),
      ],
      options: { collapsible: true, collapsed: false },
    }),
    defineField({
      name: "blurb",
      title: "Short blurb",
      type: "text",
      rows: 3,
      validation: (r) => r.required(),
    }),
    bodyField("description", "Description"),
    imageField(
      "appIcon",
      "App icon",
      "Square, 512×512 PNG, the same icon as in the stores. Shows beside the name on the game page, in the home page's featured picker and in the phone play bar.",
    ),
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
        defineField({
          name: "perk",
          title: "Tester reward",
          type: "string",
          description: 'What testers get, shown beside the signup on the tester page, e.g. "Testers get the full game free." Leave empty to hide.',
          hidden: ({ parent }) => parent?.signup !== "yes",
        }),
        defineField({
          name: "whyTitle",
          title: "Why we need testers: title",
          type: "string",
          description: "Shown on the tester page (/beta/<game>) under the signup. Leave empty to hide the whole section.",
          hidden: ({ parent }) => parent?.signup !== "yes",
        }),
        defineField({
          name: "whyBody",
          title: "Why we need testers: intro",
          type: "text",
          rows: 3,
          description: "A sentence or two beside the title.",
          hidden: ({ parent }) => parent?.signup !== "yes",
        }),
        defineField({
          name: "reasons",
          title: "Why we need testers: reasons",
          description: "Up to three short reasons, each a title and a sentence.",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "reason",
              fields: [
                defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
                defineField({ name: "body", title: "Body", type: "text", rows: 2 }),
              ],
            }),
          ],
          validation: (r) => r.max(3),
          hidden: ({ parent }) => parent?.signup !== "yes",
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
