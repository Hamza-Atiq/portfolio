import SectionTitle from "@/components/SectionTitle";
import type { SkillGroup } from "@/lib/content";

export default function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <section id="skills" aria-labelledby="skills-title">
      <SectionTitle id="skills">skills</SectionTitle>
      <dl className="skills">
        {groups.map((g) => (
          <div key={g.name}>
            <dt>{g.name}</dt>
            <dd>{g.items.join(" · ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
