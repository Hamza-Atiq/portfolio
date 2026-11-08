import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_SCRIPT, pickTheme } from "@/lib/theme-script";

describe("pickTheme", () => {
  it("stored choice wins", () => {
    expect(pickTheme("light")).toBe("light");
    expect(pickTheme("dark")).toBe("dark");
  });
  it("is dark when nothing is stored", () => {
    expect(pickTheme(null)).toBe("dark");
  });
  it("ignores a broken stored value", () => {
    expect(pickTheme("purple")).toBe("dark");
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

  it("works when localStorage throws (dark)", () => {
    vi.stubGlobal("matchMedia", fakeMatchMedia("light"));
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
    expect(() => new Function(THEME_SCRIPT)()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("is dark on a light-mode device when nothing is stored", () => {
    vi.stubGlobal("matchMedia", fakeMatchMedia("light"));
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem: () => undefined },
    });
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("uses a stored light choice", () => {
    vi.stubGlobal("matchMedia", fakeMatchMedia("dark"));
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "light", setItem: () => undefined },
    });
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
