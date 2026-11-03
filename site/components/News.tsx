import ClaimLink from "@/components/ClaimLink";
import Section from "@/components/Section";
import type { NewsItem } from "@/lib/content";
import { formatDate } from "@/lib/format";

const SHOWN = 6;

function Line({ item }: { item: NewsItem }) {
  return (
    <li className="news-item">
      <span className="news-date">{formatDate(item.date)}</span>
      <span className="news-text">
        {item.text}
        <ClaimLink label={item.link.label} url={item.link.url} />
      </span>
    </li>
  );
}

/** News: a two-column list, date then text and link (spec §6). Latest 6, then "show all". */
export default function News({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;
  const first = items.slice(0, SHOWN);
  const rest = items.slice(SHOWN);
  return (
    <Section id="news" title="News">
      <ul className="news-list">
        {first.map((n) => (
          <Line key={n.slug} item={n} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="more">
          <summary>Show all {items.length} news items</summary>
          <ul className="news-list">
            {rest.map((n) => (
              <Line key={n.slug} item={n} />
            ))}
          </ul>
        </details>
      )}
    </Section>
  );
}
