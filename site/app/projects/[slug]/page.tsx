import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ProjectPage from "@/components/ProjectPage";
import TopBar from "@/components/TopBar";
import { getBundle, getProject } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return getBundle().projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const photo = getBundle().profile.photo_dark;
  const image = project.cover ?? photo;
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      images: [{ url: image.src, alt: image.alt }],
    },
    twitter: { card: "summary_large_image", title: project.title, description: project.summary },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const bundle = getBundle();
  return (
    <>
      <TopBar bundle={bundle} home={false} />
      <main id="main">
        <ProjectPage project={project} />
      </main>
      <Footer profile={bundle.profile} />
    </>
  );
}
