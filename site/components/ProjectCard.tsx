import Image from "next/image";
import Link from "next/link";
import ClaimLink from "@/components/ClaimLink";
import type { Project } from "@/lib/content";
import { formatDate } from "@/lib/format";

export default function ProjectCard({ project }: { project: Project }) {
  const href = `/projects/${project.slug}`;
  return (
    <article className="card">
      {project.cover && (
        <div className="card-cover">
          <Image src={project.cover.src} alt={project.cover.alt} fill sizes="(max-width: 46rem) 100vw, 22rem" />
        </div>
      )}
      <div className="card-body">
        <h3>
          <Link className="card-title-link" href={href}>
            {project.title}
          </Link>
        </h3>
        <p className="small muted">
          {formatDate(project.date)} · {project.team}
        </p>
        <div>
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        <p className="clamp-3">{project.summary}</p>
        <p className="result">{project.result}</p>
        <p className="small">
          <Link className="read-more" href={href}>
            read more
          </Link>
          <span className="links">
            {(Object.entries(project.links) as [string, string][]).map(([label, url]) => (
              <ClaimLink key={label} label={label} url={url} />
            ))}
          </span>
        </p>
      </div>
    </article>
  );
}
