import type { StructureResolver } from "sanity/structure";

/** Only studio* types appear; the portfolio's types share the dataset but never show here. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("inkOrange Studios")
    .items([
      S.listItem()
        .title("Settings")
        .id("studioSettings")
        .child(
          S.document().schemaType("studioSettings").documentId("studioSettings").title("Settings"),
        ),
      S.divider(),
      S.documentTypeListItem("studioGame").title("Games"),
      S.documentTypeListItem("studioPost").title("News"),
      S.documentTypeListItem("studioPage").title("Pages"),
      S.documentTypeListItem("studioFaq").title("FAQs"),
    ]);
