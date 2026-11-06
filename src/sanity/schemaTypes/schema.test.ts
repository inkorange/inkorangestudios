import { describe, expect, it } from "vitest";
import type { GameStatus } from "@/lib/games";
import { schemaTypes } from "./index";

type Field = {
  name: string;
  type: string;
  options?: { list?: { value: string }[] };
  fields?: Field[];
  of?: Field[];
  validation?: unknown;
};
type TypeDef = { name: string; type: string; fields?: Field[] };

const types = schemaTypes as unknown as TypeDef[];
const STATUSES: GameStatus[] = ["out-now", "coming-soon", "in-development", "announcing-soon"];

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
      ["studioFaq", "studioGame", "studioPage", "studioPost", "studioSettings"].sort(),
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
        expect(alt!.validation, `${t.name}.${path} alt required`).toBeTypeOf("function");
      }
    }
    expect(images).toBeGreaterThan(0);
  });
});
