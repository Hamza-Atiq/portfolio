import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { neonQuery } = vi.hoisted(() => ({ neonQuery: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => ({ query: neonQuery }) }));

import { GET } from "@/app/api/search/route";
import type { SearchEntry } from "@/lib/content";
import { localSearch } from "@/lib/search";

const INDEX: SearchEntry[] = [
  { kind: "project", slug: "grid", title: "Grid contingency screening", text: "Power line failures, graph neural network", url: "/projects/grid" },
  { kind: "award", slug: "calico", title: "Berkeley CALICO", text: "Bronze Brick Award, team of 3", url: "/#awards" },
  { kind: "news", slug: "cafe", title: "Café talk", text: "Talked about résumé writing", url: "/#news" },
];

function req(q: string): Request {
  return new Request(`http://localhost/api/search?q=${encodeURIComponent(q)}`);
}

describe("localSearch", () => {
  it("local_search_all_words", () => {
    expect(localSearch(INDEX, "graph power").map((e) => e.slug)).toEqual(["grid"]);
    expect(localSearch(INDEX, "graph bronze")).toEqual([]);
    expect(localSearch(INDEX, "team").map((e) => e.slug)).toEqual(["calico"]);
  });

  it("local_search_ignores_case_and_accents", () => {
    expect(localSearch(INDEX, "CAFE RESUME").map((e) => e.slug)).toEqual(["cafe"]);
    expect(localSearch(INDEX, "café").map((e) => e.slug)).toEqual(["cafe"]);
    expect(localSearch(INDEX, "GRID").map((e) => e.slug)).toEqual(["grid"]);
  });

  it("local_search_limit_and_empty", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ ...INDEX[0], slug: `g${i}` }));
    expect(localSearch(many, "grid")).toHaveLength(10);
    expect(localSearch(many, "grid", 3)).toHaveLength(3);
    expect(localSearch(INDEX, "   ")).toEqual([]);
  });
});

describe("GET /api/search", () => {
  beforeEach(() => {
    neonQuery.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("route_empty_query", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://fake-host/db");
    const body = await (await GET(req("   "))).json();
    expect(body.results).toEqual([]);
    expect(neonQuery).not.toHaveBeenCalled();
  });

  it("route_without_database_uses_local", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const body = await (await GET(req("test project"))).json();
    expect(body.source).toBe("local");
    expect(body.results.map((e: SearchEntry) => e.slug)).toContain("p013-grid-contingency");
  });

  it("route_uses_database_when_it_answers", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://fake-host/db");
    neonQuery.mockResolvedValue([{ kind: "news", slug: "x", title: "X", body: "from db", url: "/#news" }]);
    const body = await (await GET(req("grid"))).json();
    expect(body).toEqual({
      source: "db",
      results: [{ kind: "news", slug: "x", title: "X", text: "from db", url: "/#news" }],
    });
    const [sql, params] = neonQuery.mock.calls[0];
    expect(sql).toContain("websearch_to_tsquery('english', $1)");
    expect(sql).toContain("limit 10");
    expect(params).toEqual(["grid"]);
  });

  it("route_falls_back_after_2s", async () => {
    vi.useFakeTimers();
    vi.stubEnv("DATABASE_URL", "postgresql://fake-host/db");
    neonQuery.mockReturnValue(new Promise(() => {})); // the database never answers
    const pending = GET(req("test project"));
    await vi.advanceTimersByTimeAsync(1999);
    let done = false;
    pending.then(() => (done = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const body = await (await pending).json();
    expect(body.source).toBe("local");
    expect(body.results.length).toBeGreaterThan(0);
  });

  it("route_falls_back_on_db_error", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://fake-host/db");
    neonQuery.mockRejectedValue(new Error("down"));
    const body = await (await GET(req("test project"))).json();
    expect(body.source).toBe("local");
  });

  it("route_cuts_long_query_to_100_chars", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://fake-host/db");
    neonQuery.mockResolvedValue([]);
    await GET(req("  " + "a".repeat(150) + "  "));
    expect(neonQuery.mock.calls[0][1][0]).toBe("a".repeat(100));
  });
});

describe("SearchBox", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("searchbox_falls_back_to_browser_search", async () => {
    const { render, screen, fireEvent, findByText } = await import("@testing-library/react");
    const { default: SearchBox } = await import("@/components/SearchBox");
    const React = await import("react");
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    render(React.createElement(SearchBox, { index: INDEX }));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "bronze" } });
    expect(await findByText(document.body, "Berkeley CALICO", {}, { timeout: 2000 })).toBeInTheDocument();
  });
});
