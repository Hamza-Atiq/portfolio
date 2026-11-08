import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/components/Home";
import { type Bundle, type NewsItem, type Project, getBundle } from "@/lib/content";

function fresh(): Bundle {
  return structuredClone(getBundle());
}

function sectionIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("section[id]")).map((s) => s.id);
}

function project(n: number, tags: string[] = ["t"]): Project {
  const p = structuredClone(getBundle().projects[0]);
  return { ...p, slug: `project-${n}`, title: `Project ${n}`, tags, pin: null };
}

describe("main page", () => {
  it("sections_in_spec_order", () => {
    const { container } = render(<Home bundle={fresh()} />);
    expect(sectionIds(container)).toEqual([
      "about",
      "news",
      "interests",
      "research",
      "hackathons",
      "teaching",
      "awards",
      "skills",
      "contact",
    ]);
  });

  it("empty_section_hidden", () => {
    const b = fresh();
    b.teaching = [];
    b.skills = [];
    const { container } = render(<Home bundle={b} />);
    expect(container.querySelector("#teaching")).toBeNull();
    expect(container.querySelector("#skills")).toBeNull();
  });

  it("hackathon_placeholder_shown", () => {
    const b = fresh();
    b.projects = b.projects.filter((p) => p.kind !== "hackathon");
    const { container } = render(<Home bundle={b} />);
    const sec = container.querySelector("#hackathons") as HTMLElement;
    expect(sec).not.toBeNull();
    expect(sec.textContent).toContain("Hackathon projects are added one by one after review.");
  });

  it("news_shows_six_then_more", () => {
    const b = fresh();
    const base = b.news[0];
    b.news = Array.from({ length: 8 }, (_, i): NewsItem => ({ ...base, slug: `n-${i}`, text: `News line ${i}` }));
    const { container } = render(<Home bundle={b} />);
    const news = container.querySelector("#news") as HTMLElement;
    const details = news.querySelector("details") as HTMLElement;
    expect(details).not.toBeNull();
    const all = Array.from(news.querySelectorAll("li"));
    const outside = all.filter((li) => !details.contains(li));
    expect(outside).toHaveLength(6);
    expect(within(details).getAllByRole("listitem", { hidden: true })).toHaveLength(2);
  });

  it("no_more_button_with_six_or_less", () => {
    const { container } = render(<Home bundle={fresh()} />);
    expect(container.querySelector("#news details")).toBeNull();
  });

  it("chips_only_with_four_projects", () => {
    const b = fresh();
    b.projects = [1, 2, 3].map((n) => project(n));
    const r1 = render(<Home bundle={b} />);
    expect(r1.container.querySelector("#research [data-filter-chips]")).toBeNull();
    r1.unmount();
    b.projects = [1, 2, 3, 4].map((n) => project(n, n % 2 ? ["power"] : ["ml"]));
    const r2 = render(<Home bundle={b} />);
    const chips = r2.container.querySelector("#research [data-filter-chips]") as HTMLElement;
    expect(chips).not.toBeNull();
    expect(within(chips).getAllByRole("button").map((x) => x.textContent)).toEqual(["all", "ml", "power"]);
  });

  it("cv_button_hidden_when_null", () => {
    const b = fresh();
    const r1 = render(<Home bundle={b} />);
    expect(r1.getAllByRole("link", { name: /download cv/i }).length).toBeGreaterThan(0);
    r1.unmount();
    b.profile.cv_file = null;
    render(<Home bundle={b} />);
    expect(screen.queryByRole("link", { name: /download cv/i })).toBeNull();
  });

  it("english_line_hidden_without_url", () => {
    const b = fresh();
    const text = b.profile.english_test.text;
    const r1 = render(<Home bundle={b} />);
    expect(r1.getByText(text)).toBeInTheDocument();
    r1.unmount();
    b.profile.english_test.url = null;
    render(<Home bundle={b} />);
    expect(screen.queryByText(text)).toBeNull();
  });

  it("card_without_cover_has_no_img", () => {
    const b = fresh();
    b.projects = [{ ...project(1), cover: null }];
    const { container } = render(<Home bundle={b} />);
    const card = container.querySelector("#research .card") as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.querySelector("img")).toBeNull();
  });

  it("card_with_cover_uses_alt", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const img = container.querySelector("#research .card img") as HTMLImageElement;
    expect(img.alt).toBe(getBundle().projects[0].cover?.alt);
  });

  it("awards_other_list_after_main", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const awards = container.querySelector("#awards") as HTMLElement;
    const main = awards.querySelector("[data-awards='main']") as HTMLElement;
    const other = awards.querySelector("[data-awards='other']") as HTMLElement;
    expect(main.textContent).toContain(getBundle().awards.main[0].text);
    expect(other.textContent).toContain(getBundle().awards.other[0].text);
    expect(main.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(awards.textContent).toContain("Other international competitions");
  });

  it("teaching_shows_video_thumbnails", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const img = container.querySelector("#teaching img") as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(decodeURIComponent(img.getAttribute("src") ?? "")).toContain("abcdefghijk");
    expect(img.closest("a")?.getAttribute("href")).toBe("https://www.youtube.com/watch?v=abcdefghijk");
  });

  it("image_proof_has_thumbnail", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const thumb = container.querySelector("#awards a[href='/c/proofs/test_certificate.png'] img");
    expect(thumb).not.toBeNull();
  });

  it("each_claim_has_a_proof_link", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const awards = container.querySelector("#awards") as HTMLElement;
    expect(within(awards).getAllByText("Proof ↗").length).toBe(2);
    const news = container.querySelector("#news") as HTMLElement;
    expect(within(news).getAllByText(/^(Code|Proof) ↗$/).length).toBe(getBundle().news.length);
  });

  it("email_shown_as_text_and_mailto", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const contact = container.querySelector("#contact") as HTMLElement;
    const email = getBundle().profile.email;
    expect(contact.textContent).toContain(email);
    expect(contact.querySelector(`a[href='mailto:${email}']`)).not.toBeNull();
  });

  it("interest_chips_link_only_when_a_project_matches", () => {
    const { container } = render(<Home bundle={fresh()} />);
    // Fixture: "Power systems" has project p013 (tag power-systems); "TinyML" has none.
    const links = container.querySelectorAll("#about a.chip");
    expect(links.length).toBe(1);
    expect(links[0].getAttribute("href")).toBe("/projects/p013-grid-contingency");
    const plain = container.querySelectorAll("#about span.chip-static");
    expect(Array.from(plain).map((c) => c.textContent)).toEqual(["TinyML"]);
  });

  it("show_all_button_changes_text_when_open", () => {
    const { container } = render(<Home bundle={fresh()} />);
    container.querySelectorAll("details.more > summary").forEach((s) => {
      expect(s.querySelector(".when-closed")?.textContent).toMatch(/^Show all/);
      expect(s.querySelector(".when-open")?.textContent).toMatch(/^Show less/);
    });
  });
});
