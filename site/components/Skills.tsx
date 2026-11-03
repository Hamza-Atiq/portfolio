import Section from "@/components/Section";
import type { SkillGroup } from "@/lib/content";

export default function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <Section id="skills" title="Skills">
      <div className="skill-grid">
        {groups.map((g) => (
          <div key={g.name} className="skill-group">
            <h3>{g.name}</h3>
            <ul className="tags">
              {g.items.map((s) => (
                <li key={s} className="skill">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
