import type { SearchEntry } from "@/lib/content";

export const MAX_QUERY = 100;
export const DB_TIMEOUT_MS = 2000;

/** Lower case, accents removed: "Café" → "cafe". */
export function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function cleanQuery(q: string | null | undefined): string {
  return (q ?? "").trim().slice(0, MAX_QUERY).trim();
}

/** Every word of `q` must appear in the title or text (case and accents ignored). */
export function localSearch(index: SearchEntry[], q: string, limit = 10): SearchEntry[] {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return index
    .filter((e) => {
      const hay = fold(`${e.title} ${e.text}`);
      return words.every((w) => hay.includes(w));
    })
    .slice(0, limit);
}

/** Resolves with the promise's value, or rejects after `ms` (FR-17: the database gets 2 seconds). */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
