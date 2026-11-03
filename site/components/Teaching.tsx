import Image from "next/image";
import SectionTitle from "@/components/SectionTitle";
import type { TeachingItem } from "@/lib/content";
import { formatDate, youtubeId } from "@/lib/format";

export default function Teaching({ items }: { items: TeachingItem[] }) {
  if (items.length === 0) return null;
  return (
    <section id="teaching" aria-labelledby="teaching-title">
      <SectionTitle id="teaching">teaching &amp; mentoring</SectionTitle>
      <ul className="plain-list">
        {items.map((t) => (
          <li key={t.slug}>
            <strong>{t.title}</strong>
            <div className="small muted">
              {t.role} · {t.org} · {formatDate(t.date)}
            </div>
            <p>{t.text}</p>
            {t.videos.length > 0 && (
              <div className="thumbs">
                {t.videos.map((v) => {
                  const id = youtubeId(v.url);
                  return (
                    <a key={v.url} className="thumb" href={v.url} target="_blank" rel="noopener noreferrer">
                      {id ? (
                        <Image
                          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                          alt={`Video: ${v.title}`}
                          width={160}
                          height={90}
                        />
                      ) : (
                        <span className="claim-link">video ↗ {v.title}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
