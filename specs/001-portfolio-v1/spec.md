# Spec 001: Portfolio website, version 1

- **Status:** v5. v4 approved by Hamza 2026-10-24; launch fixes 1–8 answered 2026-11-01 and 2026-11-03 ("yes to all"). Changes: §15–§18
- **Date:** 2026-10-18 (v5: 2026-11-03)
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
| 1 | **About** (top) | Round photo, name, the line `// electrical engineer → AI`, a short honest summary (2–3 sentences, draft in §4.2), "Interested in" chips, one small line "English: Duolingo English Test 115 (Feb 2026)" with its official verification link (§13 Q2), buttons: Download CV, GitHub, LinkedIn, Email | `profile.yml`, `interests.yml` |
| 2 | **News** | Dated one-line items, newest first, each with a proof or code link. Shows the latest 6; "show all" opens the rest | `news.yml` |
| 3 | **Research interests** | Each interest area with 1–2 sentences on what Hamza wants to study. The About chips jump to this section | `interests.yml` |
| 4 | **Research projects** | P-013 "If one power line fails, does anything overload?" (N-1 contingency screening with a graph neural network). More are added when finished | `projects/*.md` with `kind: research` |
| 5 | **Hackathon projects** | In v1: one short line, "Hackathon projects are added one by one after review." Filled later | `projects/*.md` with `kind: hackathon` |
| 6 | **Teaching & mentoring** | iCodeGuru volunteer teaching (DSA live sessions, IELTS-for-scholarships), "Basics of Claude Code" workshop, MIT Informatics Tournament Spring 2026 (solver + helped prepare others), with video links | `teaching.yml` |
| 7 | **Awards & competitions** | Only the proven items in §4.1, each with a proof link | `awards.yml` |
| 8 | **Skills** | Skills in groups (for example Programming, ML, Power systems, Tools) | `skills.yml` |
| 9 | **CV & Contact** | Download CV (PDF), email, GitHub, LinkedIn, LeetCode, lablab, Devpost | `profile.yml` + CV file |

- A section with no published items is hidden, **except** section 5 in v1 (it shows its one line).
- **Project page:** title, tags, date, solo or "team of N", my role (only if the file gives one), summary, the
  problem, the method, results with how they were measured, limits, images, links (code, live demo, video, proof).
- **Filter chips** above a project section appear only when that section has 4 or more projects
  (with 1 project, chips would look empty).

### 4.1 Awards allowed in v1

**Proof rule (Hamza, 2026-11-01):** the site uses **the same proof links as the CV**: a certificate link if the event
gives one, otherwise the LinkedIn post. A LinkedIn post is valid proof. The exact links are in
`_portfolio_journey/cv_review_2026-10-17.md` §7. Hamza is not asked for extra screenshots or other proof.
The exact wording and proof link of each go in `awards.yml`, and Hamza approves each one.

| Award (wording to use) | Proof (same link as the CV) |
|---|---|
| UCLA CodeSprint LA 2026: team of 3, rank 15 of 244 | LinkedIn post |
| BlueQubit × Yale Peaked Hackathon 2026: rank 53 of 549 | LinkedIn post |
| Berkeley CALICO Spring 2026: team of 3, Bronze Brick Award (Pakistan #32 of 78); global #269 of 375 | LinkedIn post + certificate file already in `proofs/` (shows the global rank) |
| Harvard CS50x Puzzle Day 2025: team solved all 9 of 9 puzzles | Google Drive certificate folder |
| AMD Developer Hackathon 2026: Finalist, team of 3 | lablab team page |
| Solar Production and Load Prediction (Kaggle, GIKI DNN Bootcamp 2024): 10th place | Google Drive file + leaderboard screenshot already in `proofs/` (shows 10th place) |
| Meta Hacker Cup 2025, Round 1: 7,798th | Google Drive certificate |
| M(IT)² coding competition 2025, Round 1: rank 482 of 559 | LinkedIn post |
| HackerRank Orchestrate (May 2026): rank 427 of 1,349 | LinkedIn post |

**Never on the site** (no proof): "Winner", "1st place Hugging Face prize", CS50x Puzzle Day 2026 "10/10",
NeuroOceans "40% less time", GIKI "of 55" (until the total is shown in a screenshot).
**Not in Awards:** the Duolingo English Test score is a language test, not an award. It is shown in About (§13 Q2).

**How the list is shown (§13 Q4):** all items above are shown, because they are all international competitions.
The first six (UCLA, BlueQubit × Yale, CALICO, CS50 2025, AMD, GIKI) are the main list. Meta Hacker Cup, M(IT)² and
HackerRank go in a smaller "Other international competitions" list right below it. (CALICO keeps one line with both
its Pakistan and global rank.)

### 4.2 Draft About text (Claude's draft, Hamza edits and approves; §13 Q6)

- **Line:** `// electrical engineer → AI`
- **Summary (3 sentences):** "I am an electrical engineer (BS, University of Wah, 2019) who has been building AI
  projects since 2024. I have worked as a solar site engineer and as a machine learning engineer, and I now apply
  machine learning to power-system problems, such as quickly finding which power-line failures could overload a grid.
  I am looking for a funded MS/PhD position in the USA (Fall 2027) where I can do research where power systems and
  AI meet."
- **Interest chips (in this order):** Power systems · Smart grid · Embedded systems · Robotics · Batteries & EVs ·
  TinyML · Wireless.
- **Research interests section (one sentence each, draft):**
  - *Power systems:* using fast AI models to help check grid safety, for example N-1 contingency screening (P-013).
  - *Smart grid:* forecasting solar power and load, so that a grid with a lot of solar stays stable.
  - *Embedded systems:* running useful models on small, low-power devices.
  - *Robotics:* control and simulation of robots.
  - *Batteries & EVs:* predicting battery health and smart charging.
  - *TinyML:* machine learning on microcontrollers with very little memory.
  - *Wireless:* using machine learning for wireless communication.
- Every sentence above is only a draft. Hamza can change, remove or re-order any of it; nothing goes live before his
  `reviewed_by_hamza` date (FR-4).

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
- **FR-6** A project's `team` is either `solo` or `team of N` (N = 2 or more). `my_role` is optional for every project.
  Team work is shown as team work: no "what Hamza did" line is required (Hamza, 2026-11-01).

**Checker ("the robot", Python, runs on GitHub Actions)**
- **FR-7** It runs (a) on every push, (b) once a day by itself, and (c) when Hamza presses "Run workflow" on GitHub.
- **FR-8** It checks:
  - every file has the right fields and types, valid dates, and no empty required text;
  - no two items of the same kind share a `slug`;
  - a project's `team` has the FR-6 form;
  - every link works: a web request answers with status below 400 (3 tries). Sites that block robots
    (for example LinkedIn) are listed by exact address in `content/link_check_skip.yml`; their links are checked by hand
    by Hamza, and each one in the list has a `checked_by_hamza` date before the site goes public;
  - every proof file used is listed in `content/proofs.yml` with `private_info_checked: true`;
  - every image has `alt` text and is at most 2 MB;
  - no secret keys or passwords anywhere in the repo;
  - every file path in a content file stays inside `content/`, and every `slug` is safe, so no other file on the machine
    can be copied to the public site. Projects pulled from other repos pass the same image and path checks.
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
  variables, never in files. The database address is given to **Production only**, never to Preview: during the Neon
  setup the Preview option is unticked, and this is checked afterwards.
- **FR-26** Warnings reach Hamza. When a daily or `main` run ends with a warning or a failure, the Action opens one
  GitHub issue named "Site check needs attention", assigned to Hamza so that GitHub notifies him. It lists each
  checker problem in simple words, and each failed step (such as the deploy step) with a link to that run's log. If that issue is already open, the Action updates it instead of opening another. When a later
  daily or `main` run is clean, the Action closes it. `preview` runs never open issues.
- **FR-27** The daily check never stops by itself. GitHub turns off scheduled workflows in a public repo after 60 days
  with no repo activity. So on each daily run, if the newest commit on `main` is 50 or more days old, the Action makes
  one small commit to `.github/keepalive.txt`. This commit does not start a new run or a deploy.

**Website (Next.js on Vercel)**
- **FR-15** Pages are built from the checked files at deploy time. Showing a page never needs the database.
- **FR-16** Filter chips (see §4) work in the browser and do not need the database.
- **FR-17** A search box finds projects, awards, news and teaching items. It asks the database through a server
  function. If the database does not answer within 2 seconds, it searches the copy of the data built into the site.
- **FR-18** At the first visit the site **follows the visitor's device setting**: a phone or laptop set to light
  shows light mode, one set to dark shows dark mode. If the device gives no setting, the site starts dark. A ☀/☾
  button switches the mode, and the visitor's choice is remembered on that device and wins over the device setting.
  The page must not flash the wrong mode while loading. (Decided in §12, Q1.)
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
- **FR-24** The site has a Download CV button (§13 Q3). It appears only when `profile.yml` has
  `cv_reviewed_by_hamza: YYYY-MM-DD` (the CV must follow the same proof rules as the site). The CV is a PDF exported
  from Hamza's Google Doc "Hamza CV EE" and saved in the repo. **Hamza confirmed on 2026-10-24 that the CV is
  correct**, so `cv_reviewed_by_hamza: 2026-10-24`. The CV is Hamza's own document; Claude does not edit or re-check it.
  It shows his phone number. On 2026-11-03 Hamza chose to publish it exactly as it is, knowing the number becomes
  public; this is the one exception to constitution rule 8.
- **FR-25** The email address is shown so people can copy it and as a "mailto" link; it is not hidden behind a form.
- **FR-28** Search engines can find the public site. It has `robots.txt` (allow all, and name the sitemap) and
  `sitemap.xml` (the main page and every published project page). The site is added to Google Search Console and the
  sitemap is submitted. A build that includes drafts (the `preview` branch) tells search engines not to list it.
- **FR-29** The site has a small favicon: an amber `~` on graphite, matching the site name `~/hamza-atiq`. This is the
  site's mark, not decoration, so constitution rule 7 is not broken.
- **FR-30** A wrong address shows a custom "page not found" page in the same style, with a link back to the main page,
  and answers with status 404.

## 6. Look and feel (agreed in the browser sessions, 2026-10-18)

- **Palette "Graphite & Electric Amber"**
  - Dark: background `#141417`, text `#ECECEF`, muted text `#9A9AA6`, lines `#3A3A42`, accent amber `#F5B83D`,
    second accent teal `#2DD4BF` (only for small tags).
  - Light: background `#FAF8F4`, text `#1D1D22`, muted text `#6B6B75`, lines `#D9D4C9`, accent deep amber `#B7791F`
    (bright amber is too hard to read on cream), teal `#0F766E`.
  - These colours are a starting point: any pair that fails the WCAG AA contrast check is darkened or lightened
    until it passes.
- **Layout (Hamza, 2026-11-03; he rejected the first build's narrow centre column):**
  - On a laptop the content uses a wide container, about 1,100 px at a 1440 px screen, with side margins of about 170 px. Long reading text keeps a comfortable line length, but sections use the full width.
  - A fixed top menu: site name "Hamza Atiq" (Hamza, 2026-11-07: no code-style `~/` or `//` symbols anywhere), links to the sections with the current section marked, a small search button, CV, and the ☀/☾ button.
  - First screen: name, one line, summary and buttons on the left; round photo on the right. Below them, a row of four key facts (Education, Research, Teaching, Competitions) from `profile.yml`, each linked to its section or proof.
  - Sections are clearly separated by bands or lines. News is a two-column list (date, then text and link). Interests are a 3-column grid of short cards. Projects are wide rows: image on the left; title, result and links on the right. Teaching is a timeline with role and dates, showing at most 3 video thumbnails per item with "show all" for the rest. Awards are rows with year, text and proof.
  - Phones stack everything into one column (FR-22 is unchanged).
- **Type (Hamza, 2026-11-03):** the name and section titles use a classic serif font; body text uses a clean sans-serif font; fonts are served with the site, not from another company's server. This replaces the earlier code-style titles such as `## news`. The site name in the menu and footer is "Hamza Atiq" in the serif font; the line above the name is plain text ("Electrical engineer → AI"). Words shown on the page start with a capital letter (link labels, team, tags), except brand names written in small letters (iCodeGuru, pandapower, scikit-learn, pytest).
- A small `proof ↗` / `code ↗` link stays next to each claim.
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
team: solo                     # solo | "team of N"   (confirmed by Hamza 2026-10-18)
my_role: "Built everything: data generation, model, solver check, tests, live page"   # confirmed: solo build
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

- Code and content: `D:\AI Journey\portfolio` (git) → GitHub repo `Hamza-Atiq/portfolio` (private during the build, public from plan Task 13, with Hamza's OK) → Vercel.
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
| A source repo has a bad `portfolio.yml`, or GitHub is briefly down | Error: nothing deploys and the old site keeps the project (FR-9) |
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
- New work found on 2026-11-01: `hackerrank-orchestrate-october26` and `OSI Hackathon` (not audited yet) and P-14
  Bearing Whisperer (live). They wait until version 1 is live, then each is checked and added one by one.
- Showing visitor numbers on the site.

## 11. Acceptance criteria (version 1 is done when all are true)

- [ ] The site opens on a phone (360 px wide) and a laptop with no sideways scrolling.
- [ ] Sections 1–9 of §4 appear in that order, filled from `content/` files. P-013 has its own page.
- [ ] At 1440 px the content is at least 1,000 px wide, the top menu is visible after scrolling, and the photo sits to the right of the text. Screenshots at 360, 768 and 1440 px in both modes are compared with the agreed layout by a person, not only by tests.
- [ ] Every award, news and project link on the site works, or is in `link_check_skip.yml` with a recent check date.
- [ ] Adding one test news item and pushing makes it appear live within 5 minutes, with no code change.
- [ ] Pushing a broken file (an empty `summary` on a project, a dead link, an unlisted proof file) is refused with a
      clear message, and the live site does not change.
- [ ] A warning on a daily run opens one GitHub issue assigned to Hamza; a clean run closes it (FR-26).
- [ ] The 50-day keepalive commit logic is tested, and that commit starts no run or deploy (FR-27).
- [ ] `robots.txt` and `sitemap.xml` are correct on the public site, the sitemap is submitted to Google Search Console,
      the favicon shows, and a wrong address shows the custom page with status 404 (FR-28–FR-30).
- [ ] The database address exists in Vercel's Production only, not in Preview (FR-14).
- [ ] An item with `status: draft` is not on the public site, but is visible on the `preview` branch link.
- [ ] A device set to light opens the site in light mode and a device set to dark opens it in dark mode, with no
      flash of the wrong mode. The ☀/☾ button works, the photo changes with the mode, and the choice is remembered
      after reload.
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
| Q1 Theme at first visit (Hamza, 2026-10-18) | Follow the visitor's device setting; dark if there is no setting; button choice is remembered |
| Q2 Duolingo 115 (Hamza) | Show it: one small line in About with the official verification link (not the PDF, which shows the date of birth) |
| Q3 CV button (Hamza) | Add it. Hamza confirmed the CV is correct (2026-10-24); the button goes live with the site |
| Q4 Lower ranks (Hamza) | Show them, they are international competitions: smaller "Other international competitions" list under the main list |
| Q5 P-013 (Hamza) | Solo; Hamza built everything |
| Q6 About text (Hamza) | Claude drafts (§4.2); Hamza edits and approves |
| Q7 M(IT)² year (Hamza) | 2025 |

## 13. Questions for Hamza: all closed (2026-10-24)

All questions are answered; the decisions are in §12.
- **CV:** Hamza confirmed on 2026-10-24 that his CV is correct. Closed; not asked again.
- **About text (§4.2):** Claude's draft is used. Hamza can change any sentence at any time by editing the content file.
- **Duolingo link:** the About line uses the official verification link when it is added to `profile.yml`
  (optional field). It is not a blocker for the build.

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

## 16. Changes from v2 → v3 (Hamza's answers, 2026-10-18)

1. **Theme:** follows the device setting (dark if none), with no flash of the wrong mode (FR-18, §11).
2. **Duolingo 115** shown as one line in About with the official link (§4, §4.1).
3. **CV button** kept, live after the last CV fixes in §13 (FR-24).
4. **Lower ranks** shown in an "Other international competitions" list (§4.1).
5. **P-013** confirmed solo, built by Hamza (§7).
6. **About text and interests** drafted (§4.2), waiting for Hamza's edits.
7. **M(IT)² year** = 2025 (§4.1).

## 17. Changes from v3 → v4 (2026-10-24)

1. **Spec approved** by Hamza ("start next work"). Next step: `plan.md`.
2. **CV:** Hamza confirmed it is correct; FR-24 date set to 2026-10-24; the old CV fix list in §13 is removed.
3. **§13 closed:** About draft used as written; Duolingo link is an optional field, not a blocker.

## 18. Changes from v4 → v5 (launch fixes, 2026-11-01 and 2026-11-03)

Hamza's answers are recorded in `_portfolio_journey/launch_fixes_decisions.md`.

1. **Fixes 1–2, proofs:** same links as the CV; a LinkedIn post is valid proof; no extra screenshots (§4.1).
2. **Fix 3, team work:** shown as team work, with no "what Hamza did" line; `my_role` optional; AMD line shortened
   (constitution rule 1, FR-6, §4, §4.1, §11).
3. **Fix 4, warnings:** one GitHub issue assigned to Hamza (FR-26).
4. **Fix 5, 60-day stop:** a small commit when `main` is 50 days quiet (FR-27). A web search found the commit method
   widely used, and found no proof that re-enabling through the API resets the 60-day timer.
5. **Fix 6, findability:** robots, sitemap, Search Console, favicon, custom 404 (FR-28–FR-30).
6. **Fix 7, database address:** Production only (FR-14).
7. **Fix 8, new work:** waits until version 1 is live (§10).
8. **Layout rebuild:** Hamza rejected the first build's look; wide layout, top menu, facts row and serif titles agreed (§6, §11).
