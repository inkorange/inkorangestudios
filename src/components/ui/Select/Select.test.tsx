import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
];

it("is a labelled combobox with its options", () => {
  render(<Select label="Platform" name="platform" options={options} />);
  const s = screen.getByRole("combobox", { name: "Platform" });
  expect(s).toHaveAttribute("name", "platform");
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["iOS", "Android"]);
});
it("honours defaultValue and required", () => {
  render(<Select label="Platform" name="platform" options={options} defaultValue="android" required />);
  const s = screen.getByRole("combobox", { name: "Platform" });
  expect(s).toHaveValue("android");
  expect(s).toBeRequired();
});
it("keeps an accessible name when the label is hidden", () => {
  render(<Select label="Platform" hideLabel name="platform" options={options} />);
  expect(screen.getByRole("combobox", { name: "Platform" })).toBeInTheDocument();
});
it("works controlled", async () => {
  let v = "ios";
  const { rerender } = render(<Select label="P" name="p" options={options} value={v} onChange={(e) => (v = e.target.value)} />);
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "P" }), "android");
  expect(v).toBe("android");
  rerender(<Select label="P" name="p" options={options} value={v} onChange={() => {}} />);
  expect(screen.getByRole("combobox", { name: "P" })).toHaveValue("android");
});
