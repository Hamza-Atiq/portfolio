# Portfolio v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Hamza's portfolio website as a system: content files → Python checker → Neon copy + Next.js site on Vercel, with P-013 as the first project.

**Architecture:** All content lives in `content/` (git = master copy). A Python checker (`checker/`) reads and checks it, pulls `portfolio.yml` from listed public repos, and writes ONE file, `site/data/content.json` (plus copied images/proofs). The Next.js site in `site/` builds every page from that JSON (no database needed for pages). After a passing check, GitHub Actions syncs Neon Postgres (search only) and deploys to Vercel with `vercel deploy --prebuilt`; Vercel's own git deploy is off.

**Tech Stack:** Python 3.12 (pydantic v2, PyYAML, httpx, psycopg 3, pytest) · Node 20 + Next.js (App Router, TypeScript) + `@neondatabase/serverless` · Vitest + Playwright · GitHub Actions · Vercel Hobby · Neon free.

**Spec:** `specs/001-portfolio-v1/spec.md` (v4, approved 2026-10-24) and `specs/constitution.md`. Read both before any task.

## Global Constraints

- Every dependency is pinned to an exact version (`==` in `checker/requirements.txt`, no `^`/`~` in `site/package.json`). Pick the newest stable release that is at least 2 weeks old at install time; `npm audit --omit=dev` and `pipx run pip-audit -r checker/requirements.txt` show no high/critical issue.
- Speed target (spec §14): Largest Contentful Paint ≤ 2.5 s on mobile; images below the first screen load lazily.
- Generated files are never committed: `.gitignore` has `.env*`, `.vercel/`, `site/data/content.json`, `site/public/c/`, `site/public/content-hash.txt`, `node_modules/`, `__pycache__/`.
- Content is data, not code: no personal text inside `site/` or `checker/` source (constitution 3). Page code reads only `site/data/content.json`.
- Only `status: published` items with `reviewed_by_hamza` reach production; `--include-drafts` (preview branch only) adds drafts (FR-3, FR-4, FR-13).
- Error messages are simple English and always name the file: `content/news.yml: item 3 ("p013-live"): the link https://… did not answer (status 404).`
- Colours exactly as spec §6 (dark `#141417/#ECECEF/#9A9AA6/#3A3A42/#F5B83D/#2DD4BF`, light `#FAF8F4/#1D1D22/#6B6B75/#D9D4C9/#B7791F/#0F766E`); teal only for small tags; adjust only to pass WCAG AA.
- Section titles in code style (`## news`), site name `~/hamza-atiq`. No decorative art, no headline number tiles, no count-up animation.
- Phones from 360 px, no sideways scroll, tap targets ≥ 44 × 44 px; all motion off under `prefers-reduced-motion`.
- Image ≤ 2 MB and must have `alt`. Photo: round crop only, never the full-size image (FR-19).
- No date of birth, ID number, home address, phone number or secret anywhere in the repo (constitution 8). Secrets only in GitHub/Vercel secrets (FR-14).
- Free to run: Vercel Hobby, Neon free, GitHub free (constitution 9).
- Repo commands use `git -c safe.directory=*` on this machine. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Special letters in content** (`→`, `×`, `²` in "M(IT)²", `≥`, Urdu names): load, check, JSON-write and render unchanged. Test in Task 1 (`test_unicode_survives_round_trip`).
2. **YAML surprises**: `date: 2026-10` (month only) must be accepted for projects; `reviewed_by_hamza: 2026-13-01` must be refused in simple words; an unquoted `no`/`yes` in a text field must be refused, not turned into true/false. Tests in Task 1.
3. **Sites that refuse HEAD or robots** (YouTube, Kaggle, Google Docs answer 403/405 to HEAD or a bare client): retry with GET and a normal browser User-Agent before calling a link broken. Test in Task 3 (`test_head_405_falls_back_to_get`).
4. **Windows edits**: CRLF line endings must load fine; an image path with `\` must be refused with "use / in paths". Tests in Task 1 and Task 2.
5. **Blocked browser storage** (private window): the ☀/☾ toggle and first-visit theme still work without `localStorage`, no crash, no flash. Test in Task 9 (`theme-script.test.ts: works when localStorage throws`).

---

## File structure

```
portfolio/
  content/                      # Hamza edits only here
    profile.yml interests.yml news.yml teaching.yml awards.yml skills.yml
    proofs.yml sources.yml link_check_skip.yml
    projects/p013-grid-contingency.md
    images/p013/cover.png       photo/hamza_dark.png  photo/hamza_light.png
    proofs/<files>              cv/Hamza_Atiq_CV.pdf
  checker/
    requirements.txt  pyproject.toml
    portfolio_checker/
      models.py       # pydantic models of every file
      load.py         # read YAML/MD → models, Report of errors
      rules.py        # cross-file rules (slugs, team, proofs, images, skip-list age)
      links.py        # link checker
      secrets_scan.py # secrets + private-data scan
      sources.py      # portfolio.yml pull from public repos
      build.py        # filter drafts, sort, copy assets, write content.json + content-hash.txt
      db_sync.py      # Neon upsert/delete
      __main__.py     # CLI
    tests/            # pytest, fixtures in tests/fixtures/
  site/               # Next.js
    data/content.json (generated, git-ignored)  public/ (generated assets git-ignored)
    app/ components/ lib/ tests/ e2e/
    vercel.json
  .github/workflows/check-and-deploy.yml
  .gitignore  README.md
```

---

### Task 1: Content models and loader

**Files:**
- Create: `checker/requirements.txt`, `checker/pyproject.toml`, `checker/portfolio_checker/{__init__,models,load}.py`, `.gitignore`
- Test: `checker/tests/test_load.py`, `checker/tests/fixtures/good/` (a full small valid `content/` copy), `checker/tests/fixtures/bad/`

**Interfaces:**
- Produces:
  - `class Problem(BaseModel): file: str; message: str` and `class Report: errors: list[Problem]; warnings: list[Problem]; def ok(self) -> bool`
  - Models (pydantic v2, `extra="forbid"`, strict str fields — YAML bools in text fields are errors):
    - `Link {label: Literal["code","demo","video","proof","paper"]; url: HttpUrl}`
    - `Image {src: str; alt: str (min 3 chars)}` — `src` relative to `content/`, forward slashes only
    - `YearMonth`: `YYYY`, `YYYY-MM` or `YYYY-MM-DD` that is a real date (some proofs show only a year or month). YAML turns a full `2026-10-24` into a `date` object and leaves `2026-10` as text, so accept both and store as text.
    - `Profile {name, tagline, summary: str; photo_dark: Image; photo_light: Image; email: EmailStr; links: dict[Literal["github","linkedin","leetcode","lablab","devpost"], HttpUrl]; english_test: {text: str; url: HttpUrl | None}; cv_file: str | None; cv_reviewed_by_hamza: date | None; reviewed_by_hamza: date | None}`
    - `Interest {slug, label, sentence: str}`; file = `{reviewed_by_hamza: date | None, items: list[Interest]}`
    - `NewsItem {slug, text: str; date: YearMonth; link: Link; status: Literal["draft","published"]; reviewed_by_hamza: date | None; pin: int | None}`
    - `Project` = header of spec §7 + `body: str` (Markdown after the header): `title, subtitle, slug, summary, result: str; kind: Literal["research","hackathon"]; status; reviewed_by_hamza: date|None; date: YearMonth; tags: list[str]; team: str ("solo" or r"team of ([2-9]|\d{2,})"); my_role: str; cover: Image|None; images: list[Image] = []; links: dict[Literal["code","demo","video","proof","paper"], HttpUrl]; proofs: list[str] = []; pin: int|None`
    - `TeachingItem {slug, title, org, role, text: str; date: YearMonth; videos: list[{title: str, url: HttpUrl}]; status; reviewed_by_hamza; pin}`
    - `Award {slug, text: str; date: YearMonth; group: Literal["main","other"]; proof_url: HttpUrl|None; proof_id: str|None; status; reviewed_by_hamza; pin}` — exactly one of `proof_url`/`proof_id`
    - `SkillGroup {name: str; items: list[str]}`; file = `{reviewed_by_hamza: date | None, groups: list[SkillGroup]}`
    - `ProofFile {id, file, note: str; private_info_checked: bool}`
    - `SkipLink {prefix: str; checked_by_hamza: date}`; `Source {repo: str (pattern "Owner/name")}`
  - `class Content(BaseModel)`: `profile, interests, news, projects, teaching, awards, skills, proofs, skip_links, sources`
  - `def load_content(root: Path) -> tuple[Content | None, Report]` — never raises on bad content; every problem becomes a `Problem` naming the file (and item number/slug).

- [ ] **Step 1: Write failing tests** in `test_load.py`:
  - `test_good_fixture_loads`: `content, r = load_content(FIX/"good")` → `r.ok()` and `content.projects[0].slug == "p013-grid-contingency"`.
  - `test_bad_date_message`: fixture with `reviewed_by_hamza: 2026-13-01` → one error, `file == "content/news.yml"` (paths in `Problem.file` always start at the repo root), message contains `"is not a real date"`.
  - `test_month_only_date_ok`: project `date: 2026-10` loads.
  - `test_yaml_bool_in_text_refused`: `text: no` → error containing `"put it in quotes"`.
  - `test_unicode_survives_round_trip`: award text `"M(IT)² rank 482 × 559 → ok"` equals after load and `model_dump_json` → `json.loads`.
  - `test_crlf_file_loads`: good fixture file rewritten with `\r\n` loads with no error.
  - `test_missing_required_field`: project without `my_role` → message `"my_role is missing"`.
- [ ] **Step 2:** `cd checker && python -m pytest tests/test_load.py -q` → FAIL (module not found).
- [ ] **Step 3:** Implement models and `load_content` (`requirements.txt`: pydantic, email-validator, PyYAML, httpx, psycopg[binary], pytest). Translate pydantic errors into one simple sentence each (`missing` → "`<field>` is missing", `date_from_datetime_parsing`/`date_parsing` → "`<value>` is not a real date (use YYYY-MM-DD)", bool-in-str → "`<field>` looks like yes/no; put it in quotes"). YAML read with `yaml.safe_load`; Markdown header split on the first two `---` lines.
- [ ] **Step 4:** Run tests → PASS.
- [ ] **Step 5:** Commit `checker: content models and loader`.

### Task 2: Cross-file rules

**Files:** Create `checker/portfolio_checker/rules.py`; Test `checker/tests/test_rules.py`

**Interfaces:**
- Consumes: `Content`, `Report`, `Problem` (Task 1).
- Produces: `def check_rules(content: Content, root: Path, today: date, include_drafts: bool) -> Report`

Rules (spec FR-4, FR-6, FR-8, §9):
1. No two items of the same kind share a `slug`.
2. `published` without `reviewed_by_hamza` → error (`"is published but has no reviewed_by_hamza date"`). `profile.yml`, `interests.yml`, `skills.yml` without their file date → error when `include_drafts` is false (production), allowed on preview (so Hamza can review them there first).
3. `team` is `team of N` → `my_role` must be non-empty and not equal to `"-"`; `solo` ok.
4. Every `proof_id` and every project `proofs[]` id exists in `proofs.yml`; that entry has `private_info_checked: true`; its `file` exists under `content/`. Every file in `content/proofs/` and `content/cv/` is listed (unlisted → error).
5. Every image `src`: no `\` (`"use / in paths"`), file exists under `content/`, size ≤ 2 MB (2 × 1024 × 1024 bytes). Paths starting with `/c/sources/` were already checked by Task 5 and are skipped here.
6. `profile.cv_file` set → file exists and is listed in `proofs.yml` with `private_info_checked: true`.
7. `SkipLink.checked_by_hamza` older than 90 days from `today` → **warning** `"re-check this link by hand"`.

- [ ] **Step 1: Failing tests**, one per rule, each building `Content` from the good fixture then breaking one thing: `test_duplicate_slug`, `test_published_needs_review_date`, `test_profile_date_needed_only_in_production`, `test_team_needs_my_role`, `test_unknown_proof_id`, `test_proof_not_privacy_checked`, `test_unlisted_proof_file`, `test_backslash_image_path`, `test_image_over_2mb` (write a 2 MB + 1 byte temp file), `test_skip_link_older_than_90_days_warns` (date 91 days back → warning, 90 days → nothing).
- [ ] **Step 2:** `python -m pytest tests/test_rules.py -q` → FAIL.
- [ ] **Step 3:** Implement `check_rules`.
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5:** Commit `checker: cross-file rules`.

### Task 3: Link checker

**Files:** Create `checker/portfolio_checker/links.py`; Test `checker/tests/test_links.py` (use `httpx.MockTransport`, no real network)

**Interfaces:**
- Consumes: `Content`, `Report`.
- Produces: `def all_links(content: Content) -> list[tuple[str, str]]` (file, url) and `def check_links(content: Content, mode: Literal["push","daily"], client: httpx.Client | None = None) -> Report`

Behaviour: for each unique URL not starting with any `skip_links[].prefix`: HEAD; if status is 403/405/429 or error, GET with User-Agent `Mozilla/5.0 (portfolio link check)`; good = final status < 400 after redirects; 3 tries with 1 s, 2 s waits; timeout 10 s; up to 8 at a time. Broken → error in `push` mode, warning in `daily` mode (FR-12). The message ends with: `If this site blocks robots (it opens fine in your browser), add it to content/link_check_skip.yml.`

- [ ] **Step 1: Failing tests:** `test_ok_link_passes`, `test_404_is_error_on_push`, `test_404_is_warning_on_daily`, `test_head_405_falls_back_to_get` (HEAD 405, GET 200 → ok), `test_skip_prefix_not_fetched` (transport asserts it is never called for `https://www.linkedin.com/...`), `test_retries_three_times` (two 503 then 200 → ok; patch sleep).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `checker: link checker`.

### Task 4: Secret and private-data scan

**Files:** Create `checker/portfolio_checker/secrets_scan.py`; Test `checker/tests/test_secrets_scan.py`

**Interfaces:** `def scan_repo(repo_root: Path, files: list[Path] | None = None) -> Report` — `files=None` means `git ls-files`, or every file under `repo_root` (minus `node_modules`, `.git`, `.next`) when it is not a git repo (tests); binary files (NUL byte in first 8 KB) are skipped except PDFs, whose text is not read (privacy for PDFs = `private_info_checked`).

Patterns (error, shows file + line, never prints the secret itself): `AKIA[0-9A-Z]{16}`, `sk-[A-Za-z0-9_-]{20,}`, `sk-ant-[A-Za-z0-9_-]{20,}`, `gh[pousr]_[A-Za-z0-9]{36}`, `AIza[0-9A-Za-z_-]{35}`, `gsk_[A-Za-z0-9]{20,}`, `postgres(ql)?://[^\s:]+:[^\s@]+@`, `-----BEGIN [A-Z ]*PRIVATE KEY-----`, and private words in `content/` text files only: `date of birth`, `\bDOB\b`, `CNIC`, `passport (no|number)`, phone numbers matching `\+?92[ -]?3\d{2}[ -]?\d{7}` or `03\d{2}-?\d{7}`.

- [ ] **Step 1: Failing tests:** `test_finds_github_token` (message has file + line, not the token), `test_finds_postgres_url_with_password`, `test_finds_pk_phone_in_content`, `test_dob_word_only_in_content` (same word in `checker/` source is fine), `test_clean_repo_passes`.
- [ ] **Step 2–4:** Run → FAIL, implement, run → PASS. (The test file builds tokens by string joining so this repo's own scan stays clean.)
- [ ] **Step 5:** Commit `checker: secret and private-data scan`.

### Task 5: Projects from public repos (`portfolio.yml`)

**Files:** Create `checker/portfolio_checker/sources.py`; Test `checker/tests/test_sources.py` (MockTransport)

**Interfaces:**
- Consumes: `Source`, `Project`, `Report`.
- Produces: `def pull_sources(sources: list[Source], site_public: Path, client: httpx.Client | None = None) -> tuple[list[Project], Report]`

Behaviour (FR-2, §9): fetch `https://raw.githubusercontent.com/{repo}/HEAD/portfolio.yml`; parse with the same `Project` model (body comes from its `body:` field). Image `src` paths are inside that repo: download `https://raw.githubusercontent.com/{repo}/HEAD/{src}` to `site_public/c/sources/{slug}/{basename}` and rewrite `src` to the final web path `/c/sources/{slug}/{basename}` (Task 6 leaves paths that start with `/c/` unchanged). Pulled projects then go through the same Task 2 rules (slugs, team, review date) as local ones. 404/private/renamed repo or bad file → **warning** naming the repo, project skipped, rest continues. Image > 2 MB → that project skipped with a warning.

- [ ] **Step 1: Failing tests:** `test_pulls_project_and_image`, `test_missing_repo_is_warning_not_error`, `test_bad_portfolio_yml_is_warning`, `test_big_image_skips_project`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `checker: pull projects from public repos`.

### Task 6: Build output and CLI

**Files:** Create `checker/portfolio_checker/{build,__main__}.py`; Test `checker/tests/test_build.py`, `checker/tests/test_cli.py`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces:
  - `def build_bundle(content: Content, include_drafts: bool) -> dict` — JSON shape below.
  - `def write_site(bundle: dict, content_root: Path, site_root: Path) -> str` — writes `site/data/content.json` (UTF-8, `ensure_ascii=False`, sorted keys), copies used images/proof files/CV into `site/public/c/<same relative path>`, writes `site/public/content-hash.txt`; returns the hash (sha256 of the JSON text, without `generated_at`).
  - CLI: `python -m portfolio_checker --content ../content --site ../site --repo .. --mode push|daily [--include-drafts] [--skip-network] [--sync-db]` → runs load → sources → rules → links → secret scan of `--repo` → build; prints errors then warnings (`ERROR content/news.yml: …`, `WARNING …`), exit 1 on any error and writes nothing (all output, including Task 5 downloads, goes to a temp folder that is moved into `site/` only after every check passed); exit 0 otherwise. `--skip-network` skips Tasks 3 and 5 (local tests only).
  - `content.json` shape: `{"hash", "generated_at", "include_drafts", "profile", "interests": [...], "news": [...], "projects": [...], "teaching": [...], "awards": {"main": [...], "other": [...]}, "skills": [...], "search_index": [{"kind": "project"|"award"|"news"|"teaching", "slug", "title", "text", "url"}]}`. Asset paths are rewritten to `/c/...`; proof ids are resolved to `{"label":"proof","url":"/c/proofs/..."}`. Only assets used by the bundle are copied. `cv_file` is `null` in the bundle unless `cv_reviewed_by_hamza` is set (FR-24).
- Sorting (FR-5): items with `pin` first by pin ascending, then by date newest first (partial dates compared as (year, month or 0, day or 0)), then slug.

- [ ] **Step 1: Failing tests:** `test_drafts_hidden_by_default`, `test_drafts_shown_with_flag`, `test_sort_pin_then_newest`, `test_awards_split_main_other`, `test_cv_hidden_without_review_date`, `test_hash_ignores_generated_at`, `test_cli_exit_1_and_writes_nothing_on_error` (bad fixture, `site/data/content.json` absent afterwards), `test_cli_good_fixture_exit_0` (`--skip-network`).
- [ ] **Step 2–4:** FAIL → implement → PASS (`python -m pytest -q` runs all checker tests).
- [ ] **Step 5:** Commit `checker: build bundle and CLI`.

### Task 7: Neon sync

**Files:** Create `checker/portfolio_checker/db_sync.py`, `checker/schema.sql`; Test `checker/tests/test_db_sync.py`

**Interfaces:**
- Consumes: `bundle["search_index"]`.
- Produces: `def sync_db(index: list[dict], database_url: str | None, tries: int = 3, connect=psycopg.connect) -> Report` — never raises; no URL → warning `"database not set, search uses the built-in copy"`; 3 failed tries → warning (FR-11). CLI flag `--sync-db` (reads `DATABASE_URL` env) runs it after a passing check and before deploy (FR-10); together with `--include-drafts` it is refused with an error (drafts never reach the database, FR-13).

`schema.sql`: `create table if not exists items (kind text not null, slug text not null, title text not null, body text not null, url text not null, search tsvector generated always as (to_tsvector('english', title || ' ' || body)) stored, primary key (kind, slug)); create index if not exists items_search on items using gin (search);` Each index entry's `text` is stored in `body`. Sync = one transaction: upsert every row, then `delete from items where (kind, slug) not in (...)`.

- [ ] **Step 1: Failing tests** (fake connection object via the `connect` parameter, no real DB): `test_upserts_and_deletes_removed`, `test_no_url_is_warning`, `test_three_failures_is_warning_not_error`, `test_cli_refuses_sync_with_drafts`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `checker: Neon sync`.

### Task 8: Real content

**Files:** Create everything under `content/` (see file structure). Sources of truth — copy, never invent:
- About text + interests: spec §4.2 word for word. Profile links: memory `hamza-profile-facts` (github, linkedin, leetcode, lablab, devpost); email `hamzaatiq34@gmail.com`; tagline `// electrical engineer → AI`; english_test text `English: Duolingo English Test 115 (Feb 2026)`, `url: null` until Hamza adds the official link.
- Awards: spec §4.1 wording exactly; first six `group: main`, Meta/M(IT)²/HackerRank `group: other`; proof URLs/files from `_portfolio_journey/cv_review_2026-10-17.md` §6 and `_portfolio_journey/proofs/`. Copy only proofs used (Berkeley certificate, AMD team page, GIKI rank-10 screenshot) into `content/proofs/`, after opening each and confirming no private data.
- Teaching: `_portfolio_journey/proofs/teaching/youtube_lectures.md` — 3 items (iCodeGuru DSA + IELTS volunteer instructor; Basics of Claude Code workshop Apr 2026; MIT Informatics Tournament Spring 2026 solver + helped prepare others) with their video links. No view counts. A session count is written only as counted from the video table at write time (no "20+" unless the table shows 20+).
- P-013: facts from its README in `D:\USA Journey\Projects\P-013-grid-contingency-screening` (read only) and spec §7; cover = copy of its `docs/img/live-page.png` (resize below 2 MB if needed).
- News (latest first): P-013 published (Oct 2026, code link) plus one line per main award with its proof link; dates from the proof pages.
- Skills: groups Programming / ML / Power systems / Tools; a skill is listed only if P-013 or an audited project (`_portfolio_journey/audits/`) uses it.
- Photo: `_portfolio_journey/assets/photo/hamza_graphite_amber_glow.png` → `content/photo/hamza_dark.png`, `hamza_warm_cream.png` → `content/photo/hamza_light.png`, each cropped square around the face and resized to 480 × 480 px (small file → fast first paint; the round mask hides the arm edge mark, FR-19).
- CV: export the Google Doc "Hamza CV EE" (id `1ovWmHI0XoiDLnON5IrgkhzPMj4cCBCTxdml9SMwvXTU`) to PDF with the Google Drive connector → `content/cv/Hamza_Atiq_CV.pdf`; `cv_reviewed_by_hamza: 2026-10-24` (Hamza confirmed). Do not edit or re-judge the CV. If the PDF shows a phone number or home address, that alone is raised with Hamza once (constitution 8) before committing it.
- `link_check_skip.yml`: `https://www.linkedin.com/` with `checked_by_hamza` left for Task 14. `sources.yml`: empty list.
- Every item `status: draft` with no `reviewed_by_hamza`; profile/interests/skills have no file date yet. Task 14 sets dates and `published` after Hamza's one preview review.

- [ ] **Step 1:** Write the files.
- [ ] **Step 2:** `cd checker && python -m portfolio_checker --content ../content --site ../site --repo .. --mode push --include-drafts` → exit 0, zero errors; the only allowed warning is the LinkedIn skip-link date.
- [ ] **Step 3:** Same command without `--include-drafts` → exit 1 with `profile.yml … has no reviewed_by_hamza date` — proves nothing unreviewed can go public.
- [ ] **Step 4:** Commit `content: first real content (all draft until Hamza's review)`.

### Task 9: Next.js base, theme and photo

**Files:** Create `site/` (Next.js App Router, TypeScript, no Tailwind — plain CSS modules + `app/globals.css` with the §6 tokens), `site/lib/content.ts`, `site/lib/theme-script.ts`, `site/components/{ThemeToggle,Photo}.tsx`, `site/app/layout.tsx`; Test `site/tests/content.test.ts`, `site/tests/theme-script.test.ts` (Vitest + jsdom)

**Interfaces:**
- Consumes: `site/data/content.json` (Task 6 shape; run the checker with `--include-drafts` before `npm run build`). For tests, run the CLI on `checker/tests/fixtures/good` with `--skip-network` and save its JSON as `site/tests/fixture-content.json` (committed).
- Produces: `lib/content.ts` with TypeScript types mirroring the JSON (`Profile, NewsItem, Project, TeachingItem, Award, SkillGroup, SearchEntry, Bundle`) and `getBundle(): Bundle`, `getProject(slug: string): Project | undefined`. `lib/theme-script.ts` exports `THEME_SCRIPT: string` (inline in `<head>` before paint) and `export function pickTheme(stored: string | null, prefersDark: boolean | null): "dark" | "light"`.

Theme (FR-18): stored choice wins; else device setting; else dark. Script sets `document.documentElement.dataset.theme`; every `localStorage` access in `try/catch`. It is placed as an inline `<script>` first in `<head>` of `app/layout.tsx`, with `suppressHydrationWarning` on `<html>`. CSS uses `:root[data-theme="dark"]` / `[data-theme="light"]`. Photo (FR-19): both images rendered with `next/image` (`priority`), round via `border-radius: 50%`, shown/hidden by theme in CSS; dark has graphite + amber glow ring, light warm cream.

- [ ] **Step 1: Failing tests:** `pickTheme`: `("light", true) → "light"`, `(null, false) → "light"`, `(null, true) → "dark"`, `(null, null) → "dark"`; `theme-script.test.ts: works when localStorage throws` (eval script with throwing storage + `matchMedia` light → `data-theme="light"`, no exception); `content.test.ts`: `getProject("p013-grid-contingency")` defined, unknown slug → undefined.
- [ ] **Step 2:** `cd site && npx vitest run` → FAIL. **Step 3:** Implement. **Step 4:** → PASS; `npm run build` succeeds.
- [ ] **Step 5:** Commit `site: base layout, theme and photo`.

### Task 10: Main page sections

**Files:** Create `site/app/page.tsx`, `site/components/{About,News,Interests,ProjectList,ProjectCard,Teaching,Awards,Skills,Contact,SectionTitle}.tsx`; Test `site/tests/page.test.tsx` (Testing Library)

**Interfaces:** Consumes `getBundle()`. Produces `ProjectCard({project}: {project: Project})` (reused in Task 11 links) and `SectionTitle({id, children})` rendering `## <children>`.

Rules from spec §4: order About → News → Research interests → Research projects → Hackathon projects → Teaching & mentoring → Awards & competitions → Skills → CV & Contact (ids `about, news, interests, research, hackathons, teaching, awards, skills, contact`). Empty section hidden, except Hackathon projects which shows exactly `Hackathon projects are added one by one after review.` when empty. News shows 6; a native `<details>` "show all" holds the rest. Interest chips in About link to `#interests`. Project filter chips only when that section has ≥ 4 projects, client-side by tag. Awards: main list, then "Other international competitions" list. Each claim has a small `proof ↗`/`code ↗` link. Cards: hover/focus lift + amber glow, none under reduced motion. About buttons: Download CV, GitHub, LinkedIn, Email; CV & Contact adds LeetCode, lablab, Devpost (all from `profile.links`). Project covers all use one shape (16:9, `object-fit: cover`). Teaching items show each video's YouTube thumbnail (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`, allowed in `next.config` `images.remotePatterns`) linking to the video; awards whose proof is an image file show a small thumbnail that opens the full file (§6). Download CV button only when `profile.cv_file` is not null. The English-test line is shown only when `english_test.url` is set (constitution 1: no claim without its proof link; spec §13). Email shown as text + `mailto:` (FR-25). A project without a cover shows a plain text card, no placeholder image (§9). Long project summary clamped to 3 lines with "read more" to the project page.

- [ ] **Step 1: Failing tests:** `sections_in_spec_order` (ids in DOM order), `empty_section_hidden` (no teaching items → no `#teaching`), `hackathon_placeholder_shown`, `news_shows_six_then_more` (8 items → 6 visible outside `<details>`), `chips_only_with_four_projects` (3 → none, 4 → chips), `cv_button_hidden_when_null`, `english_line_hidden_without_url`, `card_without_cover_has_no_img`, `awards_other_list_after_main`, `teaching_shows_video_thumbnails` (img src contains the video id), `image_proof_has_thumbnail`.
- [ ] **Step 2–4:** FAIL → implement → PASS; `npm run build` ok.
- [ ] **Step 5:** Commit `site: main page sections`.

### Task 11: Project pages and share previews

**Files:** Create `site/app/projects/[slug]/page.tsx`; Test `site/tests/project-page.test.tsx`

**Interfaces:** Consumes `getProject`, `getBundle`. `generateStaticParams()` from `bundle.projects`; unknown slug → `notFound()`. `generateMetadata` (and root layout metadata) sets title, one-line description and `openGraph.images` = project cover or the dark photo (FR-20); `metadataBase` from env `SITE_URL`.

Page shows (spec §4): title, tags, date, `solo`/`team of N`, my role, summary, body Markdown (problem, method, results with how measured, limits) rendered with `react-markdown` (no raw HTML), images with alt, links (code, demo, video, proof).

- [ ] **Step 1: Failing tests:** `renders_p013_fields` (title, "solo", result text present), `markdown_raw_html_not_rendered` (`<script>` in body appears as text, no script element), `metadata_has_og_image`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `site: project pages and share previews`.

### Task 12: Search

**Files:** Create `site/lib/search.ts`, `site/app/api/search/route.ts`, `site/components/SearchBox.tsx`; Test `site/tests/search.test.ts`

**Interfaces:**
- Produces: `localSearch(index: SearchEntry[], q: string, limit = 10): SearchEntry[]` (case- and accent-insensitive, all words must match title or text); `GET /api/search?q=` → `{source: "db" | "local", results: SearchEntry[]}`.
- Route: if `DATABASE_URL` set, query Neon (`@neondatabase/serverless`) with `websearch_to_tsquery('english', $1)`, limit 10, raced against a 2000 ms timer (FR-17); on timeout/error/no URL → `localSearch` over the bundled index. `q` trimmed, max 100 chars, empty → empty results. SearchBox calls the route; if fetch fails it runs `localSearch` in the browser.

- [ ] **Step 1: Failing tests:** `local_search_all_words`, `local_search_ignores_case_and_accents`, `route_falls_back_after_2s` (mock db promise that never resolves, fake timers → `source: "local"`), `route_empty_query`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `site: search with built-in fallback`.

### Task 13: Deploy pipeline (GitHub Actions + Vercel + Neon)

**Files:** Create `.github/workflows/check-and-deploy.yml`, `site/vercel.json` (`{"git": {"deploymentEnabled": false}}`), `README.md` (simple English: how Hamza adds a news line or project, uses the `preview` branch, and undoes a change with `git revert` or Vercel "Instant Rollback", spec §3 scenario 6). The Vercel project is created from the CLI and is **not** connected to the GitHub repo, so the only way to deploy is the Action (FR-13); `deploymentEnabled: false` is a second lock.

Workflow (FR-7, FR-9–FR-14):
- Triggers: `push` to `main` and `preview`; `schedule` daily `cron: "0 3 * * *"`; `workflow_dispatch`.
- Job: checkout → Python 3.12 + `pip install -r checker/requirements.txt` → `python -m pytest checker -q` → run checker (`--mode daily` on schedule, else `push`; `--include-drafts` on `preview`) → if exit 1, stop (old site stays).
- Daily run: compare new hash with `curl -fsS $SITE_URL/content-hash.txt`; equal → stop with "nothing changed".
- `main` only: `--sync-db` with `secrets.DATABASE_URL`.
- Node 20 → `npm ci` in `site` → `npx vitest run` → (in `site/`) `npx vercel@<pinned> pull --yes --environment=production|preview --token $VERCEL_TOKEN` → `vercel build [--prod]` → `vercel deploy --prebuilt [--prod]`. GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`; variable `SITE_URL`. Vercel env: `DATABASE_URL` (production only, added by the Neon integration), `SITE_URL`.
- Preview deploys stay private with Vercel's default Deployment Protection (Vercel login needed; Hamza is the owner); they never touch the DB.

Outward-facing steps (do each only with Hamza's OK in the same session, one combined question): create public GitHub repo `Hamza-Atiq/portfolio` and push; create Vercel project (name `hamza-atiq` or nearest free, spec §8) and token; create Neon free project via Vercel integration and run `checker/schema.sql`; add secrets.

- [ ] **Step 1:** Write workflow, `vercel.json`, README. Validate YAML with `python -c "import yaml,sys;yaml.safe_load(open('.github/workflows/check-and-deploy.yml'))"`.
- [ ] **Step 2:** Run the full checker + `npm run build` locally → both pass; `python -m portfolio_checker` secret scan clean on the whole repo.
- [ ] **Step 3:** Commit `ci: check-and-deploy pipeline`.
- [ ] **Step 4:** With Hamza's OK: create repo, push, set up Vercel + Neon + secrets.
- [ ] **Step 5:** Push to `preview` → Action green → private preview link shows the draft content.

### Task 14: Acceptance check and go-live

**Files:** Create `site/e2e/acceptance.spec.ts` (Playwright; `BASE_URL` = local `npm start` before go-live, the production URL after). The protected preview link cannot be opened by robots, so robots test locally and Hamza looks at the preview.

- [ ] **Step 1: e2e tests** for spec §11: `no_sideways_scroll_360_and_1440` (`scrollWidth <= clientWidth`), `sections_order`, `light_device_opens_light` / `dark_device_opens_dark` (Playwright `colorScheme`; an `addInitScript` records `data-theme` at `DOMContentLoaded`, before images paint, and it must already be right), `toggle_remembered_after_reload`, `photo_changes_with_theme`, `p013_page_opens`, `tap_targets_44px` (every `button`, filter chip and About/Contact button ≥ 44 × 44; inline `proof ↗` text links are exempt as WCAG 2.5.8 allows), `draft_not_on_public` (production bundle).
- [ ] **Step 2:** Run e2e locally on the drafts build → PASS. Lighthouse mobile: `npx lighthouse@<pinned> $BASE_URL --only-categories=performance,accessibility --form-factor=mobile --output=json` → Performance ≥ 90, Accessibility ≥ 90, LCP ≤ 2.5 s; fix and re-run until true.
- [ ] **Step 3: Broken-file test:** commit to `preview` a team project with empty `my_role`, a dead link and an unlisted proof file → Action red with the three simple messages and no deploy; the public site is untouched. Revert that commit. (`main` runs the same job, so the same refusal protects the public site.)
- [ ] **Step 3b: Database-off test:** locally run `npm start` with `DATABASE_URL=postgresql://u:p@127.0.0.1:9/x` (nothing listening) → every page loads and `/api/search?q=grid` answers `source: "local"` with P-013.
- [ ] **Step 4: Hamza's single review:** send Hamza the preview link once. He reads the page; any sentence he changes is edited in `content/`. On his go: set `reviewed_by_hamza` (his date) and `status: published` on every item, set LinkedIn `checked_by_hamza`, push to `main`.
- [ ] **Step 5: Live checks:** production Action green; e2e + Lighthouse again on the production URL; add one test news item and push → visible within 5 minutes → remove it. Tick spec §11 boxes, `_portfolio_journey/HANDOVER.md`, `01_session_log.md`. Commit `v1 live`.

---

## Spec coverage map

FR-1 T1/T8 · FR-2 T5 · FR-3 T6 · FR-4 T2 · FR-5 T6 · FR-6 T2 · FR-7 T13 · FR-8 T1–T4 · FR-9 T6/T13 · FR-10 T7/T13 · FR-11 T7 · FR-12 T3/T13 · FR-13 T13 · FR-14 T13 · FR-15 T9–T11 · FR-16 T10 · FR-17 T12 · FR-18 T9/T14 · FR-19 T9 · FR-20 T11 · FR-21 T10 · FR-22 T10/T14 · FR-23 T9 (`next/image`) · FR-24 T6/T8/T10 · FR-25 T10 · §6 T9/T10 · §9 edge cases T2/T5/T7/T10/T12 · §11 T14.

## Self-review log (2026-10-24, 4 passes against spec v4, constitution and spec §14 research)

1. Drafts vs "published needs a date" clashed in Task 8 → all content starts as `draft`; file-level dates required only in production (Task 2 rule 2).
2. Dates: `YearMonth` accepts year / month / full date (proofs often show only a month); YAML date objects handled.
3. Robots can't open the protected preview → e2e and Lighthouse run locally, then on production (Task 14).
4. Database-off test moved to local (no fiddling with production env).
5. LCP ≤ 2.5 s target added (research §14); photo resized to 480 px so the first paint is fast.
6. Duolingo line shown only with its official link (constitution 1).
7. Vercel not connected to GitHub at all, so only the checker can deploy (FR-13); `vercel.json` moved into `site/`.
8. Drafts can never reach the database (`--sync-db` + `--include-drafts` refused).
9. Nothing is written when the check fails, including downloaded images (temp folder).
10. Link errors tell Hamza how to handle sites that block robots.
11. Secret scan works on non-git test folders; YouTube thumbnails, certificate thumbnails, same-shape covers and the exact About/Contact buttons added (spec §4, §6).
12. Teaching numbers only as counted from the video list (no "20+").
13. Smaller fixes: link keys limited, search `text`→`body`, README covers undo, commit before push, file paths consistent.
