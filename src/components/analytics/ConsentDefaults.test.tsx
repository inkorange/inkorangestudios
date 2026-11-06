import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: ({ id, strategy, children }: { id: string; strategy: string; children: string }) => (
    <script id={id} data-strategy={strategy} dangerouslySetInnerHTML={{ __html: children }} />
  ),
}));

import { ConsentDefaults } from "./ConsentDefaults";

it("renders the denied Consent Mode defaults as a beforeInteractive script", () => {
  const { container } = render(<ConsentDefaults />);
  const script = container.querySelector("script#consent-default");
  expect(script).toHaveAttribute("data-strategy", "beforeInteractive");
  expect(script?.innerHTML).toContain("analytics_storage:'denied'");
  expect(script?.innerHTML).toContain("ad_personalization:'denied'");
});
