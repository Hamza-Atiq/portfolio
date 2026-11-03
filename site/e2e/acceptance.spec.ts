/**
 * Acceptance tests for spec §11 (plan Task 14 Step 1). They read the same `data/content.json` that the
 * running site was built from, so they work on the test fixture and on the real content alike.
 */
import fs from "node:fs";
import path from "node:path";
import { type Page, devices, expect, test } from "@playwright/test";
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
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
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
      .locator(
        "button:visible, .chip:visible, .buttons a:visible, details.more > summary:visible, .nav-list a:visible, " +
          ".icon-button:visible, .brand, .fact-link",
      )
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

test.describe("touch phone", () => {
  const { defaultBrowserType: _ignored, ...pixel } = devices["Pixel 7"];
  test.use(pixel);
  test("cards_do_not_stay_lifted_after_a_tap", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("#research .card").first();
    test.skip((await card.count()) === 0, "no project card in this build");
    await card.hover();
    expect(await card.evaluate((e) => getComputedStyle(e).transform)).toBe("none");
  });
});

test.describe("laptop, 1440 px (spec §6, §11)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("content_is_wide", async ({ page }) => {
    for (const path of ["/", ...bundle.projects.slice(0, 1).map((p) => `/projects/${p.slug}`)]) {
      await page.goto(path);
      const width = await page.locator("main .container").first().evaluate((e) => {
        const cs = getComputedStyle(e);
        return e.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      });
      expect(width, path).toBeGreaterThanOrEqual(1000);
    }
  });

  test("menu_visible_after_scrolling", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(300);
    const bar = page.locator(".topbar");
    await expect(bar).toBeInViewport();
    expect((await bar.boundingBox())!.y).toBeLessThanOrEqual(1);
    for (const id of ["about", "contact"]) await expect(bar.locator(`.nav-list a[href="#${id}"]`)).toBeVisible();
    await expect(bar.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(bar.locator(".theme-toggle")).toBeVisible();
  });

  test("current_section_is_marked", async ({ page }) => {
    await page.goto("/");
    const last = await page.locator("main section[id]").last().getAttribute("id");
    await page.locator(`#${last}`).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(`.nav-list a[aria-current="location"]`)).toHaveAttribute("href", `#${last}`);
  });

  test("photo_right_of_summary", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator(".hero-summary").boundingBox())!;
    const photo = (await page.locator(".photo").boundingBox())!;
    expect(photo.x).toBeGreaterThanOrEqual(text.x + text.width);
    expect(photo.y).toBeLessThan(text.y + text.height); // side by side, not below
  });

  test("sections_order_1440", async ({ page }) => {
    await page.goto("/");
    const ids = await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(SECTION_ORDER.filter((id) => ids.includes(id)));
    const tops = await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
    expect([...tops].sort((a, b) => a - b)).toEqual(tops);
  });

  test("facts_row_is_one_row", async ({ page }) => {
    await page.goto("/");
    const facts = page.locator(".facts > li");
    const n = await facts.count();
    test.skip(n === 0, "no facts in this build");
    const ys = await facts.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(ys).size).toBe(1);
  });

  test("project_rows_show_image_left_of_text", async ({ page }) => {
    await page.goto("/");
    const row = page.locator("#research .project-row:has(.project-cover)").first();
    test.skip((await row.count()) === 0, "no project with a cover");
    const img = (await row.locator(".project-cover").boundingBox())!;
    const body = (await row.locator(".project-body").boundingBox())!;
    expect(img.x + img.width).toBeLessThanOrEqual(body.x + 1);
    await expect(row.locator(".result")).toBeVisible();
  });

  test("filter_chips_filter_projects", async ({ page }) => {
    const research = bundle.projects.filter((p) => p.kind === "research");
    test.skip(research.length < 4, "needs 4 or more research projects (npm run fixture:filled)");
    await page.goto("/");
    const chips = page.locator("#research [data-filter-chips] button");
    await expect(chips.first()).toHaveText("all");
    const tag = research[0].tags[0];
    await page.locator("#research [data-filter-chips]").getByRole("button", { name: tag, exact: true }).click();
    const expected = research.filter((p) => p.tags.includes(tag)).length;
    await expect(page.locator("#research .project-row")).toHaveCount(expected);
    await chips.first().click();
    await expect(page.locator("#research .project-row")).toHaveCount(research.length);
  });

  test("search_button_opens_and_finds", async ({ page }) => {
    await page.goto("/");
    await page.locator(".topbar").getByRole("button", { name: "Search" }).click();
    const box = page.locator("dialog[open] input[type=search]");
    await expect(box).toBeVisible();
    const word = bundle.search_index[0].title.split(/\s+/)[0];
    await box.fill(word);
    await expect(page.locator("[data-search-results] a").first()).toBeVisible();
    // In a search field the first Escape clears the text (browser default); the next one closes the box.
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });
});

test.describe("phone, 360 px", () => {
  test.use({ viewport: { width: 360, height: 780 } });
  test("menu_button_opens_the_sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".nav-list a").first()).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.locator(".nav-list a").first()).toBeVisible();
    await page.locator('.nav-list a[href="#contact"]').click();
    await expect(page.locator("#contact")).toBeInViewport();
    await expect(page.locator(".nav-list a").first()).toBeHidden();
  });
});
