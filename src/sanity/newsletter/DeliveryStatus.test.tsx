import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@sanity/ui";
import { buildTheme } from "@sanity/ui/theme";
import { describe, expect, it } from "vitest";
import { DeliveryStatus, describeDelivery } from "./DeliveryStatus";

describe("describeDelivery", () => {
  it("says nothing has gone out yet", () => {
    expect(describeDelivery(null).lines).toEqual(["Not sent to subscribers yet"]);
  });

  it("shows sending", () => {
    expect(describeDelivery({ status: "sending" }).lines).toContain("Sending…");
  });

  it("shows sent with counts", () => {
    const { lines, tone } = describeDelivery({
      status: "sent",
      sentAt: "2026-11-02T10:00:00Z",
      recipientCount: 120,
      failedCount: 2,
      uncertainCount: 3,
    });
    expect(lines[0]).toMatch(/^Sent to 120 on .*2026/);
    expect(lines).toContain("2 failed");
    expect(lines.some((l) => l.startsWith("3 uncertain"))).toBe(true);
    expect(tone).toBe("caution");
  });

  it("shows a failed send even after the error was cleared by a test", () => {
    const { lines, tone } = describeDelivery({ status: "failed", lastTest: { at: "2026-11-03T09:00:00Z" } });
    expect(lines).toContain("Sending failed — press Resume sending");
    expect(lines.some((l) => l.startsWith("Last test sent"))).toBe(true);
    expect(tone).toBe("critical");
  });

  it("shows the error whatever the status", () => {
    const { lines, tone } = describeDelivery({ status: "idle", error: "Add the mailing address in Settings → Newsletter before sending." });
    expect(lines).toContain("Add the mailing address in Settings → Newsletter before sending.");
    expect(tone).toBe("critical");
  });
});

describe("DeliveryStatus", () => {
  it("says the status couldn't be loaded instead of showing a possibly stale one", () => {
    render(
      <ThemeProvider theme={buildTheme()}>
        <DeliveryStatus delivery={{ status: "sending" }} error />
      </ThemeProvider>,
    );
    expect(screen.getByText("Couldn't load delivery status")).toBeInTheDocument();
    expect(screen.queryByText("Sending…")).not.toBeInTheDocument();
  });
});
