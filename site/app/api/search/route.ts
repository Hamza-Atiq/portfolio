import { neon } from "@neondatabase/serverless";
import { type SearchEntry, getBundle } from "@/lib/content";
import { DB_TIMEOUT_MS, cleanQuery, localSearch, withTimeout } from "@/lib/search";

export const dynamic = "force-dynamic";

const SQL = `select kind, slug, title, body, url from items
where search @@ websearch_to_tsquery('english', $1)
order by ts_rank(search, websearch_to_tsquery('english', $1)) desc
limit 10`;

type Row = { kind: SearchEntry["kind"]; slug: string; title: string; body: string; url: string };

async function fromDb(url: string, q: string): Promise<SearchEntry[]> {
  const sql = neon(url);
  const rows = (await sql.query(SQL, [q])) as Row[];
  return rows.map((r) => ({ kind: r.kind, slug: r.slug, title: r.title, text: r.body, url: r.url }));
}

/** GET /api/search?q= → {source, results}. Neon first; the built-in copy if it is slow, down or not set. */
export async function GET(request: Request): Promise<Response> {
  const q = cleanQuery(new URL(request.url).searchParams.get("q"));
  if (!q) return Response.json({ source: "local", results: [] });
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const results = await withTimeout(fromDb(dbUrl, q), DB_TIMEOUT_MS);
      return Response.json({ source: "db", results });
    } catch {
      /* slow or down: fall through to the built-in copy */
    }
  }
  return Response.json({ source: "local", results: localSearch(getBundle().search_index, q) });
}
