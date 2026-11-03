import SectionTitle from "@/components/SectionTitle";
import type { Interest } from "@/lib/content";

export default function Interests({ items }: { items: Interest[] }) {
  if (items.length === 0) return null;
  return (
    <section id="interests" aria-labelledby="interests-title">
      <SectionTitle id="interests">research interests</SectionTitle>
      <ul className="plain-list">
        {items.map((i) => (
          <li key={i.slug} id={`interest-${i.slug}`}>
            <strong>{i.label}</strong>
            <span className="muted">: {i.sentence}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
