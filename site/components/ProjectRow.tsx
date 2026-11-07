import Image from "next/image";
import Link from "next/link";
import ClaimLink from "@/components/ClaimLink";
import type { Project } from "@/lib/content";
import { capitalize, formatDate } from "@/lib/format";

/** A wide project row: image on the left; title, result and links on the right (spec §6). */
export default function ProjectRow({ project }: { project: Project }) {
  const href = `/projects/${project.slug}`;
  const links = Object.entries(project.links) as [string, string][];
  return (
    <article className={project.cover ? "card project-row" : "card project-row no-cover"}>
      {project.cover && (
        <Link href={href} className="project-cover" tabIndex={-1} aria-hidden="true">
          <Image src={project.cover.src} alt={project.cover.alt} fill sizes="(max-width: 860px) 100vw, 460px" />
        </Link>
      )}
      <div className="project-body">
        <p className="project-meta">
          {formatDate(project.date)} · {capitalize(project.team)}
        </p>
        <h3 className="project-title">
          <Link href={href}>{project.title}</Link>
        </h3>
        <p className="project-subtitle">{project.subtitle}</p>
        <p className="clamp-3">{project.summary}</p>
        <div className="result">
          <span className="kicker">Result</span>
          <p>{project.result}</p>
        </div>
        <div className="tags">
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        <p className="project-links">
          <Link className="read-more" href={href}>
            Read the project →
          </Link>
          {links.map(([label, url]) => (
            <ClaimLink key={label} label={label} url={url} />
          ))}
          {project.proofs.map((p) => (
            <ClaimLink key={p.url} label={p.label} url={p.url} />
          ))}
        </p>
      </div>
    </article>
  );
}
