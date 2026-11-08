/**
 * First-visit theme: the visitor's stored choice wins; otherwise DARK, whatever the device says.
 * (Hamza, 2026-11-08: "by default dark mode, but anyone can switch to light mode". This replaces
 * the old spec FR-18 rule "follow the device setting".)
 */
export type Theme = "dark" | "light";

export const THEME_KEY = "theme";

export function pickTheme(stored: string | null): Theme {
  if (stored === "dark" || stored === "light") return stored;
  return "dark";
}

/**
 * Runs inline in <head> before the first paint, so the page never flashes the wrong mode.
 * Same rules as pickTheme. Storage access is inside try/catch (blocked storage in a private window).
 */
export const THEME_SCRIPT = `(function () {
  var stored = null;
  try { stored = window.localStorage.getItem("${THEME_KEY}"); } catch (e) {}
  document.documentElement.dataset.theme = stored === "light" ? "light" : "dark";
})();`;
