import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { Media } from "@/lib/sanity/types";
import { MediaViewer } from "./MediaViewer";

const items: Media[] = [
  {
    kind: "trailer",
    label: "TRAILER",
    poster: null,
    url: "https://youtu.be/abc123",
    duration: "1:30",
  },
  { kind: "image", label: "PLANET EDITOR", image: null },
  {
    kind: "image",
    label: "STAR SYSTEM",
    image: { src: "/s.png", alt: "A star system", width: 800, height: 400 },
  },
];

it("renders nothing without items", () => {
  const { container } = render(<MediaViewer items={[]} title="TerraForge" />);
  expect(container).toBeEmptyDOMElement();
});

it("shows a labelled play button and no iframe until pressed", () => {
  const { container } = render(
    <MediaViewer items={items} title="TerraForge" />,
  );
  expect(container.querySelector("iframe")).toBeNull();
  expect(container.querySelector("video")).toBeNull();
  expect(screen.getByText(/OFFICIAL TRAILER · 1:30/)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Play the TerraForge trailer" }),
  );
  const frame = container.querySelector("iframe");
  expect(frame).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/abc123?autoplay=1",
  );
  expect(frame).toHaveAttribute("title", "TerraForge trailer");
  expect(frame).toHaveAttribute(
    "allow",
    "autoplay; fullscreen; picture-in-picture",
  );
});

it("plays direct files in a video element", () => {
  const direct: Media[] = [
    {
      kind: "trailer",
      label: "TRAILER",
      poster: null,
      url: "https://cdn.example.com/t.mp4",
    },
  ];
  const { container } = render(
    <MediaViewer items={direct} title="TerraForge" />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Play the TerraForge trailer" }),
  );
  const video = container.querySelector("video");
  expect(video).toHaveAttribute("src", "https://cdn.example.com/t.mp4");
  expect(video).toHaveAttribute("controls");
});

it("selects a thumbnail and shows its label on the stage", () => {
  render(<MediaViewer items={items} title="TerraForge" />);
  expect(screen.getByRole("button", { name: "Show TRAILER" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Show PLANET EDITOR" }));
  expect(
    within(screen.getByRole("figure")).getByText("PLANET EDITOR"),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Show PLANET EDITOR" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Show TRAILER" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(screen.queryByRole("button", { name: /Play the/ })).toBeNull();
});

it("returning to the trailer resets playback", () => {
  const { container } = render(
    <MediaViewer items={items} title="TerraForge" />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Play the TerraForge trailer" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Show STAR SYSTEM" }));
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Show TRAILER" }));
  expect(container.querySelector("iframe")).toBeNull();
});

it("shows poster and an external link, no play button, for unsupported trailer urls", () => {
  const bad: Media[] = [
    {
      kind: "trailer",
      label: "TRAILER",
      poster: null,
      url: "https://www.youtube.com/@channel",
    },
  ];
  render(<MediaViewer items={bad} title="TerraForge" />);
  expect(screen.queryByRole("button", { name: /Play the/ })).toBeNull();
  const link = screen.getByRole("link", { name: /Watch the trailer/ });
  expect(link).toHaveAttribute("href", "https://www.youtube.com/@channel");
  expect(link).toHaveAttribute("target", "_blank");
});

it("shows only the poster when the trailer url is not http(s)", () => {
  const bad: Media[] = [
    {
      kind: "trailer",
      label: "TRAILER",
      poster: null,
      url: "javascript:alert(1)",
    },
  ];
  render(<MediaViewer items={bad} title="TerraForge" />);
  expect(screen.queryByRole("button", { name: /Play the/ })).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});

it("renders thumbnail images and keeps playback when the selected thumb is clicked again", () => {
  const withArt: Media[] = [
    {
      kind: "trailer",
      label: "TRAILER",
      poster: { src: "/p.png", alt: "Poster", width: 800, height: 400 },
      url: "https://youtu.be/abc123",
    },
    items[2],
  ];
  const { container } = render(
    <MediaViewer items={withArt} title="TerraForge" />,
  );
  const thumb = screen.getByRole("button", { name: "Show STAR SYSTEM" });
  expect(thumb.querySelector("img")).toHaveAttribute(
    "src",
    expect.stringContaining("s.png"),
  );
  expect(
    screen.getByRole("button", { name: "Show TRAILER" }).querySelector("img"),
  ).not.toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Play the TerraForge trailer" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Show TRAILER" }));
  expect(container.querySelector("iframe")).not.toBeNull();
});

it("names the section after what it holds, with a visible heading", () => {
  const shots: Media[] = [items[2]];
  const trailerOnly: Media[] = [items[0]];
  const { unmount } = render(<MediaViewer items={items} title="TerraForge" />);
  expect(
    screen.getByRole("heading", { level: 2, name: "Trailer and screenshots" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Trailer and screenshots" }),
  ).toBeInTheDocument();
  unmount();
  const second = render(<MediaViewer items={shots} title="TerraForge" />);
  expect(
    screen.getByRole("heading", { level: 2, name: "Screenshots" }),
  ).toBeInTheDocument();
  second.unmount();
  render(<MediaViewer items={trailerOnly} title="TerraForge" />);
  expect(
    screen.getByRole("heading", { level: 2, name: "Trailer" }),
  ).toBeInTheDocument();
});

it("shows screenshots whole, in their own shape, portrait or landscape", () => {
  const mixed: Media[] = [
    {
      kind: "image",
      label: "LAUNCH",
      image: {
        src: "/tall.png",
        alt: "Aiming a launch",
        width: 1080,
        height: 2340,
      },
    },
    items[2],
  ];
  const { container } = render(
    <MediaViewer items={mixed} title="Space Cowboy" />,
  );
  const stage = screen.getByRole("figure");
  expect(stage).toHaveAttribute("data-fit", "contain");
  expect(stage).toHaveAttribute("data-orientation", "portrait");
  // The visible screenshot plus a decorative blurred copy behind it.
  expect(within(stage).getByAltText("Aiming a launch")).toBeInTheDocument();
  expect(stage.querySelectorAll("img")).toHaveLength(2);

  const tall = screen.getByRole("button", { name: "Show LAUNCH" });
  expect(tall).toHaveAttribute("data-orientation", "portrait");
  expect(tall.style.getPropertyValue("--thumb-ratio")).toBe("1080 / 2340");
  expect(within(tall).queryByText("LAUNCH")).toBeNull();
  const wide = screen.getByRole("button", { name: "Show STAR SYSTEM" });
  expect(wide).toHaveAttribute("data-orientation", "landscape");
  expect(wide.style.getPropertyValue("--thumb-ratio")).toBe("800 / 400");
  expect(within(wide).getByText("STAR SYSTEM")).toBeInTheDocument();
  expect(container.querySelector("[data-tall]")).toHaveAttribute(
    "data-tall",
    "true",
  );

  fireEvent.click(wide);
  expect(screen.getByRole("figure")).toHaveAttribute(
    "data-orientation",
    "landscape",
  );
});

it("keeps the standard thumb height when nothing is portrait", () => {
  const { container } = render(
    <MediaViewer items={items} title="TerraForge" />,
  );
  expect(container.querySelector("[data-tall]")).toHaveAttribute(
    "data-tall",
    "false",
  );
});

it("shows a loading spinner on the stage until the picture loads, not an empty frame", async () => {
  render(<MediaViewer items={items} title="TerraForge" />);
  fireEvent.click(screen.getByRole("button", { name: "Show STAR SYSTEM" }));
  const stage = screen.getByRole("figure");
  expect(stage).toHaveAttribute("data-loaded", "false");
  expect(within(stage).getByRole("status")).toHaveTextContent("Loading");
  fireEvent.load(within(stage).getByAltText("A star system"));
  // next/image reports the load after decoding, a tick later.
  await waitFor(() => expect(stage).toHaveAttribute("data-loaded", "true"));
  expect(within(stage).queryByRole("status")).toBeNull();
});

it("stops the spinner if the picture fails to load", () => {
  render(<MediaViewer items={[items[2]]} title="TerraForge" />);
  fireEvent.error(screen.getByAltText("A star system"));
  expect(screen.queryByRole("status")).toBeNull();
});

it("shows no spinner over a missing picture's placeholder", () => {
  render(<MediaViewer items={[items[1]]} title="TerraForge" />);
  expect(screen.getByRole("figure")).toHaveAttribute("data-loaded", "true");
  expect(screen.queryByRole("status")).toBeNull();
});

afterEach(() => vi.restoreAllMocks());

it("notes how many thumbs are out of view, and drops the note once scrolled to the end", () => {
  // jsdom has no layout: a 300px-tall rail whose three 200px thumbs end at 150, 350 and 550.
  let scrolled = 0;
  const isRail = (el: Element) => el.hasAttribute("data-tall");
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(function (this: HTMLElement) {
    return isRail(this) ? 600 : 0;
  });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (this: HTMLElement) {
    return isRail(this) ? 300 : 0;
  });
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const thumbs = this.parentElement && isRail(this.parentElement) ? [...this.parentElement.children] : [];
    const i = thumbs.indexOf(this);
    const bottom = isRail(this) ? 300 : i >= 0 ? 150 + i * 200 - scrolled : 0;
    return { top: 0, bottom, left: 0, right: 100, width: 100, height: bottom, x: 0, y: 0, toJSON() {} } as DOMRect;
  });

  const { container } = render(<MediaViewer items={items} title="Space Cowboy" />);
  expect(screen.getByText("2 more ↓")).toBeInTheDocument();

  scrolled = 250;
  fireEvent.scroll(container.querySelector("[data-tall]") as HTMLElement);
  expect(screen.queryByText(/more ↓/)).toBeNull();
});
