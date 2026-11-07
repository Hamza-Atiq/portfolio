import type { MetadataRoute } from "next";
import { getBundle } from "@/lib/content";
import { robotsFor, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const bundle = getBundle();
  return robotsFor(bundle, siteUrl(process.env, { strict: !bundle.include_drafts }));
}
