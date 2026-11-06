import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

// Shares a Sanity project + dataset with the portfolio site. The workspace name
// ("inkorange") and the studio* type prefix keep the two schemas separate.
export default defineConfig({
  name: "inkorange",
  title: "inkOrange Studios",
  basePath: "/studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Settings is a singleton: it can't be created from the "new document" menu.
    templates: (templates) => templates.filter((t) => t.schemaType !== "studioSettings"),
  },
  document: {
    actions: (prev, { schemaType }) =>
      schemaType === "studioSettings"
        ? prev.filter(({ action }) => action !== "duplicate" && action !== "delete")
        : prev,
  },
});
