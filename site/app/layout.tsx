import type { Metadata, Viewport } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { getBundle, siteName } from "@/lib/content";
import { THEME_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const bundle = getBundle();

export const metadata: Metadata = {
  title: bundle.profile.name,
  description: bundle.profile.tagline,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#141417" },
    { media: "(prefers-color-scheme: light)", color: "#FAF8F4" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="site-name">
            {siteName(bundle.profile)}
          </Link>
          <ThemeToggle />
        </header>
        <main id="main" className="page">
          {children}
        </main>
      </body>
    </html>
  );
}
