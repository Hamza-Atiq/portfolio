import Photo from "@/components/Photo";
import { getBundle } from "@/lib/content";

export default function Home() {
  const { profile } = getBundle();
  return (
    <section id="about">
      <Photo profile={profile} />
      <h1>{profile.name}</h1>
    </section>
  );
}
