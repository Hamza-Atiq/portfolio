"use client";

import { useEffect, useState } from "react";
import { THEME_KEY, type Theme } from "@/lib/theme-script";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = (document.documentElement.dataset.theme === "light" ? "light" : "dark") === "dark"
      ? "light"
      : "dark";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked: the choice lasts for this page only */
    }
    setTheme(next);
  }

  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  return (
    <button type="button" className="icon-button theme-toggle" onClick={toggle} aria-label={label} title={label}>
      <span aria-hidden="true" className="icon-light">☀</span>
      <span aria-hidden="true" className="icon-dark">☾</span>
    </button>
  );
}
