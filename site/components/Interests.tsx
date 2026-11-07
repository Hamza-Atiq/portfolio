import Section from "@/components/Section";
import type { Interest } from "@/lib/content";

/** Research interests: a 3-column grid of short cards (spec §6). */
export default function Interests({ items }: { items: Interest[] }) {
  if (items.length === 0) return null;
  return (
    <Section id="interests" title="Research interests">
      <ul className="interest-grid">
        {items.map((i) => (
          <li key={i.slug} id={`interest-${i.slug}`} className="interest-card">
            <h3>{i.label}</h3>
            <p>{i.sentence}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
