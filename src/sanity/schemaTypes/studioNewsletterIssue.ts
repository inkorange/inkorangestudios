import { defineArrayMember, defineField, defineType } from "sanity";
import { imageField } from "./shared";

/** Short rich text for emails: plain paragraphs, bold, italic and links. No headings, lists or images. */
function emailBody(
  name: string,
  title: string,
  required: boolean,
  description?: string,
) {
  return defineField({
    name,
    title,
    description,
    type: "array",
    of: [
      defineArrayMember({
        type: "block",
        styles: [{ title: "Normal", value: "normal" }],
        lists: [],
        marks: {
          decorators: [
            { title: "Bold", value: "strong" },
            { title: "Italic", value: "em" },
          ],
          annotations: [
            {
              name: "link",
              type: "object",
              title: "Link",
              fields: [
                defineField({
                  name: "href",
                  title: "URL",
                  type: "url",
                  validation: (r) =>
                    r.required().uri({ scheme: ["http", "https", "mailto"] }),
                }),
              ],
            },
          ],
        },
      }),
    ],
    validation: required ? (r) => r.required().min(1) : undefined,
  });
}

const buttonLabel = defineField({
  name: "buttonLabel",
  title: "Button label",
  type: "string",
  description: "Text on the button, like “Read more”. Needs a button link too.",
});

function buttonUrl(overrides: boolean) {
  return defineField({
    name: "buttonUrl",
    title: "Button link",
    type: "url",
    description: overrides
      ? "Optional. Replaces the game's usual button. Fill in the label too."
      : "Where the button goes. Fill in the label too.",
    validation: (r) =>
      r.uri({ scheme: ["http", "https"] }).custom((url, ctx) => {
        const label = (ctx.parent as { buttonLabel?: string } | undefined)
          ?.buttonLabel;
        if (url && !label) return "Add a button label, or clear the link.";
        if (label && !url) return "Add a button link, or clear the label.";
        return true;
      }),
  });
}

export const studioNewsletterIssue = defineType({
  name: "studioNewsletterIssue",
  title: "Newsletter issue",
  type: "document",
  fields: [
    defineField({
      name: "subject",
      title: "Subject",
      type: "string",
      description: "The email subject line.",
      validation: (r) => r.required().max(150),
    }),
    defineField({
      name: "preheader",
      title: "Preheader",
      type: "string",
      description: "The preview line inboxes show after the subject.",
      validation: (r) => r.max(120),
    }),
    defineField({
      name: "issueLine",
      title: "Issue line",
      type: "string",
      description:
        "Small line at the top, like “Studio notes · No. 1 · November 2026”.",
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      description: "Optional big title at the top of the email.",
    }),
    emailBody(
      "intro",
      "Intro",
      false,
      "Optional opening note before the first section.",
    ),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      description: "The body of the email, top to bottom. Add at least one.",
      of: [
        defineArrayMember({
          type: "object",
          name: "gameSection",
          title: "Game",
          fields: [
            defineField({
              name: "game",
              title: "Game",
              type: "reference",
              to: [{ type: "studioGame" }],
              description:
                "Its name, art, status and platforms are pulled in when the email is sent.",
              validation: (r) => r.required(),
            }),
            emailBody("body", "Text", true),
            imageField(
              "image",
              "Image",
              "Optional. Used instead of the game's own art.",
            ),
            buttonLabel,
            buttonUrl(true),
          ],
          preview: { select: { title: "game.name", subtitle: "body" } },
        }),
        defineArrayMember({
          type: "object",
          name: "freeSection",
          title: "Free section",
          fields: [
            defineField({
              name: "eyebrow",
              title: "Eyebrow",
              type: "string",
              description:
                "Optional small label above the title, like “Also new”.",
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (r) => r.required(),
            }),
            emailBody("body", "Text", true),
            imageField("image", "Image", "Optional."),
            buttonLabel,
            buttonUrl(false),
          ],
          preview: { select: { title: "title", subtitle: "eyebrow" } },
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "subject", subtitle: "issueLine" },
    prepare: ({ title, subtitle }) => ({
      title: title || "Untitled issue",
      subtitle,
    }),
  },
});
