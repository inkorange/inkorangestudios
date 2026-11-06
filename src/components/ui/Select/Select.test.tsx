import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { placeMenu, Select } from "./Select";

const options = [
  { value: "general", label: "General" },
  { value: "support", label: "Player support" },
  { value: "press", label: "Press" },
  { value: "business", label: "Business" },
];

function setup(props: Partial<Parameters<typeof Select>[0]> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <form data-testid="form">
      <Select label="Topic" name="topic" options={options} onChange={onChange} {...props} />
    </form>,
  );
  const combo = screen.getByRole("combobox", { name: "Topic" });
  const value = () => (utils.getByTestId("form") as HTMLFormElement).querySelector<HTMLInputElement>('input[name="topic"]')!.value;
  return { ...utils, combo, onChange, value };
}

it("is a labelled, collapsed combobox showing the first option, submitted through a hidden input", () => {
  const { combo, value } = setup();
  expect(combo).toHaveAttribute("aria-haspopup", "listbox");
  expect(combo).toHaveAttribute("aria-expanded", "false");
  expect(combo).toHaveTextContent("General");
  expect(value()).toBe("general");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

it("honours defaultValue and ignores one that isn't an option", () => {
  expect(setup({ defaultValue: "press" }).value()).toBe("press");
});

it("falls back to the first option for an unknown defaultValue", () => {
  expect(setup({ defaultValue: "nope" }).value()).toBe("general");
});

it("keeps an accessible name when the label is hidden", () => {
  setup({ hideLabel: true });
  expect(screen.getByRole("combobox", { name: "Topic" })).toBeInTheDocument();
});

it("opens on click, marks the current option and picks another with the pointer", async () => {
  const user = userEvent.setup();
  const { combo, onChange, value } = setup();
  await user.click(combo);
  expect(combo).toHaveAttribute("aria-expanded", "true");
  const list = screen.getByRole("listbox", { name: "Topic" });
  expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(["General", "Player support", "Press", "Business"]);
  expect(within(list).getByRole("option", { name: "General" })).toHaveAttribute("aria-selected", "true");

  await user.click(within(list).getByRole("option", { name: "Press" }));
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(combo).toHaveTextContent("Press");
  expect(combo).toHaveFocus();
  expect(value()).toBe("press");
  expect(onChange).toHaveBeenCalledWith("press");
});

it("works from the keyboard: arrows move, Enter picks, Escape cancels", async () => {
  const user = userEvent.setup();
  const { combo, onChange, value } = setup();
  combo.focus();
  await user.keyboard("{ArrowDown}");
  expect(combo).toHaveAttribute("aria-expanded", "true");
  const active = () => document.getElementById(combo.getAttribute("aria-activedescendant")!);
  expect(active()).toHaveTextContent("General");

  await user.keyboard("{ArrowDown}{ArrowDown}");
  expect(active()).toHaveTextContent("Press");
  await user.keyboard("{End}");
  expect(active()).toHaveTextContent("Business");
  await user.keyboard("{Home}");
  expect(active()).toHaveTextContent("General");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(value()).toBe("support");
  expect(onChange).toHaveBeenLastCalledWith("support");

  await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");
  expect(combo).toHaveAttribute("aria-expanded", "false");
  expect(value()).toBe("support");
  expect(onChange).toHaveBeenCalledTimes(1);
});

it("jumps by typing the start of a label", async () => {
  const user = userEvent.setup();
  const { combo } = setup();
  combo.focus();
  await user.keyboard("b");
  expect(document.getElementById(combo.getAttribute("aria-activedescendant")!)).toHaveTextContent("Business");
});

it("Tab commits the highlighted option and closes", async () => {
  const user = userEvent.setup();
  const { combo, value } = setup();
  combo.focus();
  await user.keyboard("{ArrowDown}{ArrowDown}");
  await user.tab();
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(value()).toBe("support");
});

it("closes without changing when focus leaves", async () => {
  const user = userEvent.setup();
  const { combo, value } = setup();
  await user.click(combo);
  fireEvent.blur(combo);
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(value()).toBe("general");
});

it("does not submit the form when Enter opens it", async () => {
  const user = userEvent.setup();
  const submit = vi.fn((e: Event) => e.preventDefault());
  const { combo, getByTestId } = setup();
  getByTestId("form").addEventListener("submit", submit);
  combo.focus();
  await user.keyboard("{Enter}");
  expect(submit).not.toHaveBeenCalled();
  expect(combo).toHaveAttribute("aria-expanded", "true");
});

describe("placeMenu", () => {
  const viewport = { width: 400, height: 800 };
  const at = (top: number) => ({ top, bottom: top + 48, left: 20, width: 300 });

  it("drops down when the menu fits below", () => {
    expect(placeMenu(at(100), 200, viewport)).toMatchObject({ top: 154, left: 20, width: 300 });
  });

  it("drops up near the bottom edge when the menu fits above", () => {
    const p = placeMenu(at(650), 200, viewport);
    expect(p.top).toBeUndefined();
    expect(p.bottom).toBe(800 - 650 + 6);
  });

  it("uses the roomier side and scrolls when it fits neither way", () => {
    const p = placeMenu(at(500), 900, viewport);
    expect(p.top).toBeUndefined();
    expect(p.maxHeight).toBe(500 - 6 - 12);
  });

  it("stays inside the viewport horizontally", () => {
    expect(placeMenu({ top: 100, bottom: 148, left: 200, width: 300 }, 100, viewport)).toMatchObject({ left: 88, width: 300 });
  });
});
