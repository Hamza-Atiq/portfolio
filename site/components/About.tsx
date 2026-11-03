import ClaimLink from "@/components/ClaimLink";
import Photo from "@/components/Photo";
import type { Interest, Profile } from "@/lib/content";

export default function About({ profile, interests }: { profile: Profile; interests: Interest[] }) {
  const { links } = profile;
  return (
    <section id="about" className="about" aria-label="About">
      <Photo profile={profile} />
      <div className="about-text">
        <h1>{profile.name}</h1>
        <p className="tagline mono">{profile.tagline}</p>
        <p>{profile.summary}</p>
        {interests.length > 0 && (
          <ul className="chips" aria-label="Interested in">
            {interests.map((i) => (
              <li key={i.slug}>
                <a className="chip" href="#interests">
                  {i.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        {profile.english_test.url && (
          <p className="small muted">
            <span>{profile.english_test.text}</span>
            <ClaimLink label="proof" url={profile.english_test.url} />
          </p>
        )}
        <div className="buttons">
          {profile.cv_file && (
            <a className="button primary" href={profile.cv_file} download>
              Download CV
            </a>
          )}
          {links.github && (
            <a className="button" href={links.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          )}
          {links.linkedin && (
            <a className="button" href={links.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          <a className="button" href={`mailto:${profile.email}`}>
            Email
          </a>
        </div>
      </div>
    </section>
  );
}
