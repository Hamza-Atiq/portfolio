import About from "@/components/About";
import Awards from "@/components/Awards";
import Contact from "@/components/Contact";
import Interests from "@/components/Interests";
import News from "@/components/News";
import ProjectList from "@/components/ProjectList";
import Section from "@/components/Section";
import Skills from "@/components/Skills";
import Teaching from "@/components/Teaching";
import type { Bundle } from "@/lib/content";

/** The main page, in the order of spec §4. */
export default function Home({ bundle }: { bundle: Bundle }) {
  const research = bundle.projects.filter((p) => p.kind === "research");
  const hackathons = bundle.projects.filter((p) => p.kind === "hackathon");
  return (
    <>
      <About profile={bundle.profile} interests={bundle.interests} />
      <News items={bundle.news} />
      <Interests items={bundle.interests} />
      {research.length > 0 && (
        <Section id="research" title="Research projects">
          <ProjectList projects={research} />
        </Section>
      )}
      <Section id="hackathons" title="Hackathon projects" compact={hackathons.length === 0}>
        {hackathons.length > 0 ? (
          <ProjectList projects={hackathons} />
        ) : (
          <p className="muted empty-note">Hackathon projects are added one by one after review.</p>
        )}
      </Section>
      <Teaching items={bundle.teaching} />
      <Awards main={bundle.awards.main} other={bundle.awards.other} />
      <Skills groups={bundle.skills} />
      <Contact profile={bundle.profile} />
    </>
  );
}
