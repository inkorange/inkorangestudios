import { defineField, defineType } from "sanity";

/** Written only by the server, under the `newsletter.` path. Never edited by hand. */
export const studioNewsletterDelivery = defineType({
  name: "studioNewsletterDelivery",
  title: "Newsletter delivery",
  type: "document",
  readOnly: true,
  fields: [
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      readOnly: true,
      options: { list: ["idle", "sending", "sent", "failed"] },
    }),
    defineField({
      name: "audienceCount",
      title: "Audience count",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "countedAt",
      title: "Counted at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "lastTest",
      title: "Last test send",
      type: "object",
      readOnly: true,
      fields: [
        defineField({
          name: "at",
          title: "Sent at",
          type: "datetime",
          readOnly: true,
        }),
        defineField({
          name: "revision",
          title: "Issue revision",
          type: "string",
          readOnly: true,
        }),
      ],
    }),
    defineField({
      name: "sentAt",
      title: "Sent at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "recipientCount",
      title: "Recipients",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "failedCount",
      title: "Failed",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "uncertainCount",
      title: "Uncertain",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "error",
      title: "Error",
      type: "string",
      readOnly: true,
    }),
  ],
  preview: { select: { title: "status", subtitle: "sentAt" } },
});
