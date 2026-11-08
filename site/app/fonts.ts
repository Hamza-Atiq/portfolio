import localFont from "next/font/local";

/** Fonts are served with the site (spec §6), from files in ./fonts (SIL Open Font License). */
export const serif = localFont({
  src: "./fonts/source-serif-4-latin-wght.woff2",
  weight: "200 900",
  display: "swap",
  variable: "--font-serif",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/** Roman-capital display font: only for Hamza's name and section headings (Hamza, 2026-11-08). */
export const display = localFont({
  src: "./fonts/cinzel-latin-wght.woff2",
  weight: "400 900",
  display: "swap",
  variable: "--font-display",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const sans = localFont({
  src: "./fonts/inter-latin-wght.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-sans",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});
