import Image from "next/image";
import Markdown from "react-markdown";
import ClaimLink from "@/components/ClaimLink";
import type { Project } from "@/lib/content";
import { formatDate } from "@/lib/format";

/** One project's own page (spec §4). Markdown is rendered without raw HTML. */
export default function ProjectPage({ project }: { project: Project }) {
  const links = Object.entries(project.links) as [string, string][];
  return (
    <article>
      <header className="project-head">
        <h1>{project.title}</h1>
        <p className="muted">{project.subtitle}</p>
        <div className="facts">
          <span>{formatDate(project.date)}</span>
          <span>{project.team}</span>
          {project.my_role && <span>My role: {project.my_role}</span>}
        </div>
        <div>
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      </header>
      {project.cover && (
        <figure className="figure">
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            width={1280}
            height={720}
            sizes="(max-width: 46rem) 100vw, 46rem"
            priority
            style={{ width: "100%", height: "auto", aspectRatio: "16 / 9", objectFit: "cover" }}
          />
        </figure>
      )}
      <p>{project.summary}</p>
      <p className="result">
        <strong>Result:</strong> {project.result}
      </p>
      {(links.length > 0 || project.proofs.length > 0) && (
        <p>
          {links.map(([label, url]) => (
            <ClaimLink key={label} label={label} url={url} />
          ))}
          {project.proofs.map((p) => (
            <ClaimLink key={p.url} label={p.label} url={p.url} />
          ))}
        </p>
      )}
      <div className="prose">
        <Markdown skipHtml={false}>{project.body}</Markdown>
      </div>
      {project.images.map((img) => (
        <figure key={img.src} className="figure">
          <Image
            src={img.src}
            alt={img.alt}
            width={1280}
            height={720}
            sizes="(max-width: 46rem) 100vw, 46rem"
            style={{ width: "100%", height: "auto" }}
          />
          <figcaption>{img.alt}</figcaption>
        </figure>
      ))}
    </article>
  );
}
