/**
 * Acceptance tests for spec §11 (plan Task 14 Step 1). They read the same `data/content.json` that the
 * running site was built from, so they work on the test fixture and on the real content alike.
 */
import fs from "node:fs";
import path from "node:path";
import { type Page, expect, test } from "@playwright/test";
import type { Bundle } from "../lib/content";

const bundle: Bundle = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "content.json"), "utf-8"),
);

const SECTION_ORDER = ["about", "news", "interests", "research", "hackathons", "teaching", "awards", "skills", "contact"];
const P013 = "p013-grid-contingency";

/** Records `data-theme` at DOMContentLoaded, before images paint (no flash of the wrong mode). */
async function recordEarlyTheme(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      (window as unknown as { __earlyTheme?: string }).__earlyTheme = document.documentElement.dataset.theme;
    });
  });
}

async function earlyTheme(page: Page): Promise<string | undefined> {
  return page.evaluate(() => (window as unknown as { __earlyTheme?: string }).__earlyTheme);
}

async function visiblePhotoSrc(page: Page): Promise<string> {
  const src = await page.locator(".photo img:visible").first().getAttribute("src");
  return decodeURIComponent(src ?? "");
}

test("no_sideways_scroll_360_and_1440", async ({ page }) => {
  const paths = ["/", ...bundle.projects.map((p) => `/projects/${p.slug}`), "/nope"];
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    for (const p of paths) {
      await page.goto(p);
      const { sw, cw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      expect(sw, `${p} at ${width}px`).toBeLessThanOrEqual(cw);
    }
  }
});

test("sections_order", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.id));
  const expected = SECTION_ORDER.filter((id) => ids.includes(id));
  expect(ids).toEqual(expected);
  for (const always of ["about", "hackathons", "contact"]) expect(ids).toContain(always);
});

test.describe("light device", () => {
  test.use({ colorScheme: "light" });
  test("light_device_opens_light", async ({ page }) => {
    await recordEarlyTheme(page);
    await page.goto("/");
    expect(await earlyTheme(page)).toBe("light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});

test.describe("dark device", () => {
  test.use({ colorScheme: "dark" });
  test("dark_device_opens_dark", async ({ page }) => {
    await recordEarlyTheme(page);
    await page.goto("/");
    expect(await earlyTheme(page)).toBe("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("toggle", () => {
  test.use({ colorScheme: "dark" });
  test("toggle_remembered_after_reload", async ({ page }) => {
    await page.goto("/");
    await page.locator(".theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await recordEarlyTheme(page);
    await page.reload();
    expect(await earlyTheme(page)).toBe("light");
    await page.locator(".theme-toggle").click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("photo_changes_with_theme", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".photo img:visible")).toHaveCount(1);
    expect(await visiblePhotoSrc(page)).toContain(bundle.profile.photo_dark.src);
    await page.locator(".theme-toggle").click();
    await expect(page.locator(".photo img:visible")).toHaveCount(1);
    expect(await visiblePhotoSrc(page)).toContain(bundle.profile.photo_light.src);
  });
});

test("p013_page_opens", async ({ page }) => {
  const project = bundle.projects.find((p) => p.slug === P013);
  test.skip(!project, `${P013} is not in this build`);
  const res = await page.goto(`/projects/${P013}`);
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText(project!.title);
  await expect(page.getByText(project!.result)).toBeVisible();
  await page.goto("/");
  await page.locator(`a[href="/projects/${P013}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`/projects/${P013}$`));
});

test("wrong_address_custom_404", async ({ page }) => {
  for (const p of ["/nope", "/projects/nope"]) {
    const res = await page.goto(p);
    expect(res?.status(), p).toBe(404);
    await expect(page.getByRole("heading", { name: /page not found/ })).toBeVisible();
    await expect(page.locator('main a[href="/"]')).toBeVisible();
  }
});

test("favicon_answers_200", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="icon"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/svg+xml");
});

test("robots_and_sitemap_match_build", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  await page.goto("/");
  const meta = page.locator('meta[name="robots"]');
  const robotsMeta = (await meta.count()) > 0 ? await meta.first().getAttribute("content") : null;
  if (bundle.include_drafts) {
    expect(robots).toMatch(/Disallow: \/\s*$/m);
    expect(sitemap).not.toContain("<loc>");
    expect(robotsMeta).toContain("noindex");
  } else {
    expect(robots).toContain("Allow: /");
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    for (const p of bundle.projects) expect(sitemap).toContain(`/projects/${p.slug}</loc>`);
    expect(robotsMeta).toBeNull();
  }
});

test("tap_targets_44px", async ({ page }) => {
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    // Every button, filter chip, About/Contact button and interest chip; inline `proof ↗` text links are
    // exempt (WCAG 2.5.8 inline exception).
    const boxes = await page
      .locator("button:visible, .chip:visible, .buttons a:visible, details.more > summary:visible, .search input")
      .evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { what: e.outerHTML.slice(0, 80), w: r.width, h: r.height };
        }),
      );
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b.w, b.what).toBeGreaterThanOrEqual(44);
      expect(b.h, b.what).toBeGreaterThanOrEqual(44);
    }
  }
});

test("draft_not_on_public", async ({ page }) => {
  test.skip(bundle.include_drafts, "this build includes drafts (preview); run against a production build");
  const items = [
    ...bundle.news,
    ...bundle.projects,
    ...bundle.teaching,
    ...bundle.awards.main,
    ...bundle.awards.other,
  ];
  for (const item of items) expect(item.status, item.slug).toBe("published");
  for (const item of items) expect(item.reviewed_by_hamza, item.slug).toBeTruthy();
  await page.goto("/");
  for (const n of bundle.news.slice(0, 6)) await expect(page.getByText(n.text).first()).toBeVisible();
});
