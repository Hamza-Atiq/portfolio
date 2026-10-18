# Spec 001: Portfolio website, version 1

- **Status:** draft v2, waiting for Hamza's review (v1 → v2 changes: see §15)
- **Date:** 2026-10-18
- **Owner:** Hamza Atiq decides · Claude builds
- **Rules:** follows `specs/constitution.md`
- **Method:** spec-driven development from the Agent Factory book (`spec-driven-development-crash-course`):
  research → specify → clarify → plan → build in small steps → verify against this spec.

---

## 1. Goal

A personal website that shows professors who Hamza is, what he is interested in, and honest proof of
his work, to help him get a funded MS/PhD (TA/RA) in the USA for Fall 2027.

The site is a **system**, not a one-time page: new content is added by adding one small file and pushing it.
Version 1 goes live quickly and is improved step by step.

**Success:** a professor opens the link on a phone and, within about 1 minute, knows who Hamza is and what
he wants to research, and can open a proof for every claim.

## 2. Who uses it

| Person | What they need |
|---|---|
| Professor / admissions reader | A quick picture of Hamza, his research interests, real work, proofs, CV |
| Hamza | To add or change content easily, share the link, and trust that nothing false or broken goes live |
| Claude (future sessions) | A clear spec and data format, to keep building and adding projects |

## 3. User scenarios

1. **Professor on a phone** opens the site from an email. Sees the round photo, name, short summary,
   interest chips and buttons (CV, GitHub, LinkedIn, Email). Scrolls through news, research projects, teaching
   and awards with proof links. Taps a project and gets its own page.
2. **Hamza adds a news line:** adds one item to `content/news.yml` and pushes. Within 5 minutes (usually about 2)
   it is live.
3. **Hamza adds a finished project:** adds `content/projects/<slug>.md`, or a `portfolio.yml` in the project's own
   public repo. The checker passes and the project appears with its own page.
4. **A mistake is pushed** (empty field, broken link, unlisted proof file). The checker stops, names the file and
   the problem in simple words, and the live site stays as it was.
5. **Draft preview:** Hamza pushes to the `preview` branch. He gets a private preview link that also shows items
   marked `status: draft`. The public site does not change.
6. **Undo:** Hamza wants an older version back. He reverts the commit in git and the site redeploys; or he uses
   Vercel's "Instant Rollback" to go back to the previous live version.

## 4. What is on the site (version 1)

One main page with these sections, **in this order**, plus one page per project:

| # | Section | Content in v1 | Source |
|---|---|---|---|
| 1 | **About** (top) | Round photo, name, the line `// electrical engineer → AI`, a short honest summary (2–3 sentences), "Interested in" chips, buttons: Download CV, GitHub, LinkedIn, Email | `profile.yml`, `interests.yml` |
| 2 | **News** | Dated one-line items, newest first, each with a proof or code link. Shows the latest 6; "show all" opens the rest | `news.yml` |
| 3 | **Research interests** | Each interest area with 1–2 sentences on what Hamza wants to study. The About chips jump to this section | `interests.yml` |
| 4 | **Research projects** | P-013 "If one power line fails, does anything overload?" (N-1 contingency screening with a graph neural network). More are added when finished | `projects/*.md` with `kind: research` |
| 5 | **Hackathon projects** | In v1: one short line, "Hackathon projects are added one by one after review." Filled later | `projects/*.md` with `kind: hackathon` |
| 6 | **Teaching & mentoring** | iCodeGuru volunteer teaching (DSA live sessions, IELTS-for-scholarships), "Basics of Claude Code" workshop, MIT Informatics Tournament Spring 2026 (solver + helped prepare others), with video links | `teaching.yml` |
| 7 | **Awards & competitions** | Only the proven items in §4.1, each with a proof link | `awards.yml` |
| 8 | **Skills** | Skills in groups (for example Programming, ML, Power systems, Tools) | `skills.yml` |
| 9 | **CV & Contact** | Download CV (PDF), email, GitHub, LinkedIn, LeetCode, lablab, Devpost | `profile.yml` + CV file |

- A section with no published items is hidden, **except** section 5 in v1 (it shows its one line).
- **Project page:** title, tags, date, solo or "team of N", my role, summary, the problem, the method,
  results with how they were measured, limits, images, links (code, live demo, video, proof).
- **Filter chips** above a project section appear only when that section has 4 or more projects
  (with 1 project, chips would look empty).

### 4.1 Awards allowed in v1

All are proven in `_portfolio_journey/cv_review_2026-10-17.md` §6 and `_portfolio_journey/proofs/`.
The exact wording and proof link of each go in `awards.yml`, and Hamza approves each one.

| Award (wording to use) | Proof |
|---|---|
| UCLA CodeSprint LA 2026: team of 3, rank 15 of 244 | LinkedIn post |
| BlueQubit × Yale Peaked Hackathon 2026: rank 53 of 549 | LinkedIn post (a leaderboard screenshot is preferred) |
| Berkeley CALICO Spring 2026: team of 3, Bronze Brick Award (Pakistan #32 of 78); global #269 of 375 | Certificate |
| Harvard CS50x Puzzle Day 2025: team solved all 9 of 9 puzzles | CS50 certificate |
| AMD Developer Hackathon 2026: Finalist, team of 3 (my part: training data and testing on AMD GPUs) | lablab certificate + team page |
| Solar Production and Load Prediction (Kaggle, GIKI DNN Bootcamp 2024): 10th place | Kaggle leaderboard screenshot |
| Meta Hacker Cup 2025, Round 1: 7,798th | Certificate |
| M(IT)² competition: rank 482 of 559 (year to be confirmed by Hamza) | LinkedIn post |
| HackerRank Orchestrate (May 2026): rank 427 of 1,349 | LinkedIn post + screenshot |

**Never on the site** (no proof): "Winner", "1st place Hugging Face prize", CS50x Puzzle Day 2026 "10/10",
NeuroOceans "40% less time", GIKI "of 55" (until the total is shown in a screenshot).
**Not in Awards:** the Duolingo English Test score is a language test, not an award (see §13 Q2).

## 5. Functional requirements

**Content**
- **FR-1** All content lives in plain text files in `content/`: YAML files for lists, and one Markdown file with a
  YAML header per project. The page code contains no personal content.
- **FR-2** A project can also come from a `portfolio.yml` file in one of Hamza's **public** GitHub repos. The repos to
  read are listed in `content/sources.yml`. It uses the same fields as a project file; its image paths point to files
  inside that repo, and the checker downloads them into the build.
- **FR-3** Every project, news item, award and teaching item has `status: draft` or `status: published`. Only
  `published` items appear on the public site.
- **FR-4** Every published item has `reviewed_by_hamza: YYYY-MM-DD` (the date Hamza read and approved it). For
  `profile.yml`, `interests.yml` and `skills.yml`, one date for the whole file is enough.
- **FR-5** Items are shown newest first. An optional `pin: 1`, `pin: 2`, … puts items on top in that order.
- **FR-6** A project's `team` is either `solo` or `team of N` (N = 2 or more). For a team project, `my_role` must say
  what Hamza himself did.

**Checker ("the robot", Python, runs on GitHub Actions)**
- **FR-7** It runs (a) on every push, (b) once a day by itself, and (c) when Hamza presses "Run workflow" on GitHub.
- **FR-8** It checks:
  - every file has the right fields and types, valid dates, and no empty required text;
  - no two items share the same `slug`;
  - FR-6 rules for team projects;
  - every link works: a web request answers with status below 400 (3 tries). Sites that block robots
    (for example LinkedIn) are listed in `content/link_check_skip.yml`; their links are checked by hand by Hamza,
    and each one in the list has a `checked_by_hamza` date;
  - every proof file used is listed in `content/proofs.yml` with `private_info_checked: true`;
  - every image has `alt` text and is at most 2 MB;
  - no secret keys or passwords anywhere in the repo.
- **FR-9** If anything fails: stop, print the file and the problem in simple words, and do not deploy.
  The live site stays the same.
- **FR-10** If everything passes: (1) write the data to the Neon Postgres database (add, update, and delete items
  that were removed from the files); (2) deploy the site to Vercel.
- **FR-11** The database step must not block the site: if writing to the database fails after 3 tries, the checker
  still deploys and reports a warning (the files are the master copy, constitution rule 4).
- **FR-12** On the **daily** run, a link that does not work gives a warning instead of a stop, so a short outage of
  someone else's website cannot block Hamza. The daily run deploys only if something changed (for example a
  `portfolio.yml` in a project repo was updated).
- **FR-13** Deploys happen **only** through the checker. Vercel's automatic deploy-on-push is switched off, so nothing
  can skip the checks. A push to `main` makes a public (production) deploy without drafts. A push to `preview` makes a
  private preview deploy that includes drafts; it never changes the public site or the database.
- **FR-14** Secret values (Vercel token, database address) are stored as GitHub Actions secrets and Vercel environment
  variables, never in files.

**Website (Next.js on Vercel)**
- **FR-15** Pages are built from the checked files at deploy time. Showing a page never needs the database.
- **FR-16** Filter chips (see §4) work in the browser and do not need the database.
- **FR-17** A search box finds projects, awards, news and teaching items. It asks the database through a server
  function. If the database does not answer within 2 seconds, it searches the copy of the data built into the site.
- **FR-18** The site **always starts in dark mode** (the chosen look). A ☀/☾ button switches to light mode, and the
  choice is remembered on that device. (Open question §13 Q1.)
- **FR-19** Photo: round crop only. Dark mode uses `hamza_graphite_amber_glow.png`, light mode uses
  `hamza_warm_cream.png` (both made from `capture 1.PNG`, now in `_portfolio_journey/assets/photo/`). The full-size
  versions are never shown, because of an edge mark on the right arm.
- **FR-20** Every page has a share preview (title, one line, image) so that links look good on LinkedIn, WhatsApp
  and in email.
- **FR-21** Cards lift slightly with an amber glow on hover (mouse) or focus (keyboard). All motion is switched off when
  the visitor's device has "reduce motion" on.
- **FR-22** Works on phones from 360 px wide up to large laptops. No sideways scrolling. All buttons are at least
  44 × 44 px so they are easy to tap.
- **FR-23** Images are resized and converted to modern formats (WebP/AVIF) automatically. The photo loads first;
  images further down load only when the visitor scrolls near them.
- **FR-24** The Download CV button appears only when `profile.yml` has `cv_reviewed_by_hamza: YYYY-MM-DD`
  (the CV must follow the same proof rules as the site; see §13 Q3).
- **FR-25** The email address is shown so people can copy it and as a "mailto" link; it is not hidden behind a form.

## 6. Look and feel (agreed in the browser sessions, 2026-10-18)

- **Palette "Graphite & Electric Amber"**
  - Dark: background `#141417`, text `#ECECEF`, muted text `#9A9AA6`, lines `#3A3A42`, accent amber `#F5B83D`,
    second accent teal `#2DD4BF` (only for small tags).
  - Light: background `#FAF8F4`, text `#1D1D22`, muted text `#6B6B75`, lines `#D9D4C9`, accent deep amber `#B7791F`
    (bright amber is too hard to read on cream), teal `#0F766E`.
  - These colours are a starting point: any pair that fails the WCAG AA contrast check is darkened or lightened
    until it passes.
- Section titles in code style (`## news`, `## research projects`); site name `~/hamza-atiq`.
- One calm column, readable text, and a small `proof ↗` / `code ↗` link next to each claim.
- **No** decorative art, **no** big headline number tiles, **no** count-up animations. A project's result is shown
  small and plain inside its card and page, together with how it was measured.
- **Real images only** (constitution rule 7): the photo; one cover image per project (screenshot, diagram or result
  chart) in the same shape for all cards; images on project pages; YouTube thumbnails for lectures; small
  certificate thumbnails that open full size.
  - P-013's cover: its existing live-page screenshot (`docs/img/live-page.png` in the P-013 repo).
- Text contrast meets WCAG AA in both modes.

## 7. Data format (short version; the full field list goes in `plan.md`)

```yaml
# content/projects/p013-grid-contingency.md  (header part)
title: "If one power line fails, does anything overload?"
subtitle: "N-1 contingency screening with a graph neural network (IEEE 57-bus)"
slug: p013-grid-contingency
kind: research                 # research | hackathon
status: published              # draft | published
reviewed_by_hamza: 2026-10-18  # filled only after Hamza approves
date: 2026-10
tags: [power-systems, graph-neural-networks]
team: solo                     # solo | "team of N"   (to be confirmed by Hamza)
my_role: "Built everything: data generation, model, solver check, tests, live page"   # to be confirmed
summary: "An AI ranks all 80 possible line failures; a real power-flow solver confirms only the risky ones."
result: "Caught at least 99.91% of dangerous cases in all 50 tests (8,750 unseen days); 2.25× faster (median)."
cover: { src: images/p013/cover.png, alt: "IEEE 57-bus grid map showing the lines checked by the solver" }
links:
  code: https://github.com/Hamza-Atiq/p013-grid-contingency-screening
  demo: https://hamza-atiq.github.io/p013-grid-contingency-screening/
proofs: []
pin: 1                         # optional
```
After the header comes normal Markdown text for the project page: problem, method, results, limits.

Other files in `content/`: `profile.yml`, `news.yml`, `interests.yml`, `teaching.yml`, `awards.yml`, `skills.yml`,
`proofs.yml`, `sources.yml`, `link_check_skip.yml`. Each has a fixed form that the checker enforces.

## 8. Where things live

- Code and content: `D:\AI Journey\portfolio` (git) → GitHub repo `Hamza-Atiq/portfolio` (public) → Vercel.
- Address: `hamza-atiq.vercel.app` if that name is free on Vercel; otherwise the closest free name, chosen with
  Hamza. A custom domain can be added later with no other change.
- Database: Neon Postgres, free plan, added to the Vercel project.
- Specs: `specs/` in the same repo.
- Hamza's research projects in `D:\USA Journey\Projects` are only **read** from this work, never changed.
  Content about them is copied into `content/projects/`, or later read from their `portfolio.yml`.

## 9. Edge cases

| Situation | What happens |
|---|---|
| Database asleep (Neon sleeps after a few idle minutes) | First search may take about 1 second longer; pages are not affected |
| Database down | Pages are not affected; search uses the built-in copy (FR-17); the checker warns (FR-11) |
| A source repo becomes private, is deleted or renamed | That project is skipped with a warning; the rest deploys |
| Two items with the same `slug` | Error, nothing deploys |
| A published project has no image | Allowed: it shows a plain text card (no fake image) |
| Very long summary | The card shows 3 lines and "read more" |
| A proof file contains private data (for example the Duolingo PDF shows the date of birth) | It is not uploaded; link to the official verification page instead |
| A link in `link_check_skip.yml` breaks | The checker cannot see it; Hamza re-checks these links by hand every 3 months (the checker warns when a `checked_by_hamza` date is older than 90 days) |

## 10. Out of scope for version 1

- "Ask about Hamza" AI chat (version 2: Postgres + pgvector, answers only from the site's own data).
- Publications section (added when there is a publication).
- Custom domain.
- Login page or admin panel (never: editing only through git).
- Hackathon project cards (added one by one after each project is reviewed and finished).
- Showing visitor numbers on the site.

## 11. Acceptance criteria (version 1 is done when all are true)

- [ ] The site opens on a phone (360 px wide) and a laptop with no sideways scrolling.
- [ ] Sections 1–9 of §4 appear in that order, filled from `content/` files. P-013 has its own page.
- [ ] Every award, news and project link on the site works, or is in `link_check_skip.yml` with a recent check date.
- [ ] Adding one test news item and pushing makes it appear live within 5 minutes, with no code change.
- [ ] Pushing a broken file (empty `my_role` on a team project, a dead link, an unlisted proof file) is refused with a
      clear message, and the live site does not change.
- [ ] An item with `status: draft` is not on the public site, but is visible on the `preview` branch link.
- [ ] The light/dark button works, the photo changes with the mode, and the choice is remembered after reload.
- [ ] With the database switched off, every page loads and search still returns results.
- [ ] Lighthouse on mobile: Performance ≥ 90 and Accessibility ≥ 90.
- [ ] The secret-key scan passes; no private data (date of birth, ID, phone, address) in the repo.
- [ ] Hamza has read and approved every sentence visible on the site.

## 12. Decisions log (clarify talk, 2026-10-18)

| Question | Decision |
|---|---|
| What does "dynamic" mean? | A mix: files in git (master copy) + auto-pull from project repos + Postgres for live features. No login page |
| Hosting | Vercel free address (GitHub Pages cannot safely use a database) |
| Section order | About, News, Interests, **Research projects, then Hackathon projects**, Teaching, Awards, Skills, CV/Contact |
| Which projects | Build the empty site first with P-013. Then add projects one by one, only after each is checked and finished. Weak projects are improved (about 1 week each) before they are added |
| Tools | Next.js (website) + Python (checker) + Neon Postgres. Hamza edits only content files; Claude builds |
| Look | Graphite & Electric Amber: B's attractive style + A's calm reading. No art, no headline numbers |
| Interactions | Filter chips, cards that react; AI chat in v2 |
| Images | Real images only; round photo; dark = graphite glow, light = warm cream |

## 13. Open questions for Hamza (my default answer is used until he decides)

- **Q1 Theme at first visit.** Always start dark (default), or follow the visitor's phone setting (light phones start light)?
- **Q2 Duolingo English Test 115.** Leave it off the site (default; it is on the CV), or show it in About?
- **Q3 CV file.** The current CV still has the unproven lines from `cv_review_2026-10-17.md`. Default: no
  Download CV button until a corrected CV is ready and approved.
- **Q4 Lower ranks** (Meta 7,798th, M(IT)² 482/559, HackerRank 427/1,349, CALICO global 269/375). Default: show them
  all, but in a smaller "Other competitions" list under the strong ones (UCLA, BlueQubit × Yale, CALICO Pakistan,
  CS50 2025, AMD Finalist, GIKI 10th).
- **Q5 P-013 team and role.** Default: solo, "built everything" (all 4 public commits are Hamza's). Please confirm.
- **Q6 The About summary text and interest list.** Claude drafts them from `hamza-profile-facts`; Hamza edits and approves.

## 14. Research notes behind the choices

- Eye-tracking: visitors ignore decorative and stock images and study real, informative ones
  (Nielsen Norman Group, "Not All Images Are the Same").
- Colour: 3–4 colours, one accent colour for actions, strong contrast. In small studies blue is most often linked with
  trust, but brightness and liveliness seem to matter more than warm vs cool. The evidence is limited, so this is
  guidance, not proof.
- Speed: Google's "good" target for the main content to appear (Largest Contentful Paint) is 2.5 seconds or less.
  Images are the usual cause of slow pages, so they are resized, converted and loaded late.
- Postgres as the "system of record" and the base for a later AI chat: Agent Factory `postgres-ai-crash-course` and
  the book's thesis.

## 15. Changes from draft v1 → v2 (self-review)

1. **Link check fixed:** LinkedIn and some other sites block robots, so a simple check would wrongly fail. Added
   `link_check_skip.yml` with hand checks every 90 days (FR-8, §9).
2. **Deploys only through the checker:** Vercel's own deploy-on-push is switched off; otherwise a bad file could go live
   without being checked (FR-13).
3. **Secrets** placement written down (FR-14).
4. **CV button safety:** the CV must follow the proof rules too (FR-24, Q3).
5. **Theme rule made clear:** v1 said "dark by default, but light if the device asks", which would show light to most
   visitors. Now: always dark first, with an open question (FR-18, Q1).
6. **Interests duplicated** in About and in their own section: now the chips jump to the section (§4).
7. **Awards table** with exact wording and proof type; GIKI wording fixed to "10th place"; Duolingo moved out of
   Awards; lower ranks grouped (§4.1, Q2, Q4).
8. **P-013 facts checked** against its README: title, 80 failures, 50 tests, 8,750 days, ≥99.91%, 2.25× median, live
   page link, cover image (§4, §6, §7).
9. **Vague words replaced with numbers:** "about 2 minutes" → "within 5 minutes"; image limit 2 MB; tap size 44 px;
   news shows the latest 6; filter chips only with 4+ projects.
10. **Undo** wording made accurate: git revert, or Vercel "Instant Rollback" to the previous version.
11. **Vercel address** may be taken; fallback written down (§8).
12. **Images from project repos** handled (FR-2); daily run deploys only when something changed (FR-12).
13. **Preview branch** made exact: it shows drafts, stays private, and never touches the public site or database (FR-13).
14. **Unknown facts marked** instead of guessed: M(IT)² year, P-013 solo/role (Q5).
