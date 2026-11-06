import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@sanity/ui";
import { buildTheme } from "@sanity/ui/theme";
import type { SanityDocument } from "sanity";
import { beforeEach, describe, expect, it, vi } from "vitest";

const client = { fetch: vi.fn() };
vi.mock("sanity", () => ({ useClient: () => client }));
vi.mock("./useDelivery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./useDelivery")>()),
  useDelivery: () => ({ delivery: { status: "sent", recipientCount: 7, sentAt: "2026-11-02T10:00:00Z" }, loading: false }),
}));

const { EmailPreview, MAILING_ADDRESS_PLACEHOLDER } = await import("./EmailPreview");

const raw = {
  _id: "issue-1",
  subject: "Spring news",
  headline: "Hello",
  sections: [{ _type: "freeSection", title: "A free section" }],
};

function doc(id: string, rev: string): SanityDocument {
  return { _id: id, _type: "studioNewsletterIssue", _rev: rev, _createdAt: "", _updatedAt: "" };
}

function renderView(draft: SanityDocument | null = doc("drafts.issue-1", "d1")) {
  return render(
    <ThemeProvider theme={buildTheme()}>
      <EmailPreview documentId="issue-1" document={{ draft, published: doc("issue-1", "p1") }} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  client.fetch.mockReset();
});

describe("EmailPreview", () => {
  it("renders the draft in a sandboxed iframe, with the delivery status above", async () => {
    client.fetch.mockImplementation((query: string) =>
      Promise.resolve(query.includes("studioSettings") ? { mailingAddress: "1 High St" } : raw),
    );
    renderView();
    const frame = await screen.findByTitle("Email preview");
    expect(frame).toHaveAttribute("sandbox", "");
    expect(frame.getAttribute("srcdoc")).toContain("A free section");
    expect(frame.getAttribute("srcdoc")).toContain("1 High St");
    expect(frame).toHaveAttribute("width", "640");
    expect(screen.getByText(/^Sent to 7 on/)).toBeInTheDocument();

    const [issueCall] = client.fetch.mock.calls.filter(([q]) => !String(q).includes("studioSettings"));
    expect(issueCall[1]).toEqual({ id: "issue-1" });
    expect(issueCall[2]).toEqual({ perspective: "drafts" });
  });

  it("switches to phone width", async () => {
    client.fetch.mockImplementation((query: string) => Promise.resolve(query.includes("studioSettings") ? null : raw));
    renderView();
    const frame = await screen.findByTitle("Email preview");
    screen.getByRole("button", { name: "Phone" }).click();
    await waitFor(() => expect(frame).toHaveAttribute("width", "390"));
  });

  it("shows a placeholder when the mailing address is missing", async () => {
    client.fetch.mockImplementation((query: string) => Promise.resolve(query.includes("studioSettings") ? null : raw));
    renderView();
    const frame = await screen.findByTitle("Email preview");
    expect(frame.getAttribute("srcdoc")).toContain(MAILING_ADDRESS_PLACEHOLDER);
  });

  it("explains when there's nothing to render yet", async () => {
    client.fetch.mockResolvedValue({ _id: "issue-1", subject: "Draft", sections: [] });
    renderView();
    expect(await screen.findByText(/Add a subject and at least one section/)).toBeInTheDocument();
  });
});
