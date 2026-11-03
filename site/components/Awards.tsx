import Image from "next/image";
import ClaimLink from "@/components/ClaimLink";
import SectionTitle from "@/components/SectionTitle";
import type { Award } from "@/lib/content";
import { isImagePath } from "@/lib/format";

function AwardLine({ award }: { award: Award }) {
  const file = award.proof_file;
  return (
    <li>
      {award.text}
      <ClaimLink label="proof" url={award.proof_url} />
      {file && isImagePath(file.url) && (
        <div className="thumbs">
          <a className="thumb" href={file.url} target="_blank" rel="noopener noreferrer">
            <Image src={file.url} alt={`Proof for: ${award.text}`} width={96} height={64} />
          </a>
        </div>
      )}
      {file && !isImagePath(file.url) && <ClaimLink label="proof file" url={file.url} />}
    </li>
  );
}

export default function Awards({ main, other }: { main: Award[]; other: Award[] }) {
  if (main.length === 0 && other.length === 0) return null;
  return (
    <section id="awards" aria-labelledby="awards-title">
      <SectionTitle id="awards">awards &amp; competitions</SectionTitle>
      {main.length > 0 && (
        <ul className="plain-list" data-awards="main">
          {main.map((a) => (
            <AwardLine key={a.slug} award={a} />
          ))}
        </ul>
      )}
      {other.length > 0 && (
        <>
          <h3 className="subheading">Other international competitions</h3>
          <ul className="plain-list small" data-awards="other">
            {other.map((a) => (
              <AwardLine key={a.slug} award={a} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
