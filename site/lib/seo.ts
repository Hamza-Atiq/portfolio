import type { Metadata, MetadataRoute } from "next";
import type { Bundle } from "@/lib/content";

type Env = Record<string, string | undefined>;

const LOCAL = "http://localhost:3000";

/**
 * The public address: SITE_URL, else the production address Vercel gives every build.
 * With `strict` (robots, sitemap and share previews of a public production build), a missing address is an
 * error, so the live sitemap can never list localhost.
 */
export function siteUrl(env: Env = process.env, opts: { strict?: boolean } = {}): string {
  if (env.SITE_URL) return env.SITE_URL.replace(/\/+$/, "");
  if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}`;
  if (opts.strict && env.NODE_ENV === "production") {
    throw new Error("SITE_URL is not set: set it in Vercel (and GitHub) to the public address of the site");
  }
  return LOCAL;
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
    metadataBase: new URL(siteUrl(env, { strict: !bundle.include_drafts })),
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
