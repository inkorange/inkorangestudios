import tokenFile from "@/styles/tokens.json";

/**
 * Token values for places that can't read CSS custom properties (the OG image renders with
 * Satori). The data is src/styles/tokens.json, generated from tokens.scss.
 */
const byName = new Map(tokenFile.tokens.map((t) => [t.name, t]));

function token(name: string) {
  const t = byName.get(name);
  if (!t) throw new Error(`Unknown token ${name}`);
  return t;
}

export function tokenValue(name: string): string {
  return token(name).value;
}

/** A px size as a number; fluid sizes give their desktop (max) end. */
export function tokenPx(name: string): number {
  const t = token(name);
  const fluid = t.source.match(/^fluid\(\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/);
  if (fluid) return Number(fluid[1]);
  const px = t.value.match(/^([\d.]+)px$/);
  if (px) return Number(px[1]);
  throw new Error(`${name} is not a px size`);
}
