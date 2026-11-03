"use client";

import { useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/content";

const CHIPS_FROM = 4;

/** Project cards with filter chips by tag; chips appear only with 4 or more projects (spec §4). */
export default function ProjectList({ projects }: { projects: Project[] }) {
  const [tag, setTag] = useState<string | null>(null);
  const tags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort();
  const showChips = projects.length >= CHIPS_FROM && tags.length > 0;
  const shown = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;
  return (
    <>
      {showChips && (
        <div className="chips" data-filter-chips role="group" aria-label="Filter by tag">
          <button type="button" className="chip" aria-pressed={tag === null} onClick={() => setTag(null)}>
            all
          </button>
          {tags.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={tag === t} onClick={() => setTag(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="cards">
        {shown.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </>
  );
}
