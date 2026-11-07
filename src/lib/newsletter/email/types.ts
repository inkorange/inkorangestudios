export type EmailImage = { src: string; alt: string; width: number; height: number };
export type EmailChip = { label: string; tone: "accent" | "outline" };
export type EmailButton = { label: string; href: string; tone: "accent" | "outline" };
export type EmailBlock = {
  _type: "block";
  children: { _type: "span"; text: string; marks?: string[] }[];
  markDefs?: { _key: string; _type: "link"; href?: string }[];
};
export type EmailSection =
  | {
      kind: "game";
      title: string;
      image: EmailImage | null;
      chips: EmailChip[];
      body: EmailBlock[];
      button: EmailButton;
    }
  | {
      kind: "free";
      eyebrow: string | null;
      title: string;
      image: EmailImage | null;
      body: EmailBlock[];
      button: EmailButton | null;
    };
export type IssueData = {
  id: string;
  subject: string;
  preheader: string | null;
  issueLine: string | null;
  headline: string | null;
  intro: EmailBlock[];
  sections: EmailSection[];
};
export type Footer = {
  siteUrl: string;
  mailingAddress: string;
  viewInBrowserUrl: string | null;
  unsubscribe: "placeholder" | "note";
};
export type RenderedEmail = { subject: string; html: string; text: string };
