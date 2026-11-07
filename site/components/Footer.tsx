import { type Profile, siteName } from "@/lib/content";

export default function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span className="brand-small">{siteName(profile)}</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
