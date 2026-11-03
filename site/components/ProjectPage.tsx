import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";
import ClaimLink from "@/components/ClaimLink";
import type { Project } from "@/lib/content";
import { formatDate } from "@/lib/format";

const LINK_NAMES: Record<string, string> = {
  code: "Code",
  demo: "Live demo",
  video: "Video",
  proof: "Proof",
  paper: "Paper",
};

/**
 * One project's own page (spec §4), wide like the main page: header with the cover on the right, then the
 * text next to a column of project facts. Markdown is rendered without raw HTML.
 */
export default function ProjectPage({ project }: { project: Project }) {
  const links = Object.entries(project.links) as [string, string][];
  const back = `/#${project.kind === "research" ? "research" : "hackathons"}`;
  return (
    <article>
      <header className="band page-top project-hero">
        <div className="container">
          <p className="crumbs">
            <Link href={back}>← All projects</Link>
          </p>
          <div className={project.cover ? "project-hero-grid" : "project-hero-grid no-cover"}>
            <div>
              <p className="project-meta">
                {formatDate(project.date)} · {project.team} · {project.kind === "research" ? "Research" : "Hackathon"}
              </p>
              <h1 className="project-page-title">{project.title}</h1>
              <p className="project-page-subtitle">{project.subtitle}</p>
              <p className="lead">{project.summary}</p>
              <div className="result">
                <span className="kicker">Result</span>
                <p>{project.result}</p>
              </div>
              {(links.length > 0 || project.proofs.length > 0) && (
                <div className="buttons">
                  {links.map(([label, url], i) => (
                    <a key={label} className={i === 0 ? "button primary" : "button"} href={url} target="_blank"
                      rel="noopener noreferrer">
                      {LINK_NAMES[label] ?? label} ↗
                    </a>
                  ))}
                  {project.proofs.map((p) => (
                    <a key={p.url} className="button" href={p.url} target="_blank" rel="noopener noreferrer">
                      Proof ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
            {project.cover && (
              <figure className="project-hero-cover">
                {/* The LCP element: Next 16 `priority` does not set fetchpriority, so ask for it directly. */}
                <Image src={project.cover.src} alt={project.cover.alt} width={1280} height={720}
                  sizes="(max-width: 960px) 100vw, 540px" loading="eager" fetchPriority="high" />
              </figure>
            )}
          </div>
        </div>
      </header>
      <div className="band">
        <div className="container project-layout">
          <div className="prose">
            <Markdown>{project.body}</Markdown>
            {project.images.map((img) => (
              <figure key={img.src} className="figure">
                <Image src={img.src} alt={img.alt} width={1280} height={720} sizes="(max-width: 960px) 100vw, 700px"
                  style={{ width: "100%", height: "auto" }} />
                <figcaption>{img.alt}</figcaption>
              </figure>
            ))}
          </div>
          <aside className="project-aside" aria-label="Project facts">
            <dl>
              <dt>Date</dt>
              <dd>{formatDate(project.date)}</dd>
              <dt>Team</dt>
              <dd>{project.team}</dd>
              {project.my_role && (
                <>
                  <dt>My role</dt>
                  <dd>{project.my_role}</dd>
                </>
              )}
              <dt>Tags</dt>
              <dd className="tags">
                {project.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </dd>
              {(links.length > 0 || project.proofs.length > 0) && (
                <>
                  <dt>Links</dt>
                  <dd>
                    {links.map(([label, url]) => (
                      <ClaimLink key={label} label={label} url={url} />
                    ))}
                    {project.proofs.map((p) => (
                      <ClaimLink key={p.url} label={p.label} url={p.url} />
                    ))}
                  </dd>
                </>
              )}
            </dl>
          </aside>
        </div>
      </div>
    </article>
  );
}
