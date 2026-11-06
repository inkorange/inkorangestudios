import { expect, it } from "vitest";
import { tokenValue } from "@/lib/tokens";
import manifest from "./manifest";

it("names the site, uses the paper color and lists the app icons", () => {
  const m = manifest();
  expect(m).toMatchObject({ name: "inkOrange Studios", short_name: "inkOrange", start_url: "/" });
  expect(m.theme_color).toBe(tokenValue("--color-paper"));
  expect(m.icons?.map((i) => i.src)).toEqual(["/icon.png", "/apple-icon.png"]);
});
