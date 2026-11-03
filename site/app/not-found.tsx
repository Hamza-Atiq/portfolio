import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";

export default function NotFound() {
  return (
    <section id="not-found" aria-labelledby="not-found-title">
      <SectionTitle id="not-found">page not found</SectionTitle>
      <p className="muted">This address does not exist.</p>
      <p>
        <Link className="button" href="/">
          Back to the main page
        </Link>
      </p>
    </section>
  );
}
