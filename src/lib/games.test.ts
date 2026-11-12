import { expect, it } from "vitest";
import { betaSignupCopy, statusLabel } from "./games";

it("labels statuses in full and short form", () => {
  expect(statusLabel("out-now")).toBe("OUT NOW");
  expect(statusLabel("coming-soon")).toBe("COMING SOON");
  expect(statusLabel("in-development")).toBe("IN DEVELOPMENT");
  expect(statusLabel("announcing-soon")).toBe("ANNOUNCING SOON");
  expect(statusLabel("in-development", true)).toBe("IN DEV");
  expect(statusLabel("coming-soon", true)).toBe("SOON");
  expect(statusLabel("announcing-soon", true)).toBe("TBA");
});

it("asks Android-only testers for their Google Play email", () => {
  const copy = betaSignupCopy(["android"]);
  expect(copy.notice).toMatch(/^Android only for now\. Sign up with the Google account/);
  expect(copy.label).toBe("Your Google Play email");
  expect(copy.next).toBe("We'll add you to the test and email you a link to install it from Google Play.");
});

it("asks iPhone-only testers for their Apple ID, and has no notice for both phones", () => {
  expect(betaSignupCopy(["ios"])).toMatchObject({ label: "Your Apple ID email", next: expect.stringContaining("TestFlight") });
  expect(betaSignupCopy(["ios", "android"])).toMatchObject({ notice: null, label: "Email address" });
  expect(betaSignupCopy([]).notice).toBeNull();
});
