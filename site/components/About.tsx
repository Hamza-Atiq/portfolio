import ClaimLink from "@/components/ClaimLink";
import Photo from "@/components/Photo";
import type { Fact, Interest, Profile } from "@/lib/content";

function FactItem({ fact }: { fact: Fact }) {
  const body = (
    <>
      <span className="fact-label">{fact.label}</span>
      <span className="fact-title">{fact.title}</span>
      {fact.detail && <span className="fact-detail">{fact.detail}</span>}
      {fact.link && (
        <span className="fact-more" aria-hidden="true">
          {fact.link.startsWith("#") ? "See below ↓" : "Proof ↗"}
        </span>
      )}
    </>
  );
  if (!fact.link) return <li className="fact">{body}</li>;
  const external = !fact.link.startsWith("#");
  return (
    <li className="fact">
      <a className="fact-link" href={fact.link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {body}
      </a>
    </li>
  );
}

/** First screen (spec §6): text and buttons on the left, round photo on the right, facts row below. */
export default function About({ profile, interests }: { profile: Profile; interests: Interest[] }) {
  const { links } = profile;
  const facts = profile.facts ?? [];
  return (
    <section id="about" className="hero" aria-label="About">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-text">
            <p className="tagline">{profile.tagline}</p>
            <h1 className="hero-name">{profile.name}</h1>
            <p className="hero-summary">{profile.summary}</p>
            {interests.length > 0 && (
              <div className="interested">
                <span className="kicker">Interested in</span>
                <ul className="chips">
                  {interests.map((i) => (
                    <li key={i.slug}>
                      <a className="chip" href="#interests">
                        {i.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
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
          <div className="hero-photo">
            <Photo profile={profile} />
          </div>
        </div>
        {facts.length > 0 && (
          <ul className="facts" aria-label="Key facts">
            {facts.map((f) => (
              <FactItem key={f.label} fact={f} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
