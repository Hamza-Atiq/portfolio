/** First-visit theme (spec FR-18): stored choice wins; else the device setting; else dark. */
export type Theme = "dark" | "light";

export const THEME_KEY = "theme";

export function pickTheme(stored: string | null, prefersDark: boolean | null): Theme {
  if (stored === "dark" || stored === "light") return stored;
  if (prefersDark === true) return "dark";
  if (prefersDark === false) return "light";
  return "dark";
}

/**
 * Runs inline in <head> before the first paint, so the page never flashes the wrong mode.
 * Same rules as pickTheme. Every storage access is inside try/catch (blocked storage in a private window).
 */
export const THEME_SCRIPT = `(function () {
  var stored = null, prefersDark = null;
  try { stored = window.localStorage.getItem("${THEME_KEY}"); } catch (e) {}
  try {
    if (typeof window.matchMedia === "function") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) prefersDark = true;
      else if (window.matchMedia("(prefers-color-scheme: light)").matches) prefersDark = false;
    }
  } catch (e) {}
  var theme = stored === "dark" || stored === "light" ? stored
    : prefersDark === true ? "dark" : prefersDark === false ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
})();`;
