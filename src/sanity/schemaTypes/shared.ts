import { defineField } from "sanity";

/** Image field with a required alt subfield (and, for images inside a body, an optional caption). */
export function imageField(name: string, title: string, description?: string, opts: { caption?: boolean } = {}) {
  return defineField({
    name,
    title,
    type: "image",
    description,
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alt text",
        type: "string",
        description: "Describe the image for screen readers.",
        validation: (rule) => rule.required(),
      }),
      ...(opts.caption
        ? [
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
              description: "Optional. Shown under the image.",
            }),
          ]
        : []),
    ],
  });
}

/** Portable text body: normal text, a few headings, links, and images with required alt. */
export function bodyField(name = "body", title = "Body") {
  return defineField({
    name,
    title,
    type: "array",
    of: [
      {
        type: "block",
        styles: [
          { title: "Normal", value: "normal" },
          { title: "Heading 2", value: "h2" },
          { title: "Heading 3", value: "h3" },
          { title: "Quote", value: "blockquote" },
        ],
        lists: [
          { title: "Bullet", value: "bullet" },
          { title: "Numbered", value: "number" },
        ],
      },
      imageField("image", "Image", "Crop and hotspot are applied on the site.", { caption: true }),
    ],
  });
}
