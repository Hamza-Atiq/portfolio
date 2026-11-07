import Section from "@/components/Section";
import type { Profile } from "@/lib/content";

const NAMES = {
  github: "GitHub",
  linkedin: "LinkedIn",
  leetcode: "LeetCode",
  lablab: "Lablab.ai",
  devpost: "Devpost",
} as const;

export default function Contact({ profile }: { profile: Profile }) {
  return (
    <Section id="contact" title="CV & contact">
      <div className="contact-grid">
        <div>
          <p className="kicker">Email</p>
          <p className="contact-email">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          {profile.cv_file && (
            <div className="buttons">
              <a className="button primary" href={profile.cv_file} download>
                Download CV
              </a>
            </div>
          )}
        </div>
        <div>
          <p className="kicker">Elsewhere</p>
          <div className="buttons">
            {(Object.keys(NAMES) as (keyof typeof NAMES)[])
              .filter((k) => profile.links[k])
              .map((k) => (
                <a key={k} className="button" href={profile.links[k]} target="_blank" rel="noopener noreferrer">
                  {NAMES[k]}
                </a>
              ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
