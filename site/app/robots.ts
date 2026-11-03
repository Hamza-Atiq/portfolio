import type { MetadataRoute } from "next";
import { getBundle } from "@/lib/content";
import { robotsFor, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return robotsFor(getBundle(), siteUrl());
}
