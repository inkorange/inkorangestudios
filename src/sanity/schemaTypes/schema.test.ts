import { describe, expect, it } from "vitest";
import type { GameStatus } from "@/lib/games";
import { hiddenTemplateTypes, filterTemplates } from "../templates";
import { schemaTypes } from "./index";

type Field = {
  name: string;
  type: string;
  options?: { list?: { value: string }[] };
  fields?: Field[];
  of?: Field[];
  validation?: unknown;
};
type BlockDef = Field & {
  styles?: { title: string; value: string }[];
  lists?: unknown[];
  marks?: {
    decorators?: { value: string }[];
    annotations?: { name: string }[];
  };
};
type TypeDef = { name: string; type: string; fields?: Field[] };

const types = schemaTypes as unknown as TypeDef[];
const STATUSES: GameStatus[] = [
  "out-now",
  "coming-soon",
  "in-development",
  "announcing-soon",
];

function* walk(fields: Field[] = [], path = ""): Generator<[string, Field]> {
  for (const f of fields) {
    yield [`${path}${f.name}`, f];
    yield* walk(f.fields, `${path}${f.name}.`);
    for (const o of f.of ?? []) yield* walk(o.fields, `${path}${f.name}[].`);
  }
}

describe("sanity schema", () => {
  it("prefixes every type with studio", () => {
    expect(types.length).toBeGreaterThan(0);
    for (const t of types) expect(t.name.startsWith("studio")).toBe(true);
  });

  it("defines the expected document types", () => {
    expect(types.map((t) => t.name).sort()).toEqual(
      [
        "studioFaq",
        "studioGame",
        "studioNewsletterDelivery",
        "studioNewsletterIssue",
        "studioNewsletterRequest",
        "studioPage",
        "studioPost",
        "studioSettings",
      ].sort(),
    );
  });

  it("studioGame.status options equal GameStatus values", () => {
    const game = types.find((t) => t.name === "studioGame")!;
    const status = game.fields!.find((f) => f.name === "status")!;
    expect(status.options!.list!.map((o) => o.value)).toEqual(STATUSES);
  });

  it("every image field has a required alt subfield", () => {
    let images = 0;
    for (const t of types) {
      for (const [path, f] of walk(t.fields)) {
        if (f.type !== "image") continue;
        images++;
        const alt = f.fields?.find((x) => x.name === "alt");
        expect(alt, `${t.name}.${path} alt`).toBeDefined();
        expect(alt!.validation, `${t.name}.${path} alt required`).toBeTypeOf(
          "function",
        );
      }
    }
    expect(images).toBeGreaterThan(0);
  });

  it("body images offer hotspot, require alt and take an optional caption", () => {
    const post = types.find((t) => t.name === "studioPost")!;
    const body = post.fields!.find((f) => f.name === "body")!;
    const image = body.of!.find((o) => o.type === "image") as Field & {
      options?: { hotspot?: boolean };
    };
    expect(image.options?.hotspot).toBe(true);
    expect(image.fields!.map((f) => f.name)).toEqual(["alt", "caption"]);
    expect(
      image.fields!.find((f) => f.name === "caption")!.validation,
    ).toBeUndefined();
  });

  it("studioSettings.betaCallout.platforms is limited to iOS and Android", () => {
    const settings = types.find((t) => t.name === "studioSettings")!;
    const callout = settings.fields!.find((f) => f.name === "betaCallout")!;
    const platforms = callout.fields!.find(
      (f) => f.name === "platforms",
    )! as Field & { options?: { list?: { title: string; value: string }[] } };
    expect(platforms.type).toBe("array");
    expect(platforms.options?.list).toEqual([
      { title: "iOS", value: "ios" },
      { title: "Android", value: "android" },
    ]);
  });

  it("newsletter issue has the fields the issue query reads", () => {
    const issue = types.find((t) => t.name === "studioNewsletterIssue")!;
    expect(issue.fields!.map((f) => f.name)).toEqual([
      "subject",
      "preheader",
      "issueLine",
      "headline",
      "intro",
      "sections",
    ]);
    const sections = issue.fields!.find((f) => f.name === "sections")!;
    const byName = Object.fromEntries(
      sections.of!.map((o) => [o.name, o.fields!.map((f) => f.name)]),
    );
    expect(byName.gameSection).toEqual([
      "game",
      "body",
      "image",
      "buttonLabel",
      "buttonUrl",
    ]);
    expect(byName.freeSection).toEqual([
      "eyebrow",
      "title",
      "body",
      "image",
      "buttonLabel",
      "buttonUrl",
    ]);
  });

  it("section images are reached by the alt walker", () => {
    const issue = types.find((t) => t.name === "studioNewsletterIssue")!;
    const paths = [...walk(issue.fields)]
      .filter(([, f]) => f.type === "image")
      .map(([p]) => p);
    expect(paths).toEqual(["sections[].image", "sections[].image"]);
  });

  it("newsletter issue body blocks allow normal style, no lists, strong/em/link only", () => {
    const issue = types.find((t) => t.name === "studioNewsletterIssue")!;
    const intro = issue.fields!.find((f) => f.name === "intro") as Field & {
      of: BlockDef[];
    };
    const block = intro.of[0];
    expect(block.styles).toEqual([{ title: "Normal", value: "normal" }]);
    expect(block.lists).toEqual([]);
    expect(block.marks!.decorators!.map((d) => d.value)).toEqual([
      "strong",
      "em",
    ]);
    expect(block.marks!.annotations!.map((a) => a.name)).toEqual(["link"]);
  });

  it("request and delivery fields are all read-only", () => {
    for (const name of [
      "studioNewsletterRequest",
      "studioNewsletterDelivery",
    ]) {
      const t = types.find((x) => x.name === name)!;
      for (const [path, f] of walk(t.fields)) {
        if (f.fields) continue;
        expect(
          (f as Field & { readOnly?: boolean }).readOnly,
          `${name}.${path}`,
        ).toBe(true);
      }
    }
  });

  it("request and delivery types are excluded from new-document templates", () => {
    expect(hiddenTemplateTypes).toEqual(
      expect.arrayContaining([
        "studioSettings",
        "studioNewsletterRequest",
        "studioNewsletterDelivery",
      ]),
    );
    const input = [
      ...hiddenTemplateTypes,
      "studioGame",
      "studioNewsletterIssue",
    ].map((schemaType) => ({ schemaType }));
    expect(filterTemplates(input as never).map((t) => t.schemaType)).toEqual([
      "studioGame",
      "studioNewsletterIssue",
    ]);
  });

  it("studioSettings has newsletter.mailingAddress and fromName", () => {
    const settings = types.find((t) => t.name === "studioSettings")!;
    const nl = settings.fields!.find((f) => f.name === "newsletter")!;
    expect(nl.fields!.map((f) => f.name)).toEqual([
      "mailingAddress",
      "fromName",
    ]);
  });
});
