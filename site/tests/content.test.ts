import { describe, expect, it } from "vitest";
import { getBundle, getProject } from "@/lib/content";

describe("content", () => {
  it("finds a project by slug", () => {
    expect(getProject("p013-grid-contingency")).toBeDefined();
    expect(getProject("p013-grid-contingency")?.team).toBe("solo");
  });
  it("unknown slug gives undefined", () => {
    expect(getProject("no-such-project")).toBeUndefined();
  });
  it("reads the bundle", () => {
    const b = getBundle();
    expect(b.profile.photo_dark.src.startsWith("/c/")).toBe(true);
    expect(Array.isArray(b.awards.main)).toBe(true);
  });
});
