import Footer from "@/components/Footer";
import Home from "@/components/Home";
import TopBar from "@/components/TopBar";
import { getBundle } from "@/lib/content";

export default function Page() {
  const bundle = getBundle();
  return (
    <>
      <TopBar bundle={bundle} home />
      <main id="main">
        <Home bundle={bundle} />
      </main>
      <Footer profile={bundle.profile} />
    </>
  );
}
