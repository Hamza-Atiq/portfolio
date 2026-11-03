import SectionTitle from "@/components/SectionTitle";
import type { Profile } from "@/lib/content";

const NAMES = {
  github: "GitHub",
  linkedin: "LinkedIn",
  leetcode: "LeetCode",
  lablab: "lablab",
  devpost: "Devpost",
} as const;

export default function Contact({ profile }: { profile: Profile }) {
  return (
    <section id="contact" aria-labelledby="contact-title">
      <SectionTitle id="contact">cv &amp; contact</SectionTitle>
      <p>
        Email: <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </p>
      <div className="buttons">
        {profile.cv_file && (
          <a className="button primary" href={profile.cv_file} download>
            Download CV
          </a>
        )}
        {(Object.keys(NAMES) as (keyof typeof NAMES)[])
          .filter((k) => profile.links[k])
          .map((k) => (
            <a key={k} className="button" href={profile.links[k]} target="_blank" rel="noopener noreferrer">
              {NAMES[k]}
            </a>
          ))}
      </div>
    </section>
  );
}
