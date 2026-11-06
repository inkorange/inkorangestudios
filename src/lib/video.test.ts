import { describe, expect, it } from "vitest";
import { parseVideo } from "./video";

describe("parseVideo", () => {
  it("embeds youtube watch urls", () => {
    expect(parseVideo("https://www.youtube.com/watch?v=abc123_-XYZ&t=3")).toEqual({
      kind: "embed",
      src: "https://www.youtube-nocookie.com/embed/abc123_-XYZ?autoplay=1",
    });
  });
  it("embeds youtu.be urls", () => {
    expect(parseVideo("https://youtu.be/abc123?si=x")).toEqual({
      kind: "embed",
      src: "https://www.youtube-nocookie.com/embed/abc123?autoplay=1",
    });
  });
  it("embeds vimeo urls", () => {
    expect(parseVideo("https://vimeo.com/123456789")).toEqual({
      kind: "embed",
      src: "https://player.vimeo.com/video/123456789?autoplay=1",
    });
  });
  it("treats other urls as direct files", () => {
    expect(parseVideo("https://cdn.example.com/trailer.mp4")).toEqual({ kind: "file", src: "https://cdn.example.com/trailer.mp4" });
  });
  it("does not trust lookalike hosts", () => {
    expect(parseVideo("https://evilyoutube.com/watch?v=abc").kind).toBe("file");
    expect(parseVideo("not a url").kind).toBe("file");
  });
});
