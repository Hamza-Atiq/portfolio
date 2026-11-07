import type { MetadataRoute } from "next";
import { getBundle } from "@/lib/content";
import { siteUrl, sitemapFor } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const bundle = getBundle();
  return sitemapFor(bundle, siteUrl(process.env, { strict: !bundle.include_drafts }));
}
