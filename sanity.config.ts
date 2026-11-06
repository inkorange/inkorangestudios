import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { filterTemplates } from "./src/sanity/templates";
import { structure } from "./src/sanity/structure";

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
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Settings is a singleton and newsletter requests/deliveries are made by code:
    // none of them can be created from the "new document" menu.
    templates: filterTemplates,
  },
  document: {
    actions: (prev, { schemaType }) =>
      schemaType === "studioSettings"
        ? prev.filter(
            ({ action }) => action !== "duplicate" && action !== "delete",
          )
        : prev,
  },
});
