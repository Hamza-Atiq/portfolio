import type { MetadataRoute } from "next";
import { getBundle } from "@/lib/content";
import { siteUrl, sitemapFor } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapFor(getBundle(), siteUrl());
}
