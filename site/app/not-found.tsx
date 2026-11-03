import Link from "next/link";
import Footer from "@/components/Footer";
import TopBar from "@/components/TopBar";
import { getBundle } from "@/lib/content";

export default function NotFound() {
  const bundle = getBundle();
  return (
    <>
      <TopBar bundle={bundle} home={false} />
      <main id="main">
        <section id="not-found" className="band page-top" aria-labelledby="not-found-title">
          <div className="container narrow">
            <h1 className="section-title" id="not-found-title">
              Page not found
            </h1>
            <p className="muted">This address does not exist.</p>
            <p>
              <Link className="button" href="/">
                Back to the main page
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer profile={bundle.profile} />
    </>
  );
}
