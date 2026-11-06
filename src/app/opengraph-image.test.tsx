// @vitest-environment node
import { expect, it } from "vitest";
import Image, { alt, contentType, size } from "./opengraph-image";

it("declares a 1200×630 PNG with alt text", () => {
  expect(size).toEqual({ width: 1200, height: 630 });
  expect(contentType).toBe("image/png");
  expect(alt).toBe("inkOrange Studios — Games that make you think.");
});

it("renders a 1200×630 PNG", async () => {
  const res = await Image();
  expect(res.headers.get("content-type")).toBe("image/png");
  const png = Buffer.from(await res.arrayBuffer());
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
}, 20_000);
