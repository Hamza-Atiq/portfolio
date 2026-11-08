import Image from "next/image";
import Section from "@/components/Section";
import type { TeachingItem } from "@/lib/content";
import { formatDate, youtubeId } from "@/lib/format";

const SHOWN = 3;

type Video = TeachingItem["videos"][number];

function VideoThumb({ video }: { video: Video }) {
  const id = youtubeId(video.url);
  return (
    <li>
      <a className="video" href={video.url} target="_blank" rel="noopener noreferrer">
        {id ? (
          <span className="video-thumb">
            <Image src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`Video: ${video.title}`} fill
              sizes="(max-width: 700px) 50vw, 220px" />
          </span>
        ) : null}
        <span className="video-title">{video.title}</span>
      </a>
    </li>
  );
}

/** Teaching: a timeline with role and dates; at most 3 video thumbnails, "show all" for the rest (spec §6). */
export default function Teaching({ items }: { items: TeachingItem[] }) {
  if (items.length === 0) return null;
  return (
    <Section id="teaching" title="Teaching & mentoring">
      <ol className="timeline">
        {items.map((t) => {
          const first = t.videos.slice(0, SHOWN);
          const rest = t.videos.slice(SHOWN);
          return (
            <li key={t.slug} className="timeline-item">
              <div className="timeline-when">{formatDate(t.date)}</div>
              <div className="timeline-body">
                <p className="timeline-role">
                  {t.role} · {t.org}
                </p>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                {first.length > 0 && (
                  <ul className="videos">
                    {first.map((v) => (
                      <VideoThumb key={v.url} video={v} />
                    ))}
                  </ul>
                )}
                {rest.length > 0 && (
                  <details className="more">
                    <summary>
                      <span className="when-closed">Show all {t.videos.length} videos ▾</span>
                      <span className="when-open">Show less ▴</span>
                    </summary>
                    <ul className="videos">
                      {rest.map((v) => (
                        <VideoThumb key={v.url} video={v} />
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
