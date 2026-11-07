const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" → "Oct 2026", "2026-03-15" → "15 Mar 2026", "2025" → "2025". */
export function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  if (!m) return y;
  const month = MONTHS[Number(m) - 1] ?? m;
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
}

/** "solo" → "Solo", "proof" → "Proof": shown words start with a capital letter. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** The YouTube video id of a link, or null. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      if (!id && m) id = m[1];
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function isImagePath(url: string): boolean {
  return /\.(png|jpe?g|webp|avif|gif)$/i.test(url);
}
