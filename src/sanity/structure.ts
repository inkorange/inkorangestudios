import type { DefaultDocumentNodeResolver, StructureResolver } from "sanity/structure";
import { EmailPreview } from "./newsletter/EmailPreview";

/** Only studio* types appear; the portfolio's types share the dataset but never show here. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("inkOrange Studios")
    .items([
      S.listItem()
        .title("Settings")
        .id("studioSettings")
        .child(
          S.document()
            .schemaType("studioSettings")
            .documentId("studioSettings")
            .title("Settings"),
        ),
      S.divider(),
      S.documentTypeListItem("studioGame").title("Games"),
      S.documentTypeListItem("studioTool").title("Educational tools"),
      S.documentTypeListItem("studioPost").title("News"),
      S.documentTypeListItem("studioNewsletterIssue").title("Newsletter"),
      S.documentTypeListItem("studioPage").title("Pages"),
      S.documentTypeListItem("studioFaq").title("FAQs"),
    ]);

/** Newsletter issues get an "Email preview" view (with live delivery status) next to the form. */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) =>
  schemaType === "studioNewsletterIssue"
    ? S.document().views([S.view.form(), S.view.component(EmailPreview).id("email-preview").title("Email preview")])
    : S.document();
