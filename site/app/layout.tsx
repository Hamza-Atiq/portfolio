import type { Metadata, Viewport } from "next";
import { getBundle } from "@/lib/content";
import { rootMetadata } from "@/lib/seo";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { sans, serif } from "./fonts";
import "./globals.css";

const bundle = getBundle();

export function generateMetadata(): Metadata {
  return rootMetadata(bundle);
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141417" },
    { media: "(prefers-color-scheme: light)", color: "#FAF8F4" },
  ],
};

/** Each page renders its own TopBar (it needs to know whether it is the main page) and <main>. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body id="top">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
