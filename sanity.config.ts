import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { filterTemplates } from "./src/sanity/templates";
import { newsletterActions } from "./src/sanity/newsletter/actions";
import { defaultDocumentNode, structure } from "./src/sanity/structure";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
if (!projectId) throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set");

// Shares a Sanity project + dataset with the portfolio site. The workspace name
// ("inkorange") and the studio* type prefix keep the two schemas separate.
export default defineConfig({
  name: "inkorange",
  title: "inkOrange Studios",
  basePath: "/studio",
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  plugins: [structureTool({ structure, defaultDocumentNode }), visionTool()],
  schema: {
    types: schemaTypes,
    // Settings is a singleton and newsletter requests/deliveries are made by code:
    // none of them can be created from the "new document" menu.
    templates: filterTemplates,
  },
  document: {
    // Settings can't be duplicated or deleted. Newsletter issues add the send
    // actions after the defaults, so Publish stays primary and Duplicate stays.
    actions: (prev, { schemaType }) => {
      if (schemaType === "studioSettings")
        return prev.filter(
          ({ action }) => action !== "duplicate" && action !== "delete",
        );
      if (schemaType === "studioNewsletterIssue")
        return [...prev, ...newsletterActions];
      return prev;
    },
  },
});
