import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_SCRIPT, pickTheme } from "@/lib/theme-script";

describe("pickTheme", () => {
  it("stored choice wins over the device", () => {
    expect(pickTheme("light", true)).toBe("light");
    expect(pickTheme("dark", false)).toBe("dark");
  });
  it("follows the device when nothing is stored", () => {
    expect(pickTheme(null, false)).toBe("light");
    expect(pickTheme(null, true)).toBe("dark");
  });
  it("is dark when the device gives no setting", () => {
    expect(pickTheme(null, null)).toBe("dark");
  });
  it("ignores a broken stored value", () => {
    expect(pickTheme("purple", false)).toBe("light");
  });
});

function fakeMatchMedia(scheme: "light" | "dark" | null) {
  return (query: string) => ({
    matches: scheme !== null && query.includes(`prefers-color-scheme: ${scheme}`),
    media: query,
  });
}

describe("THEME_SCRIPT", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete document.documentElement.dataset.theme;
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it("works when localStorage throws", () => {
    vi.stubGlobal("matchMedia", fakeMatchMedia("light"));
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
    expect(() => new Function(THEME_SCRIPT)()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("uses the stored choice", () => {
    vi.stubGlobal("matchMedia", fakeMatchMedia("light"));
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "dark", setItem: () => undefined },
    });
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("is dark with no matchMedia and no storage", () => {
    vi.stubGlobal("matchMedia", undefined);
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem: () => undefined },
    });
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
