import About from "@/components/About";
import Awards from "@/components/Awards";
import Contact from "@/components/Contact";
import Interests from "@/components/Interests";
import News from "@/components/News";
import ProjectList from "@/components/ProjectList";
import SectionTitle from "@/components/SectionTitle";
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
        <section id="research" aria-labelledby="research-title">
          <SectionTitle id="research">research projects</SectionTitle>
          <ProjectList projects={research} />
        </section>
      )}
      <section id="hackathons" aria-labelledby="hackathons-title">
        <SectionTitle id="hackathons">hackathon projects</SectionTitle>
        {hackathons.length > 0 ? (
          <ProjectList projects={hackathons} />
        ) : (
          <p className="muted">Hackathon projects are added one by one after review.</p>
        )}
      </section>
      <Teaching items={bundle.teaching} />
      <Awards main={bundle.awards.main} other={bundle.awards.other} />
      <Skills groups={bundle.skills} />
      <Contact profile={bundle.profile} />
    </>
  );
}
