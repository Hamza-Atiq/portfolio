/**
 * The site's only data source: `data/content.json`, written by the checker (plan Task 6).
 * Page code holds no personal content (constitution rule 3).
 */
import data from "@/data/content.json";

export type Status = "draft" | "published";
export type LinkLabel = "code" | "demo" | "video" | "proof" | "paper";

export interface Link {
  label: LinkLabel;
  url: string;
}

export interface Image {
  src: string;
  alt: string;
}

export interface Profile {
  name: string;
  tagline: string;
  summary: string;
  photo_dark: Image;
  photo_light: Image;
  email: string;
  links: Partial<Record<"github" | "linkedin" | "leetcode" | "lablab" | "devpost", string>>;
  english_test: { text: string; url: string | null };
  cv_file: string | null;
  cv_reviewed_by_hamza: string | null;
  reviewed_by_hamza: string | null;
}

export interface Interest {
  slug: string;
  label: string;
  sentence: string;
}

interface Dated {
  slug: string;
  date: string;
  status: Status;
  reviewed_by_hamza: string | null;
  pin: number | null;
}

export interface NewsItem extends Dated {
  text: string;
  link: Link;
}

export interface Project extends Dated {
  title: string;
  subtitle: string;
  summary: string;
  result: string;
  kind: "research" | "hackathon";
  tags: string[];
  team: string;
  my_role: string | null;
  cover: Image | null;
  images: Image[];
  links: Partial<Record<LinkLabel, string>>;
  proofs: Link[];
  body: string;
}

export interface TeachingItem extends Dated {
  title: string;
  org: string;
  role: string;
  text: string;
  videos: { title: string; url: string }[];
}

export interface Award extends Dated {
  text: string;
  group: "main" | "other";
  proof_url: string;
  proof_file: Link | null;
}

export interface SkillGroup {
  name: string;
  items: string[];
}

export interface SearchEntry {
  kind: "project" | "award" | "news" | "teaching";
  slug: string;
  title: string;
  text: string;
  url: string;
}

export interface Bundle {
  hash: string;
  generated_at: string;
  include_drafts: boolean;
  profile: Profile;
  interests: Interest[];
  news: NewsItem[];
  projects: Project[];
  teaching: TeachingItem[];
  awards: { main: Award[]; other: Award[] };
  skills: SkillGroup[];
  search_index: SearchEntry[];
}

const bundle = data as unknown as Bundle;

export function getBundle(): Bundle {
  return bundle;
}

export function getProject(slug: string): Project | undefined {
  return bundle.projects.find((p) => p.slug === slug);
}

/** `~/hamza-atiq` style site name, made from the profile name. */
export function siteName(profile: Profile): string {
  return (
    "~/" +
    profile.name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}
