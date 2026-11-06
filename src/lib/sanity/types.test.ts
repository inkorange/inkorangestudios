import { expect, it } from "vitest";
import { postKindLabel } from "./types";

it("labels post kinds", () => {
  expect(postKindLabel("update")).toBe("UPDATE");
  expect(postKindLabel("announcement")).toBe("ANNOUNCEMENT");
  expect(postKindLabel("devlog")).toBe("DEVLOG");
  expect(postKindLabel("patch-notes")).toBe("PATCH NOTES");
});
