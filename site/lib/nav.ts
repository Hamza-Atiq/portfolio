import type { Bundle } from "@/lib/content";

export interface NavItem {
  id: string;
  label: string;
}

/** The menu links, in the order of spec §4, only for sections the main page shows. */
export function navItems(bundle: Bundle): NavItem[] {
  const research = bundle.projects.some((p) => p.kind === "research");
  const items: (NavItem | false)[] = [
    { id: "about", label: "About" },
    bundle.news.length > 0 && { id: "news", label: "News" },
    bundle.interests.length > 0 && { id: "interests", label: "Interests" },
    { id: research ? "research" : "hackathons", label: "Projects" },
    bundle.teaching.length > 0 && { id: "teaching", label: "Teaching" },
    bundle.awards.main.length + bundle.awards.other.length > 0 && { id: "awards", label: "Awards" },
    bundle.skills.length > 0 && { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
  ];
  return items.filter((x): x is NavItem => Boolean(x));
}
