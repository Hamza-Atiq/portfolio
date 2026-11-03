"use client";

import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/nav";

/** Section links with the current section marked; on small screens they open from a Menu button. */
export default function NavLinks({ items, home }: { items: NavItem[]; home: boolean }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!home || typeof IntersectionObserver === "undefined") return;
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => e !== null);
    const visible = new Map<string, number>();
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const update = () => {
      // at the very bottom the last section is current, even when it is too short to reach the marker line
      if (atBottom() && sections.length > 0) return setCurrent(sections[sections.length - 1].id);
      // otherwise the first section (in page order) that is on screen
      const first = sections.find((s) => (visible.get(s.id) ?? 0) > 0);
      if (first) setCurrent(first.id);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        update();
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: [0, 0.01] },
    );
    sections.forEach((s) => io.observe(s));
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [items, home]);

  return (
    <nav className="nav" aria-label="Sections">
      <button
        type="button"
        className="icon-button nav-toggle"
        aria-expanded={open}
        aria-controls="nav-list"
        onClick={() => setOpen((o) => !o)}
      >
        Menu
      </button>
      <ul id="nav-list" className={open ? "nav-list open" : "nav-list"}>
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={home ? `#${i.id}` : `/#${i.id}`}
              aria-current={current === i.id ? "location" : undefined}
              onClick={() => setOpen(false)}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
