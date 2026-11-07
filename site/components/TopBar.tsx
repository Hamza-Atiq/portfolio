import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import SearchDialog from "@/components/SearchDialog";
import ThemeToggle from "@/components/ThemeToggle";
import { type Bundle, siteName } from "@/lib/content";
import { navItems } from "@/lib/nav";

/** The fixed top menu (spec §6): site name, section links, search, CV and the ☀/☾ button. */
export default function TopBar({ bundle, home }: { bundle: Bundle; home: boolean }) {
  const cv = bundle.profile.cv_file;
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          {siteName(bundle.profile)}
        </Link>
        <NavLinks items={navItems(bundle)} home={home} />
        <div className="topbar-actions">
          <SearchDialog index={bundle.search_index} />
          {cv && (
            <a className="icon-button cv-link" href={cv} download>
              CV
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
