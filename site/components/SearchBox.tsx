"use client";

import { useEffect, useId, useState } from "react";
import type { SearchEntry } from "@/lib/content";
import { cleanQuery, localSearch } from "@/lib/search";

const KIND = { project: "project", award: "award", news: "news", teaching: "teaching" } as const;

/** Finds projects, awards, news and teaching. Asks /api/search; if that fails, searches in the browser. */
export default function SearchBox({ index }: { index: SearchEntry[] }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchEntry[] | null>(null);

  useEffect(() => {
    const query = cleanQuery(q);
    if (!query) {
      setResults(null);
      return;
    }
    let live = true;
    const timer = setTimeout(async () => {
      let found: SearchEntry[];
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(String(res.status));
        found = ((await res.json()) as { results: SearchEntry[] }).results;
      } catch {
        found = localSearch(index, query);
      }
      if (live) setResults(found);
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [q, index]);

  return (
    <div className="search" role="search">
      <label htmlFor={id} className="small muted">
        Search projects, awards, news and teaching
      </label>
      <input
        id={id}
        type="search"
        autoFocus
        value={q}
        maxLength={100}
        autoComplete="off"
        onChange={(e) => setQ(e.target.value)}
      />
      {results !== null && (
        <ul className="search-results" aria-live="polite" data-search-results>
          {results.length === 0 && <li className="muted">Nothing found.</li>}
          {results.map((r) => (
            <li key={`${r.kind}-${r.slug}`}>
              <a href={r.url}>
                <span className="tag">{KIND[r.kind]}</span> {r.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
