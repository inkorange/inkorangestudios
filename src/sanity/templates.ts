import type { Template } from "sanity";

/**
 * Types that must not be offered in the "new document" menu: settings is a
 * singleton, and newsletter requests/deliveries are created only by code.
 */
export const hiddenTemplateTypes = [
  "studioSettings",
  "studioNewsletterRequest",
  "studioNewsletterDelivery",
];

export function filterTemplates(templates: Template[]): Template[] {
  return templates.filter((t) => !hiddenTemplateTypes.includes(t.schemaType));
}
