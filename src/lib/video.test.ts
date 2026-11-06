import { describe, expect, it } from "vitest";
import { isAbsoluteUrl, parseVideo } from "./video";

const yt = (id: string) => ({ kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` });
const vm = (id: string, extra = "") => ({ kind: "embed", src: `https://player.vimeo.com/video/${id}?autoplay=1${extra}` });

describe("parseVideo", () => {
  it("embeds youtube watch urls with extra params", () => {
    expect(parseVideo("https://www.youtube.com/watch?v=abc123_-XYZ&t=3")).toEqual(yt("abc123_-XYZ"));
    expect(parseVideo("https://www.youtube.com/watch?list=PL1&v=abc123&t=9s")).toEqual(yt("abc123"));
  });
  it("embeds youtu.be, shorts, embed and live urls", () => {
    expect(parseVideo("https://youtu.be/abc123?si=x")).toEqual(yt("abc123"));
    expect(parseVideo("https://www.youtube.com/shorts/abc123")).toEqual(yt("abc123"));
    expect(parseVideo("https://www.youtube.com/embed/abc123")).toEqual(yt("abc123"));
    expect(parseVideo("https://www.youtube.com/live/abc123?feature=share")).toEqual(yt("abc123"));
  });
  it("accepts m. and music. hosts", () => {
    expect(parseVideo("https://m.youtube.com/watch?v=abc123")).toEqual(yt("abc123"));
    expect(parseVideo("https://music.youtube.com/watch?v=abc123")).toEqual(yt("abc123"));
  });
  it("embeds vimeo variants", () => {
    expect(parseVideo("https://vimeo.com/123456789")).toEqual(vm("123456789"));
    expect(parseVideo("https://vimeo.com/123456789/abcdef1234")).toEqual(vm("123456789", "&h=abcdef1234"));
    expect(parseVideo("https://vimeo.com/123456789?h=abcdef1234")).toEqual(vm("123456789", "&h=abcdef1234"));
    expect(parseVideo("https://vimeo.com/channels/staffpicks/123456789")).toEqual(vm("123456789"));
    expect(parseVideo("https://vimeo.com/groups/foo/videos/123456789")).toEqual(vm("123456789"));
    expect(parseVideo("https://player.vimeo.com/video/123456789?h=abcdef1234")).toEqual(vm("123456789", "&h=abcdef1234"));
  });
  it("treats other http(s) urls as direct files", () => {
    expect(parseVideo("https://cdn.example.com/trailer.mp4")).toEqual({ kind: "file", src: "https://cdn.example.com/trailer.mp4" });
  });
  it("is unsupported for empty input, other schemes and bad ids", () => {
    for (const bad of [
      "",
      "   ",
      "not a url",
      "javascript:alert(1)",
      "ftp://example.com/a.mp4",
      "https://www.youtube.com/watch?v=abc",
      "https://www.youtube.com/watch",
      "https://www.youtube.com/@channel",
      "https://youtu.be/",
      "https://www.youtube.com/watch?v=abc123%26x",
      "https://www.youtube.com/watch?v=a/../b",
      "https://vimeo.com/",
      "https://vimeo.com/channels/staffpicks",
      "https://vimeo.com/123abc",
    ]) {
      expect(parseVideo(bad), bad).toEqual({ kind: "unsupported" });
    }
  });
  it("does not trust lookalike hosts", () => {
    expect(parseVideo("https://evilyoutube.com/watch?v=abc123").kind).toBe("file");
    expect(parseVideo("https://youtube.com.evil.com/watch?v=abc123").kind).toBe("file");
  });
});

describe("isAbsoluteUrl", () => {
  it("detects http(s) urls only", () => {
    expect(isAbsoluteUrl("https://a.com")).toBe(true);
    expect(isAbsoluteUrl("HTTP://a.com")).toBe(true);
    expect(isAbsoluteUrl("/play")).toBe(false);
    expect(isAbsoluteUrl("mailto:a@b.com")).toBe(false);
  });
});
