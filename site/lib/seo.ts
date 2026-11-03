import type { Metadata, MetadataRoute } from "next";
import type { Bundle } from "@/lib/content";

type Env = Record<string, string | undefined>;

export function siteUrl(env: Env = process.env): string {
  return (env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** The first sentence of a text, for one-line share previews. */
export function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : text).trim();
}

/** robots.txt decided from the build itself, not from an environment guess (FR-28). */
export function robotsFor(bundle: Bundle, site: string): MetadataRoute.Robots {
  if (bundle.include_drafts) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${site}/sitemap.xml` };
}

export function sitemapFor(bundle: Bundle, site: string): MetadataRoute.Sitemap {
  if (bundle.include_drafts) return [];
  return [{ url: `${site}/` }, ...bundle.projects.map((p) => ({ url: `${site}/projects/${p.slug}` }))];
}

export function rootMetadata(bundle: Bundle, env: Env = process.env): Metadata {
  const { profile } = bundle;
  const description = firstSentence(profile.summary);
  const meta: Metadata = {
    metadataBase: new URL(siteUrl(env)),
    title: profile.name,
    description,
    openGraph: {
      type: "website",
      title: profile.name,
      description,
      images: [{ url: profile.photo_dark.src, alt: profile.photo_dark.alt }],
    },
    twitter: { card: "summary", title: profile.name, description },
  };
  if (bundle.include_drafts) meta.robots = { index: false, follow: false };
  if (env.GOOGLE_SITE_VERIFICATION) meta.verification = { google: env.GOOGLE_SITE_VERIFICATION };
  return meta;
}
