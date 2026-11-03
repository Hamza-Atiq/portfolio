import ClaimLink from "@/components/ClaimLink";
import SectionTitle from "@/components/SectionTitle";
import type { NewsItem } from "@/lib/content";
import { formatDate } from "@/lib/format";

const SHOWN = 6;

function Line({ item }: { item: NewsItem }) {
  return (
    <li>
      <span className="date">{formatDate(item.date)}</span>
      {item.text}
      <ClaimLink label={item.link.label} url={item.link.url} />
    </li>
  );
}

export default function News({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;
  const first = items.slice(0, SHOWN);
  const rest = items.slice(SHOWN);
  return (
    <section id="news" aria-labelledby="news-title">
      <SectionTitle id="news">news</SectionTitle>
      <ul className="plain-list">
        {first.map((n) => (
          <Line key={n.slug} item={n} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="more">
          <summary>show all ({items.length})</summary>
          <ul className="plain-list">
            {rest.map((n) => (
              <Line key={n.slug} item={n} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
