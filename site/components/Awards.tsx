import Image from "next/image";
import ClaimLink from "@/components/ClaimLink";
import Section from "@/components/Section";
import type { Award } from "@/lib/content";
import { isImagePath } from "@/lib/format";

function AwardRow({ award }: { award: Award }) {
  const file = award.proof_file;
  return (
    <li className="award">
      <span className="award-year">{award.date.slice(0, 4)}</span>
      <span className="award-text">
        {award.text}
        <ClaimLink label="proof" url={award.proof_url} />
        {file && !isImagePath(file.url) && <ClaimLink label="proof file" url={file.url} />}
      </span>
      {file && isImagePath(file.url) ? (
        <a className="thumb" href={file.url} target="_blank" rel="noopener noreferrer">
          <Image src={file.url} alt={`Proof for: ${award.text}`} width={120} height={80} sizes="120px" />
        </a>
      ) : (
        <span aria-hidden="true" />
      )}
    </li>
  );
}

/** Awards: rows with year, text and proof; then "Other international competitions" (spec §4.1, §6). */
export default function Awards({ main, other }: { main: Award[]; other: Award[] }) {
  if (main.length === 0 && other.length === 0) return null;
  return (
    <Section id="awards" title="Awards & competitions">
      {main.length > 0 && (
        <ul className="award-list" data-awards="main">
          {main.map((a) => (
            <AwardRow key={a.slug} award={a} />
          ))}
        </ul>
      )}
      {other.length > 0 && (
        <>
          <h3 className="subheading">Other international competitions</h3>
          <ul className="award-list small" data-awards="other">
            {other.map((a) => (
              <AwardRow key={a.slug} award={a} />
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
