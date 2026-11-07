import { describe, expect, it } from "vitest";
import { type Bundle, getBundle } from "@/lib/content";
import { robotsFor, rootMetadata, sitemapFor } from "@/lib/seo";

const SITE = "https://example-site.test";

function bundle(include_drafts: boolean): Bundle {
  return { ...structuredClone(getBundle()), include_drafts };
}

describe("robots, sitemap and root metadata", () => {
  it("robots_public_allows_and_names_sitemap", () => {
    const r = robotsFor(bundle(false), SITE);
    expect(r.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(r.sitemap).toBe(`${SITE}/sitemap.xml`);
  });

  it("robots_drafts_disallow", () => {
    const r = robotsFor(bundle(true), SITE);
    expect(r.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(r.sitemap).toBeUndefined();
  });

  it("sitemap_lists_home_and_projects", () => {
    const b = bundle(false);
    const urls = sitemapFor(b, SITE).map((e) => e.url);
    expect(urls).toEqual([`${SITE}/`, ...b.projects.map((p) => `${SITE}/projects/${p.slug}`)]);
  });

  it("sitemap_empty_for_drafts", () => {
    expect(sitemapFor(bundle(true), SITE)).toEqual([]);
  });

  it("drafts_build_is_noindex", () => {
    expect(rootMetadata(bundle(true), {}).robots).toEqual({ index: false, follow: false });
    expect(rootMetadata(bundle(false), {}).robots).toBeUndefined();
  });

  it("google_verification_only_when_set", () => {
    expect(rootMetadata(bundle(false), {}).verification).toBeUndefined();
    expect(rootMetadata(bundle(false), { GOOGLE_SITE_VERIFICATION: "abc123" }).verification).toEqual({
      google: "abc123",
    });
  });

  it("root_metadata_has_og_photo", () => {
    const b = bundle(false);
    const m = rootMetadata(b, { SITE_URL: SITE });
    expect(m.metadataBase?.toString()).toBe(`${SITE}/`);
    const images = m.openGraph?.images as { url: string }[];
    expect(images[0].url).toBe(b.profile.photo_dark.src);
    expect(m.title).toBeTruthy();
    expect(m.description).toBeTruthy();
  });
});

describe("site address", () => {
  it("uses SITE_URL, else Vercel's production address", async () => {
    const { siteUrl } = await import("@/lib/seo");
    expect(siteUrl({ SITE_URL: "https://a.test/" })).toBe("https://a.test");
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "hamza.vercel.app" })).toBe("https://hamza.vercel.app");
  });

  it("a public production build without an address fails instead of listing localhost", async () => {
    const { siteUrl } = await import("@/lib/seo");
    expect(() => siteUrl({ NODE_ENV: "production" }, { strict: true })).toThrow(/SITE_URL/);
    expect(siteUrl({ NODE_ENV: "production" })).toBe("http://localhost:3000");
    expect(() => robotsFor(bundle(false), siteUrl({ NODE_ENV: "development" }, { strict: true }))).not.toThrow();
  });
});
