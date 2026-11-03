import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/components/Home";
import ProjectRow from "@/components/ProjectRow";
import TopBar from "@/components/TopBar";
import { type Bundle, getBundle } from "@/lib/content";
import { navItems } from "@/lib/nav";

function fresh(): Bundle {
  return structuredClone(getBundle());
}

describe("facts row (spec §6)", () => {
  it("shows each fact with its label, title, detail and link", () => {
    const b = fresh();
    const { container } = render(<Home bundle={b} />);
    const facts = container.querySelectorAll("#about .facts > li");
    expect(facts).toHaveLength(b.profile.facts!.length);
    const research = facts[1] as HTMLElement;
    expect(research.textContent).toContain("Research");
    expect(research.querySelector("a")?.getAttribute("href")).toBe("#research");
    const competitions = facts[3] as HTMLElement;
    expect(competitions.querySelector("a")?.getAttribute("href")).toBe(b.profile.facts![3].link);
    expect(competitions.querySelector("a")?.getAttribute("target")).toBe("_blank");
    expect((facts[0] as HTMLElement).querySelector("a")).toBeNull(); // no link given
    expect((facts[0] as HTMLElement).textContent).toContain(b.profile.facts![0].detail!);
  });

  it("has no facts row when profile.yml has no facts", () => {
    const b = fresh();
    b.profile.facts = [];
    const { container } = render(<Home bundle={b} />);
    expect(container.querySelector(".facts")).toBeNull();
  });

  it("photo comes after the text in the first screen (it sits on the right)", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const text = container.querySelector(".hero-text")!;
    const photo = container.querySelector(".hero-photo")!;
    expect(text.compareDocumentPosition(photo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("project rows", () => {
  it("show the result and the code, demo and proof links without opening the page", () => {
    const p = { ...structuredClone(getBundle().projects[0]), proofs: [{ label: "proof" as const, url: "/c/proofs/x.png" }] };
    const { container } = render(<ProjectRow project={p} />);
    expect(container.textContent).toContain(p.result);
    const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toContain(p.links.code);
    expect(hrefs).toContain(p.links.demo);
    expect(hrefs).toContain("/c/proofs/x.png");
    expect(hrefs).toContain(`/projects/${p.slug}`);
  });
});

describe("teaching timeline", () => {
  it("shows at most 3 video thumbnails, the rest under show all", () => {
    const b = fresh();
    b.teaching[0].videos = Array.from({ length: 5 }, (_, i) => ({
      title: `V${i}`,
      url: `https://www.youtube.com/watch?v=abcdefghij${i}`,
    }));
    const { container } = render(<Home bundle={b} />);
    const item = container.querySelector("#teaching .timeline-item") as HTMLElement;
    const details = item.querySelector("details") as HTMLElement;
    const all = Array.from(item.querySelectorAll(".video"));
    expect(all.filter((a) => !details.contains(a))).toHaveLength(3);
    expect(within(details).getAllByRole("link", { hidden: true })).toHaveLength(2);
    expect(details.querySelector("summary")?.textContent).toContain("5");
  });

  it("shows the role and the date", () => {
    const { container } = render(<Home bundle={fresh()} />);
    const t = getBundle().teaching[0];
    const item = container.querySelector("#teaching .timeline-item") as HTMLElement;
    expect(item.textContent).toContain(t.role);
    expect(item.querySelector(".timeline-when")?.textContent).toBeTruthy();
  });
});

describe("top menu", () => {
  it("links to every shown section in spec order, and has search, CV and theme buttons", () => {
    const b = fresh();
    const { container, getByRole } = render(<TopBar bundle={b} home />);
    const hrefs = Array.from(container.querySelectorAll(".nav-list a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(navItems(b).map((i) => `#${i.id}`));
    expect(hrefs[0]).toBe("#about");
    expect(hrefs.at(-1)).toBe("#contact");
    expect(getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(container.querySelector(`a.cv-link[href='${b.profile.cv_file}']`)).not.toBeNull();
  });

  it("links point back to the main page from other pages", () => {
    const { container } = render(<TopBar bundle={fresh()} home={false} />);
    expect(container.querySelector(".nav-list a")?.getAttribute("href")).toBe("/#about");
  });

  it("hides links of sections that are not shown", () => {
    const b = fresh();
    b.teaching = [];
    b.skills = [];
    const ids = navItems(b).map((i) => i.id);
    expect(ids).not.toContain("teaching");
    expect(ids).not.toContain("skills");
  });

  it("the Menu button opens the section list on small screens", () => {
    const { getByRole, container } = render(<TopBar bundle={fresh()} home />);
    const menu = getByRole("button", { name: "Menu" });
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(menu);
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector(".nav-list")?.classList.contains("open")).toBe(true);
  });

  it("the search button opens the search box", async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    const { getByRole, container } = render(<TopBar bundle={fresh()} home />);
    fireEvent.click(getByRole("button", { name: "Search" }));
    expect(container.querySelector("dialog")?.hasAttribute("open")).toBe(true);
    await waitFor(() => expect(container.querySelector("dialog input[type='search']")).not.toBeNull());
  });
});
