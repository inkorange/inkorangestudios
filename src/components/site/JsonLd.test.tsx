import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { JsonLd } from "./JsonLd";

it("renders an escaped application/ld+json script", () => {
  const { container } = render(<JsonLd data={{ "@type": "VideoGame", name: "A <b>game</b>" }} />);
  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).not.toBeNull();
  expect(script!.innerHTML).not.toContain("<b>");
  expect(JSON.parse(script!.textContent ?? "")).toEqual({ "@type": "VideoGame", name: "A <b>game</b>" });
});
