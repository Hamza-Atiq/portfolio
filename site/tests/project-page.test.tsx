import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/navigation", () => ({ notFound }));

import ProjectPage from "@/components/ProjectPage";
import Page, { generateMetadata, generateStaticParams } from "@/app/projects/[slug]/page";
import { type Project, getBundle } from "@/lib/content";

function p013(): Project {
  return structuredClone(getBundle().projects.find((p) => p.slug === "p013-grid-contingency")!);
}

describe("project page", () => {
  beforeEach(() => {
    notFound.mockClear();
  });

  it("renders_p013_fields", () => {
    const p = p013();
    const { container, getByRole } = render(<ProjectPage project={p} />);
    expect(getByRole("heading", { level: 1 }).textContent).toBe(p.title);
    expect(container.textContent).toContain("solo");
    expect(container.textContent).toContain(p.result);
    expect(container.textContent).toContain(p.my_role!);
    expect(container.querySelector("a[href='https://example.com/code/test-project']")).not.toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe("Problem");
  });

  it("role_hidden_when_absent", () => {
    const p = { ...p013(), my_role: null, team: "team of 3" };
    const { container } = render(<ProjectPage project={p} />);
    expect(container.textContent).not.toMatch(/my role/i);
    expect(container.textContent).toContain("team of 3");
  });

  it("markdown_raw_html_not_rendered", () => {
    const p = { ...p013(), body: "Hello\n\n<script>alert(1)</script>\n\n<b>bold</b>" };
    const { container } = render(<ProjectPage project={p} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector(".prose b")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });

  it("images_have_alt", () => {
    const p = { ...p013(), images: [{ src: "/c/images/p013/cover.png", alt: "A result chart" }] };
    const { container } = render(<ProjectPage project={p} />);
    const alts = Array.from(container.querySelectorAll("img")).map((i) => i.getAttribute("alt"));
    expect(alts).toContain("A result chart");
    expect(alts.every((a) => a && a.length > 0)).toBe(true);
  });

  it("metadata_has_og_image", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "p013-grid-contingency" }) });
    const p = p013();
    expect(meta.title).toBe(p.title);
    expect(meta.description).toBe(p.summary);
    const images = meta.openGraph?.images as { url: string; alt: string }[];
    expect(images[0].url).toBe(p.cover!.src);
    expect(images[0].alt).toBe(p.cover!.alt);
  });

  it("metadata_falls_back_to_photo_without_cover", async () => {
    const b = getBundle();
    const p = b.projects[0];
    const saved = p.cover;
    p.cover = null;
    try {
      const meta = await generateMetadata({ params: Promise.resolve({ slug: p.slug }) });
      const images = meta.openGraph?.images as { url: string }[];
      expect(images[0].url).toBe(b.profile.photo_dark.src);
    } finally {
      p.cover = saved;
    }
  });

  it("static_params_list_projects", () => {
    expect(generateStaticParams()).toEqual(getBundle().projects.map((p) => ({ slug: p.slug })));
  });

  it("unknown_project_calls_not_found", async () => {
    await expect(Page({ params: Promise.resolve({ slug: "nope" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("known_project_renders", async () => {
    const el = await Page({ params: Promise.resolve({ slug: "p013-grid-contingency" }) });
    const { container } = render(el);
    expect(container.querySelector("h1")?.textContent).toBe(p013().title);
    expect(notFound).not.toHaveBeenCalled();
  });
});
