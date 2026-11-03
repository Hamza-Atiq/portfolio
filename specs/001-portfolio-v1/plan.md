# Portfolio v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Hamza's portfolio website as a system: content files → Python checker → Neon copy + Next.js site on Vercel, with P-013 as the first project.

**Architecture:** All content lives in `content/` (git = master copy). A Python checker (`checker/`) reads and checks it, pulls `portfolio.yml` from listed public repos, and writes ONE file, `site/data/content.json` (plus copied images/proofs). The Next.js site in `site/` builds every page from that JSON (no database needed for pages). After a passing check, GitHub Actions syncs Neon Postgres (search only) and deploys to Vercel with `vercel deploy --prebuilt`; Vercel's own git deploy is off.

**Tech Stack:** Python 3.12 (pydantic v2, PyYAML, httpx, psycopg 3, pytest) · Node 20 + Next.js (App Router, TypeScript) + `@neondatabase/serverless` · Vitest + Playwright · GitHub Actions · Vercel Hobby · Neon free.

**Spec:** `specs/001-portfolio-v1/spec.md` (v5, launch fixes answered 2026-11-03) and `specs/constitution.md`. Read both before any task.

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
      notify.py       # issue and keepalive decisions for the workflow
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

### Task 0: Private GitHub repo (done on Hamza's computer, approved by Hamza 2026-11-03)

- [ ] **Step 1:** Commit the specs. Create `Hamza-Atiq/portfolio` as a **private** repo, push `main`, and create a `preview` branch from it.
- [ ] **Step 2:** Hamza installs the Claude GitHub App on this repo if a cloud session asks for it. The repo stays private until Task 13.

### Task 1: Content models and loader

**Files:**
- Create: `checker/requirements.txt`, `checker/pyproject.toml`, `checker/portfolio_checker/{__init__,models,load}.py`, `.gitignore`
- Test: `checker/tests/test_load.py`, `checker/tests/fixtures/good/` (a full small valid `content/` copy, including two tiny test photos and a test cover made by the test setup code, never Hamza's real photo), `checker/tests/fixtures/bad/`

**Interfaces:**
- Produces:
  - `class Problem(BaseModel): file: str; message: str` and `class Report: errors: list[Problem]; warnings: list[Problem]; def ok(self) -> bool`
  - Models (pydantic v2, `extra="forbid"`, strict str fields — YAML bools in text fields are errors):
    - `Link {label: Literal["code","demo","video","proof","paper"]; url: HttpUrl}`
    - `Image {src: str; alt: str (min 3 chars)}` — `src` relative to `content/`, forward slashes only
    - `SafePath`: used for every path in a content file (`Image.src`, `ProofFile.file`, `Profile.cv_file`). Refuses an absolute path, a drive letter, `..` and `\`.
    - `Slug`: every `slug` must match `^[a-z0-9][a-z0-9-]*$`, so a slug can never change a folder path.
    - `YearMonth`: `YYYY`, `YYYY-MM` or `YYYY-MM-DD` that is a real date (some proofs show only a year or month). YAML turns a full `2026-10-24` into a `date` object and leaves `2026-10` as text, so accept both and store as text.
    - `Profile {name, tagline, summary: str; photo_dark: Image; photo_light: Image; email: EmailStr; links: dict[Literal["github","linkedin","leetcode","lablab","devpost"], HttpUrl]; english_test: {text: str; url: HttpUrl | None}; cv_file: str | None; cv_reviewed_by_hamza: date | None; reviewed_by_hamza: date | None}`
    - `Interest {slug, label, sentence: str}`; file = `{reviewed_by_hamza: date | None, items: list[Interest]}`
    - `NewsItem {slug, text: str; date: YearMonth; link: Link; status: Literal["draft","published"]; reviewed_by_hamza: date | None; pin: int | None}`
    - `Project` = header of spec §7 + `body: str` (Markdown after the header): `title, subtitle, slug, summary, result: str; kind: Literal["research","hackathon"]; status; reviewed_by_hamza: date|None; date: YearMonth; tags: list[str]; team: str ("solo" or r"team of ([2-9]|[1-9]\d+)"); my_role: str | None = None; cover: Image|None; images: list[Image] = []; links: dict[Literal["code","demo","video","proof","paper"], HttpUrl]; proofs: list[str] = []; pin: int|None`
    - `TeachingItem {slug, title, org, role, text: str; date: YearMonth; videos: list[{title: str, url: HttpUrl}]; status; reviewed_by_hamza; pin}`
    - `Award {slug, text: str; date: YearMonth; group: Literal["main","other"]; proof_url: HttpUrl; proof_id: str|None; status; reviewed_by_hamza; pin}` — `proof_url` is required (the CV link); `proof_id` is an optional extra proof file shown beside it
    - `SkillGroup {name: str; items: list[str]}`; file = `{reviewed_by_hamza: date | None, groups: list[SkillGroup]}`
    - `ProofFile {id, file, note: str; private_info_checked: bool}`
    - `SkipLink {url: HttpUrl; checked_by_hamza: date | None}`; `Source {repo: str (pattern "Owner/name")}`
  - `class Content(BaseModel)`: `profile, interests, news, projects, teaching, awards, skills, proofs, skip_links, sources`
  - `def load_content(root: Path) -> tuple[Content | None, Report]` — never raises on bad content; every problem becomes a `Problem` naming the file (and item number/slug).

- [ ] **Step 1: Write failing tests** in `test_load.py`:
  - `test_good_fixture_loads`: `content, r = load_content(FIX/"good")` → `r.ok()` and `content.projects[0].slug == "p013-grid-contingency"`.
  - `test_bad_date_message`: fixture with `reviewed_by_hamza: 2026-13-01` → one error, `file == "content/news.yml"` (paths in `Problem.file` always start at the repo root), message contains `"is not a real date"`.
  - `test_month_only_date_ok`: project `date: 2026-10` loads.
  - `test_yaml_bool_in_text_refused`: `text: no` → error containing `"put it in quotes"`.
  - `test_unicode_survives_round_trip`: award text `"M(IT)² rank 482 × 559 → ok"` equals after load and `model_dump_json` → `json.loads`.
  - `test_crlf_file_loads`: good fixture file rewritten with `\r\n` loads with no error.
  - `test_unsafe_paths_refused`: `../secret.png`, `/etc/passwd` and `C:/x.png` in an image, proof `file` and `cv_file` → each one error.
  - `test_bad_slug_refused`: slug `../x` → error naming `slug`.
  - `test_missing_required_field`: project without `summary` → message `"summary is missing"`.
  - `test_my_role_optional`: a `team of 3` project without `my_role` loads with no error.
  - `test_bad_team_form`: `team: "team of 1"` → error naming `team`.
- [ ] **Step 2:** `cd checker && python -m pytest tests/test_load.py -q` → FAIL (module not found).
- [ ] **Step 3:** Implement models and `load_content` (`requirements.txt`: pydantic, email-validator, PyYAML, httpx, psycopg[binary], pytest). Translate pydantic errors into one simple sentence each (`missing` → "`<field>` is missing", `date_from_datetime_parsing`/`date_parsing` → "`<value>` is not a real date (use YYYY-MM-DD)", bool-in-str → "`<field>` looks like yes/no; put it in quotes"). YAML read with `yaml.safe_load`; Markdown header split on the first two `---` lines.
- [ ] **Step 4:** Run tests → PASS.
- [ ] **Step 5:** Commit `checker: content models and loader`.

### Task 2: Cross-file rules

**Files:** Create `checker/portfolio_checker/rules.py`; Test `checker/tests/test_rules.py`

**Interfaces:**
- Consumes: `Content`, `Report`, `Problem` (Task 1).
- Produces: `def check_rules(content: Content, root: Path, today: date, include_drafts: bool) -> Report`

Rules (spec FR-4, FR-8, §9; the FR-6 `team` form is checked by the Task 1 model):
1. No two items of the same kind share a `slug`.
2. `published` without `reviewed_by_hamza` → error in both modes (`"is published but has no reviewed_by_hamza date"`). `profile.yml`, `interests.yml`, `skills.yml` without their file date → error when `include_drafts` is false (production), allowed on preview (so Hamza can review them there first).
3. Every `proof_id` and every project `proofs[]` id exists in `proofs.yml`; that entry has `private_info_checked: true`; its `file` exists under `content/`, and after `Path.resolve()` (which follows links) it is still inside `content/`. The same inside-`content/` test applies to images and the CV. Every file in `content/proofs/` and `content/cv/` is listed (unlisted → error).
4. Every image `src`: no `\` (`"use / in paths"`), file exists under `content/`, size ≤ 2 MB (2 × 1024 × 1024 bytes). Paths starting with `/c/sources/` were already checked by Task 5 with this same size and path test, and are skipped here. Only `pull_sources` can produce such a path: a local file whose `src` starts with `/` is already refused by `SafePath`.
5. `profile.cv_file` set → file exists and is listed in `proofs.yml` with `private_info_checked: true`.
6. `SkipLink.checked_by_hamza` older than 90 days from `today` → **warning** `"re-check this link by hand"`. No date yet → warning when `include_drafts` is true, error in production.

- [ ] **Step 1: Failing tests**, one per rule, each building `Content` from the good fixture then breaking one thing: `test_duplicate_slug`, `test_published_needs_review_date`, `test_profile_date_needed_only_in_production`, `test_unknown_proof_id`, `test_proof_not_privacy_checked`, `test_unlisted_proof_file`, `test_backslash_image_path`, `test_symlink_out_of_content_refused`, `test_image_over_2mb` (write a 2 MB + 1 byte temp file), `test_skip_link_older_than_90_days_warns` (date 91 days back → warning, 90 days → nothing), `test_skip_link_no_date_warns_on_drafts_errors_in_production`.
- [ ] **Step 2:** `python -m pytest tests/test_rules.py -q` → FAIL.
- [ ] **Step 3:** Implement `check_rules`.
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5:** Commit `checker: cross-file rules`.

### Task 3: Link checker

**Files:** Create `checker/portfolio_checker/links.py`; Test `checker/tests/test_links.py` (use `httpx.MockTransport`, no real network)

**Interfaces:**
- Consumes: `Content`, `Report`.
- Produces: `def all_links(content: Content) -> list[tuple[str, str]]` (file, url; every structured link plus every `http(s)` link in a project's Markdown `body`, using a Markdown parser so that code blocks are ignored) and `def check_links(content: Content, mode: Literal["push","daily"], client: httpx.Client | None = None) -> Report`

Behaviour: for each unique URL that does not exactly equal a `skip_links[].url`: HEAD; if status is 403/405/429 or error, GET with User-Agent `Mozilla/5.0 (portfolio link check)`; good = final status < 400 after redirects; 3 tries with 1 s, 2 s waits; timeout 10 s; up to 8 at a time. Broken → error in `push` mode, warning in `daily` mode (FR-12). The message ends with: `If this site blocks robots (it opens fine in your browser), add it to content/link_check_skip.yml.`

- [ ] **Step 1: Failing tests:** `test_ok_link_passes`, `test_markdown_body_link_is_checked`, `test_404_is_error_on_push`, `test_404_is_warning_on_daily`, `test_head_405_falls_back_to_get` (HEAD 405, GET 200 → ok), `test_skip_url_not_fetched` (transport asserts it is never called for a listed LinkedIn URL), `test_similar_url_still_checked` (the same URL with one changed letter is fetched), `test_retries_three_times` (two 503 then 200 → ok; patch sleep).
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

Behaviour (FR-2, §9): fetch `https://raw.githubusercontent.com/{repo}/HEAD/portfolio.yml`; parse with the same `Project` model (body comes from its `body:` field). Image `src` paths are inside that repo: download `https://raw.githubusercontent.com/{repo}/HEAD/{src}` to `site_public/c/sources/{slug}/{hash}-{basename}` (`hash` = the first 12 letters of the sha256 of `src`, so two images with one name in different folders cannot overwrite each other) and rewrite `src` to the final web path `/c/sources/{slug}/{hash}-{basename}` (Task 6 leaves paths that start with `/c/` unchanged). Pulled projects then go through the same Task 2 rules (slugs, team, review date) as local ones. The repo or its `portfolio.yml` answers 404 (private, deleted or renamed) → **warning** naming the repo, project skipped, rest continues (spec §9). A bad file is an **error** in every mode, so nothing deploys and the old site keeps the project (FR-9): invalid YAML or fields, or a failed `Slug`, `SafePath` or `alt` rule (all checked before any download), or an image over 2 MB (each download stops as soon as it passes 2 MB). Any other failure after 3 tries (5xx, timeout), or a listed image that cannot be downloaded, is also an **error**, so a short GitHub outage cannot remove a project. The download must land inside `site_public/c/sources/{slug}/`. Downloads go only to the temp folder of Task 6.

- [ ] **Step 1: Failing tests:** `test_pulls_project_and_image`, `test_same_name_images_do_not_collide`, `test_missing_repo_is_warning_not_error`, `test_bad_portfolio_yml_is_error`, `test_big_image_is_error`, `test_source_image_without_alt_is_error`, `test_source_unsafe_path_is_error`, `test_source_bad_slug_is_error`, `test_outage_is_error_not_skip`.
- [ ] **Step 2–4:** FAIL → implement → PASS.
- [ ] **Step 5:** Commit `checker: pull projects from public repos`.

### Task 6: Build output and CLI

**Files:** Create `checker/portfolio_checker/{build,__main__}.py`; Test `checker/tests/test_build.py`, `checker/tests/test_cli.py`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces:
  - `def build_bundle(content: Content, include_drafts: bool) -> dict` — JSON shape below.
  - `def write_site(bundle: dict, content_root: Path, site_root: Path) -> str` — writes `site/data/content.json` (UTF-8, `ensure_ascii=False`, sorted keys), copies used images/proof files/CV into `site/public/c/<same relative path>`, writes `site/public/content-hash.txt`; returns the hash (sha256 of the JSON text, without `generated_at`).
  - CLI: `python -m portfolio_checker --content ../content --site ../site --repo .. --mode push|daily [--include-drafts] [--skip-network] [--sync-db] [--problems-file PATH]` → runs load → sources → rules → links → secret scan of `--repo` → build; prints errors then warnings (`ERROR content/news.yml: …`, `WARNING …`), exit 1 on any error and writes nothing (all output, including Task 5 downloads, goes to a temp folder that is moved into `site/` only after every check passed); exit 0 otherwise. `--skip-network` skips Tasks 3 and 5 (local tests only). `--problems-file` writes every error and warning line to that path, even on exit 1, for the FR-26 issue; the path must be outside `site/`.
  - `content.json` shape: `{"hash", "generated_at", "include_drafts", "profile", "interests": [...], "news": [...], "projects": [...], "teaching": [...], "awards": {"main": [...], "other": [...]}, "skills": [...], "search_index": [{"kind": "project"|"award"|"news"|"teaching", "slug", "title", "text", "url"}]}`. Asset paths are rewritten to `/c/...`; proof ids are resolved to `{"label":"proof","url":"/c/proofs/..."}`. Only assets used by the bundle are copied. `cv_file` is `null` in the bundle unless `cv_reviewed_by_hamza` is set (FR-24).
- Sorting (FR-5): items with `pin` first by pin ascending, then by date newest first (partial dates compared as (year, month or 0, day or 0)), then slug.

- [ ] **Step 1: Failing tests:** `test_drafts_hidden_by_default`, `test_drafts_shown_with_flag`, `test_sort_pin_then_newest`, `test_awards_split_main_other`, `test_cv_hidden_without_review_date`, `test_hash_ignores_generated_at`, `test_cli_exit_1_and_writes_nothing_on_error` (bad fixture, `site/data/content.json` absent afterwards), `test_cli_good_fixture_exit_0` (`--skip-network`), `test_problems_file_written_on_failure`.
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
- Awards: spec §4.1 wording exactly; first six `group: main`, Meta/M(IT)²/HackerRank `group: other`; every award uses `proof_url` with its exact link from `_portfolio_journey/cv_review_2026-10-17.md` §7 (same links as the CV, Hamza 2026-11-01). Hamza is not asked for any proof. Two files he already gave are added as `proof_id`, because the CV link alone does not show the rank in the wording: CALICO `proofs/certificates/berkeley_calico_spring26_team_eagle3.jpeg` (global #269 of 375) and GIKI `proofs/competitions/giki_kaggle_leaderboard_rank10.png` (10th place). So `proofs.yml` lists these two and the CV, each with `private_info_checked: true` after opening it (both images checked 2026-11-03: no private data), and these two awards show a thumbnail.
- Teaching: `_portfolio_journey/proofs/teaching/youtube_lectures.md` — 3 items (iCodeGuru DSA + IELTS volunteer instructor; Basics of Claude Code workshop Apr 2026; MIT Informatics Tournament Spring 2026 solver + helped prepare others) with their video links. No view counts. A session count is written only as counted from the video table at write time (no "20+" unless the table shows 20+).
- P-013: facts from its README in `D:\USA Journey\Projects\P-013-grid-contingency-screening` (read only) and spec §7; cover = copy of its `docs/img/live-page.png` (resize below 2 MB if needed).
- News (latest first): P-013 published (Oct 2026, code link) plus one line per main award with its proof link; dates from the proof pages.
- Skills: groups Programming / ML / Power systems / Tools; a skill is listed only if P-013 or an audited project (`_portfolio_journey/audits/`) uses it.
- Photo: `_portfolio_journey/assets/photo/hamza_graphite_amber_glow.png` → `content/photo/hamza_dark.png`, `hamza_warm_cream.png` → `content/photo/hamza_light.png`, each cropped square around the face and resized to 480 × 480 px (small file → fast first paint; the round mask hides the arm edge mark, FR-19).
- CV: export the Google Doc "Hamza CV EE" (id `1ovWmHI0XoiDLnON5IrgkhzPMj4cCBCTxdml9SMwvXTU`) to PDF with the Google Drive connector → `content/cv/Hamza_Atiq_CV.pdf`; `cv_reviewed_by_hamza: 2026-10-24` (Hamza confirmed). Do not edit or re-judge the CV. If the PDF shows a phone number or home address, that alone is raised with Hamza once (constitution 8) before committing it.
- `link_check_skip.yml`: one entry per exact LinkedIn URL used by the site (Hamza's profile and the five award posts in §7), each with `checked_by_hamza` empty until Task 14. `sources.yml`: empty list.
- Every item `status: draft` with no `reviewed_by_hamza`; profile/interests/skills have no file date yet. Task 14 sets dates and `published` after Hamza's one preview review.

- **Files that exist only on Hamza's computer:** the photo files and the P-013 README and cover are on `D:`. This task runs on Hamza's computer, not in the cloud (see "Where each task runs").

- [ ] **Step 1:** Write the files.
- [ ] **Step 2:** `cd checker && python -m portfolio_checker --content ../content --site ../site --repo .. --mode push --include-drafts` → exit 0, zero errors; the only allowed warnings are the empty LinkedIn skip-link dates.
- [ ] **Step 3:** Same command without `--include-drafts` → exit 1 with `profile.yml … has no reviewed_by_hamza date` (and the empty skip-link dates) — proves nothing unreviewed can go public.
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

**Files:** Create `site/app/projects/[slug]/page.tsx`, `site/app/robots.ts`, `site/app/sitemap.ts`, `site/app/not-found.tsx`, `site/app/icon.svg`; Test `site/tests/project-page.test.tsx`, `site/tests/seo.test.ts`

**Interfaces:** Consumes `getProject`, `getBundle`. `generateStaticParams()` from `bundle.projects`; unknown slug → `notFound()`. `generateMetadata` (and root layout metadata) sets title, one-line description and `openGraph.images` = project cover or the dark photo (FR-20); `metadataBase` from env `SITE_URL`.

Page shows (spec §4): title, tags, date, `solo`/`team of N`, my role (only when given), summary, body Markdown (problem, method, results with how measured, limits) rendered with `react-markdown` (no raw HTML), images with alt, links (code, demo, video, proof).

Search engines and small pages (FR-28–FR-30): `robots.ts` and `sitemap.ts` decide from `bundle.include_drafts`, not from an environment guess. `include_drafts: false` → allow all, name `${SITE_URL}/sitemap.xml`; the sitemap lists `/` and each `/projects/<slug>`. `include_drafts: true` → `Disallow: /`, an empty sitemap, and root metadata `robots: {index: false}`. Root metadata adds `verification.google` from the env variable `GOOGLE_SITE_VERIFICATION` when set. It is a technical setting, not content Hamza reviews, so it stays out of `content/`. `not-found.tsx` shows `## page not found` and a link to `/`, in the normal layout. `icon.svg` is an amber `~` drawn as a path (no font needed) on graphite.

- [ ] **Step 1: Failing tests:** `renders_p013_fields` (title, "solo", result text present), `role_hidden_when_absent`, `markdown_raw_html_not_rendered` (`<script>` in body appears as text, no script element), `metadata_has_og_image`, `unknown_project_calls_not_found`, `robots_public_allows_and_names_sitemap`, `robots_drafts_disallow`, `sitemap_lists_home_and_projects`, `sitemap_empty_for_drafts`, `google_verification_only_when_set`.
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

**Files:** Create `.github/workflows/check-and-deploy.yml`, `checker/portfolio_checker/notify.py`, `checker/tests/test_notify.py`, `.github/keepalive.txt`, `site/vercel.json` (`{"git": {"deploymentEnabled": false}}`), `README.md` (simple English: how Hamza adds a news line or project, uses the `preview` branch, and undoes a change with `git revert` or Vercel "Instant Rollback", spec §3 scenario 6). The Vercel project is created from the CLI and is **not** connected to the GitHub repo, so the only way to deploy is the Action (FR-13); `deploymentEnabled: false` is a second lock.

Workflow (FR-7, FR-9–FR-14):
- Triggers: `push` to `main` and `preview`; `schedule` daily `cron: "0 3 * * *"`; `workflow_dispatch` with a boolean input `test_keepalive` (default false).
- Permissions: `contents: write`, `issues: write`, nothing else.
- Concurrency: `group: check-and-deploy-${{ github.ref }}`, `cancel-in-progress: false`. Runs of one branch go one at a time, so an older commit cannot finish last and replace a newer one. `main` and `preview` do not block each other.
- Every step that can fail has an `id` (`checker_tests`, `checker`, `site_tests`, `deploy`). Job: checkout → Python 3.12 + `pip install -r checker/requirements.txt` → with `working-directory: checker`: `python -m pytest -q`, then `python -m portfolio_checker --content ../content --site ../site --repo .. --problems-file $RUNNER_TEMP/problems.txt` (`--mode daily` on schedule, else `push`; `--include-drafts` on `preview`; `--sync-db` on every `main` run, including daily ones) → if exit 1, every database, build and deploy step is skipped (each has `if: success()`, so the old site stays), and the job ends red after the two final steps.
- Daily run: compare new hash with `curl -fsS $SITE_URL/content-hash.txt`; equal → skip the deploy steps with "nothing changed"; if the fetch fails or the file is missing, treat it as changed and deploy. This must not end the job early, because the two final steps below always run.
- `secrets.DATABASE_URL` is given to the checker step on `main` only. The sync runs daily even when the hash is equal, so a sync that failed earlier is retried until it works (FR-11).
- Node 20 → `npm ci` in `site` → `npx vitest run` → in `site/`, on `main`: `npx vercel@<pinned> pull --yes --environment=production --token $VERCEL_TOKEN`, `npx vercel@<pinned> build --prod --token $VERCEL_TOKEN`, `npx vercel@<pinned> deploy --prebuilt --prod --token $VERCEL_TOKEN`; on `preview`: the same three with `--environment=preview` and without `--prod`. The plan uses no branch-specific Vercel variables, so a preview deploy needs only Vercel's Preview environment. `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are set as env variables on the Vercel steps. GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`; variable `SITE_URL`. Vercel env: `DATABASE_URL` (Production only, added by the Neon integration), `SITE_URL`. Neon setup (FR-14): untick **Preview** and Development in the integration's environment choices. It may add several database variables (for example `DATABASE_URL_UNPOOLED`, `PGHOST`, `PGPASSWORD`); none of them may be in Preview.
- Final step A, issue (FR-26), `if: always()`, with `env: GH_TOKEN: ${{ github.token }}` so that `gh` can log in: build the list of failed steps from each `steps.<id>.outcome`; if `job.status` is `failure` and no named step failed, add `a setup step failed`, so a failed checkout or install still counts. Then call `notify.py` with the event, the branch, the `--problems-file` lines (an empty list if the file is missing), the failed steps and the open issue number found with `gh issue list --state open --search '"Site check needs attention" in:title'`. Then run what it returns: `gh issue create --title "Site check needs attention" --assignee Hamza-Atiq`, `gh issue edit`, or `gh issue close`. Runs of the `preview` branch do nothing. If this step itself fails, the job shows red, so GitHub's normal failure email still goes out.
- Final step B, keepalive (FR-27), `if: always()`, also after a failed check, on `schedule` or when `test_keepalive` is true, and only on `main`: read the newest commit date with `git log -1 --format=%cs`. If `keepalive_needed(...)` is true or `test_keepalive` is true, write today's date to `.github/keepalive.txt`, commit as `github-actions[bot]` with message `chore: keep scheduled check alive`, and push. A push made with `GITHUB_TOKEN` does not start another workflow run, so no check or deploy follows. README tells Hamza to `git pull` before his next push.
- Preview deploys stay private with Vercel's default Deployment Protection (Vercel login needed; Hamza is the owner); they never touch the DB.

Outward-facing steps (do each only with Hamza's OK in the same session, one combined question): make the private repo `Hamza-Atiq/portfolio` public, after a secret scan of its whole history; create Vercel project (name `hamza-atiq` or nearest free, spec §8) and token; create Neon free project via Vercel integration and run `checker/schema.sql`; add secrets.

`notify.py` interfaces: `def issue_action(event: str, branch: str, problems: list[str], failed_steps: list[str], open_issue: int | None) -> Literal["none","create","update","close"]`, `def issue_body(problems: list[str], failed_steps: list[str], run_url: str) -> str`, and `def keepalive_needed(last_commit: date, today: date) -> bool` (true at 50 or more days). The body is simple English: one problem per line, then each failed step by its plain name (for example "the deploy step failed") with the link to that run's log. Log text is never copied into the issue, so it cannot hold a secret value (FR-14). It is cut to 60,000 characters.

- [ ] **Step 0: Failing tests, then implement** `test_notify.py`: `test_preview_never_acts`, `test_warning_opens_issue`, `test_warning_updates_open_issue`, `test_clean_closes_open_issue`, `test_clean_without_issue_does_nothing`, `test_failed_job_opens_issue_even_with_no_lines`, `test_failure_after_checker_lists_step_and_run_link`, `test_setup_failure_never_closes_issue`, `test_keepalive_49_days_false`, `test_keepalive_50_days_true`.
- [ ] **Step 1:** Write workflow, `vercel.json`, README. Validate YAML with `python -c "import yaml,sys;yaml.safe_load(open('.github/workflows/check-and-deploy.yml'))"`.
- [ ] **Step 2:** Run the exact workflow commands from `checker/` (`python -m pytest -q`, then the checker with `--include-drafts`) + `npm run build` locally → all pass (the production check can pass only after Task 14 Step 4); `python -m portfolio_checker` secret scan clean on the whole repo.
- [ ] **Step 3:** Commit `ci: check-and-deploy pipeline`.
- [ ] **Step 4:** With Hamza's OK: make the repo public, push, set up Vercel + Neon + secrets. Until Task 14 Step 4 the workflow file stays only on `preview`, because a `main` run must fail while content is unreviewed; this avoids a false red run and a false issue. Turn on Vercel Authentication with Standard Protection in the project's Deployment Protection settings.
- [ ] **Step 5:** Run `npx vercel@<pinned> env ls` → every database variable shows Production only, none in Preview (FR-14). Push to `preview` → Action green → `npx vercel@<pinned> inspect <url>` shows target preview, the private preview link shows the draft content for Hamza, and `curl -I` on that link with no login does not answer 200.

### Task 14: Acceptance check and go-live

**Files:** Create `site/e2e/acceptance.spec.ts` (Playwright; `BASE_URL` = local `npm start` before go-live, the production URL after). The protected preview link cannot be opened by robots, so robots test locally and Hamza looks at the preview.

- [ ] **Step 1: e2e tests** for spec §11: `no_sideways_scroll_360_and_1440` (`scrollWidth <= clientWidth`), `sections_order`, `light_device_opens_light` / `dark_device_opens_dark` (Playwright `colorScheme`; an `addInitScript` records `data-theme` at `DOMContentLoaded`, before images paint, and it must already be right), `toggle_remembered_after_reload`, `photo_changes_with_theme`, `p013_page_opens`, `wrong_address_custom_404` (both `/nope` and `/projects/nope`: status 404 and link home), `favicon_answers_200`, `robots_and_sitemap_match_build`, `tap_targets_44px` (every `button`, filter chip and About/Contact button ≥ 44 × 44; inline `proof ↗` text links are exempt as WCAG 2.5.8 allows), `draft_not_on_public` (production bundle).
- [ ] **Step 2:** Run e2e locally on the drafts build → PASS. Lighthouse mobile: `npx lighthouse@<pinned> $BASE_URL --only-categories=performance,accessibility --form-factor=mobile --output=json` → Performance ≥ 90, Accessibility ≥ 90, LCP ≤ 2.5 s; fix and re-run until true.
- [ ] **Step 3: Broken-file test:** make three separate pushes to `preview`, each with one mistake in otherwise valid content: a project with an empty `summary`; a dead link; an unlisted proof file. Each time the Action is red with its simple message and no deploy, and the public site is untouched. Revert each commit. (`main` runs the same job, so the same refusal protects the public site.)
- [ ] **Step 3b: Database-off test:** locally run `npm start` with `DATABASE_URL` set only in that shell to a made-up Postgres address on `127.0.0.1` port 9, where nothing listens (never write such an address in a tracked file, or the Task 4 scan refuses it) → every page loads and `/api/search?q=grid` answers `source: "local"` with P-013.
- [ ] **Step 4: Hamza's single review:** send Hamza the preview link once. He reads the page; any sentence he changes is edited in `content/`. On his go: set `reviewed_by_hamza` (his date) and `status: published` on every item, set `checked_by_hamza` on each LinkedIn link, then merge `preview` into `main` and push. This also brings the workflow to `main`, which starts the daily schedule and the Run workflow button.
- [ ] **Step 5: Live checks:** production Action green; e2e + Lighthouse again on the production URL; add one test news item (`status: published`, `reviewed_by_hamza` = the date of Hamza's go, and Step 4 tells him about this one short test line) and push → visible within 5 minutes → remove it. Alert test: commit a LinkedIn `checked_by_hamza` date 91 days old → a run warns and one issue opens, assigned to Hamza → restore the date → a clean run closes it. Failed-run test: push a dead link to `main` → the run is red, no deploy, the public site is unchanged, and the issue names it → revert → a clean run closes it. Keepalive test: press "Run workflow" with `test_keepalive` on → one commit lands and no new run starts. Search Console (needs Hamza's Google login, one short step): add the site as a URL-prefix property, put the verification code in Vercel's Production env as `GOOGLE_SITE_VERIFICATION`, press "Run workflow" on `main` to rebuild, then verify and submit the sitemap. If Google refuses the `vercel.app` address, tell Hamza and record it; it does not block go-live. Tick spec §11 boxes, `_portfolio_journey/HANDOVER.md`, `01_session_log.md`. Commit `v1 live`.

---

## Spec coverage map

FR-1 T1/T8 · FR-2 T5 · FR-3 T6 · FR-4 T2 · FR-5 T6 · FR-6 T1 · FR-7 T13 · FR-8 T1–T4 · FR-9 T6/T13 · FR-10 T7/T13 · FR-11 T7 · FR-12 T3/T13 · FR-13 T13 · FR-14 T13 · FR-15 T9–T11 · FR-16 T10 · FR-17 T12 · FR-18 T9/T14 · FR-19 T9 · FR-20 T11 · FR-21 T10 · FR-22 T10/T14 · FR-23 T9 (`next/image`) · FR-24 T6/T8/T10 · FR-25 T10 · FR-26 T6/T13/T14 · FR-27 T13/T14 · FR-28 T11/T14 · FR-29 T11/T14 · FR-30 T11/T14 · §6 T9/T10 · §9 edge cases T2/T5/T7/T10/T12 · §11 T14.

## Where each task runs

Cloud sessions need the code on GitHub, and they cannot see Hamza's `D:` drive or his Google login.

| Tasks | Where | Why |
|---|---|---|
| 0 | Hamza's computer | Puts the repo on GitHub, which cloud sessions need |
| 1–7, 9–12 | Cloud is possible, after Task 0 | Only code and tests, using the fixtures in the repo |
| 8 | Hamza's computer | Needs the photo and P-013 files on `D:`, and the Google Drive connector for the CV |
| 13–14 | Hamza's computer, with his OK | Creates accounts and secrets, and needs his logins |

Tasks 9–12 do not wait for Task 8. For their tests and `npm run build`, first run the checker on `checker/tests/fixtures/good` with `--skip-network --include-drafts`; this writes `site/data/content.json` and copies the fixture's test photos and images to `site/public/c/`. The real content is first built on Hamza's computer at the end of Task 8 and in Task 13 Step 2.

## Changes for spec v5 (2026-11-03)

Fixes 1–8 from `_portfolio_journey/launch_fixes_decisions.md`: same proof links as the CV (Task 8); `my_role` optional and the team rule removed (Tasks 1, 2, 11, 14); issue alerts and keepalive (Tasks 6, 13, 14), which must still run on a "nothing changed" day; robots, sitemap, Search Console, favicon, 404 (Tasks 11, 14); database address in Production only (Task 13); new work waits for after v1 (spec §10).

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
