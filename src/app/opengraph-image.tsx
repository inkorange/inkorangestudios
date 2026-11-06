import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { tokenPx, tokenValue } from "@/lib/tokens";

/**
 * The site-wide share image, generated at build. Satori can't read CSS custom properties, so
 * colors and sizes come from src/styles/tokens.json via src/lib/tokens.ts. Barlow Condensed is
 * bundled in src/assets/fonts (OFL) rather than fetched from Google at build time.
 */
export const alt = "inkOrange Studios — Games that make you think.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The canvas is seen as a small card, so desktop sizes are scaled up. */
const SCALE = 1.25;

const root = process.cwd();

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/** PNG width and height live in the IHDR chunk at bytes 16 and 20. */
function pngSize(png: Buffer) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

export default async function Image() {
  const [font, logo] = await Promise.all([
    readFile(path.join(root, "src/assets/fonts/BarlowCondensed-ExtraBold.ttf")),
    readFile(path.join(root, "public/brand/inkorange-logo.png")),
  ]);
  const logoSize = pngSize(logo);
  const logoWidth = tokenPx("--logo-width-l") * 2;
  const logoHeight = Math.round((logoWidth * logoSize.height) / logoSize.width);

  const ink = tokenValue("--color-ink");
  const fontSize = Math.round(tokenPx("--text-display-xl") * SCALE);
  const pad = tokenPx("--space-22");
  const weight = Number(tokenValue("--weight-black")) as FontWeight;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: pad,
          backgroundColor: tokenValue("--color-paper"),
          color: ink,
          fontFamily: "Barlow Condensed",
        }}
      >
        <img src={`data:image/png;base64,${logo.toString("base64")}`} width={logoWidth} height={logoHeight} alt="" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            fontSize,
            fontWeight: weight,
            lineHeight: Number(tokenValue("--leading-tight")),
            textTransform: "uppercase",
          }}
        >
          <span>Games that</span>
          <span
            style={{
              marginTop: tokenPx("--space-3"),
              padding: `${tokenPx("--space-1")}px ${tokenPx("--space-4")}px`,
              backgroundColor: tokenValue("--color-accent"),
            }}
          >
            make you think.
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Barlow Condensed", data: font, style: "normal", weight }],
    },
  );
}
