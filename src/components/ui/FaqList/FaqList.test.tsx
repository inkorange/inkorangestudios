import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { Faq } from "@/lib/sanity/types";
import { FaqList } from "./FaqList";

const answer = (text: string) => [{ _type: "block", _key: text, style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text, marks: [] }] }] as Faq["answer"];
const faq = (id: string, game: Faq["game"]): Faq => ({ id, question: `Q ${id}`, answer: answer(`A ${id}`), game });

it("renders one accordion per item with no group headings when no FAQ has a game", () => {
  render(<FaqList items={[faq("1", null), faq("2", null)]} />);
  expect(screen.getByText("Q 1")).toBeInTheDocument();
  expect(screen.getByText("A 2")).toBeInTheDocument();
  expect(screen.queryByRole("heading")).toBeNull();
});
it("groups by game with General first", () => {
  render(<FaqList items={[faq("1", { slug: "tf", name: "TerraForge" }), faq("2", null), faq("3", { slug: "sc", name: "Space Cowboy" })]} />);
  const heads = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
  expect(heads).toEqual(["General", "TerraForge", "Space Cowboy"]);
});
it("renders nothing for no items", () => {
  const { container } = render(<FaqList items={[]} />);
  expect(container).toBeEmptyDOMElement();
});
