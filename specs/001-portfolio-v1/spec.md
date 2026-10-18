# Spec 001: Portfolio website, version 1

- **Status:** draft, waiting for Hamza's review
- **Date:** 2026-10-18
- **Owner:** Hamza Atiq (decides) · Claude (builds)
- **Rules:** follows `specs/constitution.md`
- **Method:** spec-driven development, as taught in the Agent Factory book
  (`spec-driven-development-crash-course`): research → specify → clarify → plan → build → verify.

---

## 1. Goal

A personal website that shows professors who Hamza is, what he is interested in, and honest proof of
his work, so that he can get a funded MS/PhD (TA/RA) in the USA for Fall 2027.

The site is a **system**, not a one-time page: new work is added by adding one small file and pushing.
The first version goes live quickly and is improved step by step. "Don't wait for perfect."

**Success:** a professor opens the link on a phone and within about 1 minute understands who Hamza is,
sees his research direction, and can click a proof for every claim.

## 2. Who uses it

| Person | What they want |
|---|---|
| Professor / admissions reader | Quick picture of Hamza, research interests, real work, proofs, CV |
| Hamza | Add/change content easily, share the link, trust that nothing false or broken goes live |
| Claude (future sessions) | A clear spec + data format to keep building and adding projects |

## 3. User scenarios

1. **Professor on a phone** opens `hamza-atiq.vercel.app` from an email. Sees photo, name, one-line
   summary, interests, buttons (CV, GitHub, LinkedIn, Email). Scrolls: news, research projects, teaching,
   awards with proof links. Taps a project → its own page with details.
2. **Hamza adds a news line:** adds 3 lines to `content/news.yml`, pushes. About 2 minutes later it is live.
3. **Hamza adds a finished project:** adds `content/projects/<name>.md` (or a `portfolio.yml` in the
   project's own public repo). The checker passes. The project appears with its own page.
4. **A mistake is pushed** (empty field, dead link, unlisted proof). The checker stops, shows a clear
   message naming the file and the problem, and the live site stays as it was.
5. **Draft:** Hamza marks something `status: draft`. It does not appear on the public site; it appears
   on a private preview link so he can look first.
6. **Undo:** Hamza wants an old version back. Every change is a git commit; Vercel can roll back with one click.

## 4. What is on the site (version 1)

One main page with these sections, **in this order**, plus one page per project:

| # | Section | Content in v1 | Source file |
|---|---|---|---|
| 1 | **About** (top) | Round photo, name, `// electrical engineer → AI`, short honest summary, "Interested in" chips, buttons: Download CV, GitHub, LinkedIn, Email | `content/profile.yml` |
| 2 | **News** | Dated one-line items, each with a proof or code link | `content/news.yml` |
| 3 | **Research interests** | Short list of interest areas | `content/interests.yml` |
| 4 | **Research projects** | P-013 (N-1 grid contingency screening with GNNs). More added when finished | `content/projects/*.md` (`kind: research`) |
| 5 | **Hackathon projects** | Empty in v1 with a short line ("added one by one after review"); filled later one project at a time | `content/projects/*.md` (`kind: hackathon`) |
| 6 | **Teaching & mentoring** | iCodeGuru DSA + IELTS lectures, Claude Code workshop, MIT Informatics Tournament prep, with video links | `content/teaching.yml` |
| 7 | **Awards & competitions** | Proven items only (see §4.1), each with a proof link | `content/awards.yml` |
| 8 | **Skills** | Grouped skills | `content/skills.yml` |
| 9 | **CV & Contact** | Download CV (PDF), email, links | `content/profile.yml` + `public/cv.pdf` |

A section with no published items is hidden automatically, except "Hackathon projects", which shows
its short "coming" line in v1.

**Project page** (one per project): title, tags, date, team/solo + my role, short summary, the problem,
the method, results (with how they were measured), limits, image gallery, links (code, demo, video, proof).

### 4.1 Awards allowed in v1 (proven in `_portfolio_journey/cv_review_2026-10-17.md`)
UCLA CodeSprint LA 2026 (team, 15/244) · Yale × BlueQubit 2026 (53/549) · Berkeley CALICO Spring 2026
(team of 3; Pakistan #32/78 Bronze Brick Award; global #269/375) · CS50x Puzzle Day 2025 (team solved 9/9) ·
AMD Developer Hackathon (Finalist, team of 3; my part: training data and testing on AMD GPUs) ·
GIKI solar + load prediction (10th place) · Meta Hacker Cup 2025 R1 (7,798th) · M(IT)² (482/559) ·
HackerRank (427/1,349) · Duolingo English Test 115.
Exact wording and proof link for each are written in `awards.yml` and approved by Hamza before publishing.
**Not allowed:** "Winner", "1st place HF prize", CS50 2026 "10/10", NeuroOceans "40%" (no proof).

## 5. Functional requirements

**Content system**
- **FR-1** All content lives in plain text files in `content/` (YAML for lists, Markdown with a YAML
  header for projects). The page code contains no personal content.
- **FR-2** A project can also come from a `portfolio.yml` file in one of Hamza's **public** GitHub repos.
  The repo list to scan is written in `content/sources.yml`. Same format as a project file.
- **FR-3** Every item has `status: draft | published`. Only `published` items appear on the public site.
- **FR-3a** Pushing to the `preview` branch makes a private Vercel preview link that also shows `draft` items,
  so Hamza can look before publishing. The `main` branch is the public site.
- **FR-4** Every published item has `reviewed_by_hamza: YYYY-MM-DD`.
- **FR-5** Default order is newest first; an optional `pin: <number>` puts an item on top (1 = first).

**Checker ("the robot", Python, runs in GitHub Actions)**
- **FR-6** Runs on every push, once a day by itself, and on a "Run now" button.
- **FR-7** Checks: correct fields and types; dates valid; required text not empty; team projects say
  `team of N` and fill `my_role`; every link opens (HTTP status below 400, with retries); every proof file is
  listed in `content/proofs.yml` with `private_info_checked: true`; every image has alt text and is below
  the size limit; no secret keys in the repo.
- **FR-8** On any error: stop, print the file name + problem in simple words, do not deploy.
  The live site stays unchanged.
- **FR-9** On success: write the checked data to the Neon Postgres database (insert or update, and
  remove items deleted from the files), then deploy the site to Vercel.
- **FR-10** A link that is temporarily down on the **daily** run gives a warning (not a stop), so a
  short outage of someone else's site does not block Hamza. On a **push**, a dead link is an error.

**Website (Next.js on Vercel)**
- **FR-11** Pages are built from the checked files at deploy time (fast, no database needed to show a page).
- **FR-12** Project filter chips by tag (for example Power systems, Robotics, AI agents). Filtering
  works in the browser with no database.
- **FR-13** A small search box for projects and awards. Uses the database through a server function;
  if the database does not answer within 2 seconds, it falls back to searching the built-in data.
- **FR-14** Dark mode is the default; a ☀/☾ switch changes to light mode; the choice is remembered on that device.
  If the visitor's device asks for light mode, start in light mode.
- **FR-15** Photo: round crop only. Dark mode shows `hamza_graphite_amber_glow.png`; light mode shows
  `hamza_warm_cream.png` (both made from `capture 1.PNG`; the full-size versions are not used because of
  an edge mark on the right arm).
- **FR-16** Each page has a share preview (title, short text, image) for LinkedIn/WhatsApp/email.
- **FR-17** Cards react on hover/tap (slight lift + amber glow). All motion is turned off when the visitor's
  device has "reduce motion" on.
- **FR-18** Works on phones (from 360 px wide) and laptops. No sideways scrolling.
- **FR-19** Images are resized and converted to modern formats automatically; images below the first
  screen load only when scrolled to.

## 6. Look and feel (agreed in the visual sessions, 2026-10-18)

- **Palette "Graphite & Electric Amber"**
  - Dark: background `#141417`, text `#ECECEF`, muted text `#9A9AA6`, lines `#3A3A42`, accent amber `#F5B83D`,
    small second accent teal `#2DD4BF` (tags only).
  - Light: background `#FAF8F4`, text `#1D1D22`, muted `#6B6B75`, lines `#D9D4C9`, accent deep amber `#B7791F`
    (bright amber is too hard to read on cream), teal `#0F766E`.
- Section labels in code style (`## news`, `## research projects`); site name `~/hamza-atiq`.
- One calm column, readable text size, proof links (`proof ↗`) next to claims.
- **No** decorative art, **no** big headline number tiles, **no** count-up animations. Results appear
  small and plain **inside** project cards and pages, with how they were measured.
- **Real images only** (constitution rule 7): photo, project cover image (screenshot, diagram or result
  chart) in one consistent shape, project galleries, YouTube thumbnails for lectures, small certificate
  thumbnails that open full size.
- Text contrast meets WCAG AA in both modes.

## 7. Data format (summary; full details go in `plan.md`)

```yaml
# content/projects/p013-grid-gnn.md (header part)
title: N-1 Grid Contingency Screening with GNNs
slug: p013-grid-gnn
kind: research            # research | hackathon
status: published         # draft | published
reviewed_by_hamza: 2026-10-18
date: 2026-10
tags: [power-systems, graph-neural-networks]
team: solo                # solo | "team of N"
my_role: "..."
summary: "one or two sentences"
result: "≥99.91% of risky outages caught on IEEE 57-bus (how measured: see page)"
cover: { src: images/p013/cover.png, alt: "..." }
links: { code: "...", demo: "...", video: "..." }
proofs: []
pin: 1                    # optional
```
Then normal Markdown text for the project page: problem, method, results, limits.

Other files: `profile.yml`, `news.yml`, `interests.yml`, `teaching.yml`, `awards.yml`, `skills.yml`,
`proofs.yml`, `sources.yml`. Each has a fixed form that the checker enforces.

## 8. Where things live

- Code + content: `D:\AI Journey\portfolio` (git) → GitHub `Hamza-Atiq/portfolio` (public) → Vercel.
- Address: `hamza-atiq.vercel.app` (free). A custom domain can be added later without other changes.
- Database: Neon Postgres, free tier, connected to Vercel.
- Specs: `specs/` in the same repo.
- The research projects in `D:\USA Journey\Projects` are only **read** from this work, never changed.

## 9. Edge cases and rules

- Database asleep or down → pages unaffected; search falls back (FR-13); the checker retries the database
  write 3 times and, if still failing, **still deploys** the pages and reports a warning (the database is a copy).
- A source repo is private, deleted or renamed → that project is skipped with a warning; the rest deploys.
- Two items with the same `slug` → error.
- A published project with no image → allowed, shows a simple text card (no fake image).
- Very long text → cards cut after 3 lines with "read more".
- Proof files that contain private data (for example the Duolingo PDF with date of birth) → not uploaded;
  link to the official verification page instead.

## 10. Out of scope for version 1

- "Ask about Hamza" AI chat (version 2; will use Postgres + pgvector, answers only from site data).
- Publications section (added when there is a publication).
- Custom domain.
- Login page or admin panel (never; editing is only through git).
- Hackathon project cards (added one by one after each project is reviewed and finished).
- Visitor statistics shown on the site.

## 11. Acceptance criteria (version 1 is done when all are true)

- [ ] `hamza-atiq.vercel.app` opens on a phone (360 px) and a laptop with no sideways scrolling.
- [ ] Sections 1–9 from §4 show in the agreed order, filled from `content/` files; P-013 has its own page.
- [ ] Every award and news item shown has a working proof or code link.
- [ ] Adding a test news line in `news.yml` and pushing makes it appear live in about 2 minutes, with no code change.
- [ ] Pushing a broken file (empty `my_role`, dead link, unlisted proof) is refused with a clear message, and the live site does not change.
- [ ] An item with `status: draft` does not appear on the public site.
- [ ] Dark/light switch works; the photo changes with the mode; the choice is remembered.
- [ ] With the database switched off, every page still loads and search still returns results.
- [ ] Lighthouse (mobile): Performance ≥ 90, Accessibility ≥ 90; contrast passes in both modes.
- [ ] No secret keys or private data in the repo (scan passes).
- [ ] Hamza has read every visible sentence and approved it.

## 12. Decisions log (from the clarify talk, 2026-10-18)

| Question | Decision |
|---|---|
| "Dynamic" means? | Mix: files in git (master) + auto-pull from project repos + Postgres for live features. No login page |
| Hosting | Vercel, free address `hamza-atiq.vercel.app` (GitHub Pages cannot safely use a database) |
| Section order | About, News, Interests, **Research projects, then Hackathon projects**, Teaching, Awards, Skills, CV/Contact |
| Which projects | Build the empty site first; add projects one by one, only after each is checked and finished. Weak projects get improved (about 1 week each) before they are added |
| Tools | Next.js (website) + Python (checker) + Neon Postgres. Hamza edits only content files; Claude builds |
| Look | Graphite & Electric Amber; mix of B (attractive) and A (calm, readable); no art, no headline numbers |
| Interactions | Filter chips, cards that react; chat in v2 |
| Images | Real images only; round photo, dark = graphite glow, light = warm cream |

## 13. Research notes behind the choices

- Eye-tracking: visitors ignore decorative and stock images and study real, informative ones
  (Nielsen Norman Group, "Not All Images Are the Same").
- Colour: 3–4 colours, one accent for actions, strong contrast; blue is most often linked to trust in small
  studies, but brightness/liveliness matters more than warm vs cool. Evidence is limited; treated as guidance.
- Speed: Google's "good" load target (Largest Contentful Paint) is 2.5 s or less; images are the usual cause
  of slow pages → resize, modern formats, lazy-load below the first screen.
- Postgres as the "system of record" and RAG base: Agent Factory `postgres-ai-crash-course` and thesis.
