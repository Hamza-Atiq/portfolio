# Build notes (cloud build of plan Tasks 1–7, 9–12)

Each note: what the step said, what went wrong, what was done.

1. **Python version (all checker tasks).** The plan says Python 3.12. This cloud machine has Python 3.13.
   The code uses nothing newer than 3.12 (`pyproject.toml` says `>=3.12`), and the tests were run on 3.13.
   The GitHub Action (Task 13) should still use 3.12, as planned.
2. **Task 1, `fixtures/bad/`.** The plan names a `bad` fixture but not its form. A full second copy of every
   file would repeat the `good` fixture. So `fixtures/bad/` holds only the files that differ (`news.yml` with
   `reviewed_by_hamza: 2026-13-01`); tests copy `good` to a temp folder and lay `bad` on top.
3. **Task 1, test files.** The test photos, cover, certificate image and CV PDF are made by
   `checker/tests/fixture_files.py` (tiny generated PNG/PDF files, never a real photo). They are git-ignored
   and made again by the test setup. To make them by hand: `cd checker && python -m tests.fixture_files`.
4. **Task 1, `requirements.txt`.** `markdown-it-py` was added, because Task 3 needs a Markdown parser to find
   links in a project body while ignoring code blocks.
5. **Task 6, award proof file in `content.json`.** The plan says proof ids are resolved to
   `{"label":"proof","url":"/c/proofs/..."}`. For a project this is its `proofs` list. For an award the
   resolved link is stored as `proof_file` (and `proof_id` is dropped), so the page can tell the extra proof
   file (thumbnail) apart from `proof_url` (the CV link).
6. **Task 6, search index `url`.** The plan does not say where a search result points. Projects point to
   `/projects/<slug>`; awards, news and teaching point to their section on the main page (`/#awards`,
   `/#news`, `/#teaching`).
7. **Task 7, table set-up.** `sync_db` also runs `checker/schema.sql` (it only uses `create ... if not exists`)
   at the start of each sync, so a new empty Neon database works on the first run. Running it by hand in
   Task 13 is still fine.
8. **Task 9, Node version.** The plan says Node 20. Node 20 reached its end of life in April 2026, and the
   newest Vitest (5.0.5) needs Node 22.12 or newer. The site was built and tested with Node 22, and
   `package.json` says `"engines": {"node": ">=22.12.0"}`. The GitHub Action (Task 13) should use Node 22.
9. **Task 9, npm install.** `npm install` (npm 10.9) crashed with `Cannot read properties of null (reading
   'edgesOut')` (an npm bug in its peer-dependency step, set off by Vitest's optional peers). Fix:
   `site/.npmrc` has `legacy-peer-deps=true` (and `save-exact=true`), and `vite` is listed as a direct dev
   dependency. `npm ci` uses the same file, so CI behaves the same.
10. **Task 9, versions.** All npm packages are pinned to the newest stable release from before 2026-10-20 (two
    weeks before the build): next 16.4.2, react 19.3.1, typescript 7.0.2, vitest 5.0.5, jsdom 30.1.3, and so on.
    TypeScript 7 works with this Next.js version (build and `tsc --noEmit` pass).
11. **Task 9, light-mode amber text.** Spec §6 allows changing a colour that fails WCAG AA. Deep amber `#B7791F`
    on cream `#FAF8F4` has contrast 3.43:1, below the 4.5:1 AA level for normal text. Light mode uses
    `#9A6516` (4.66:1) for amber **text** (links, tagline, site name, the primary button), and keeps `#B7791F` for
    borders and the glow (non-text parts need 3:1, which it meets). All other colours pass unchanged.
12. **Task 9, site name.** The header shows `~/hamza-atiq`. So that page code holds no personal text, it is made
    from `profile.name` ("Hamza Atiq" → `~/hamza-atiq`).
13. **Task 9, test data.** `npm run fixture` (in `site/`) makes the test photos and runs the checker on
    `checker/tests/fixtures/good` with `--skip-network --include-drafts`, as the plan says. Vitest reads the
    committed copy `site/tests/fixture-content.json` (set in `vitest.config.ts`), never `site/data/content.json`.
14. **Task 12, where the search box is.** The plan does not say where the search box goes on the page. It is
    placed right below About, outside the numbered sections, so the section order of spec §4 is unchanged.
    The owner may want it moved; this is a one-line change in `site/components/Home.tsx`.
15. **Task 11–12, local checks.** On a local `next start` with the fixture data: `/nope` and `/projects/nope`
    answer 404 with the custom page, `/icon.svg` answers 200, the drafts build gives `Disallow: /`, an empty
    sitemap and `noindex`, and `/api/search?q=test project` answers `source: "local"` with no database.
    In this sandbox the YouTube thumbnail of the test video could not load (no internet access to
    `i.ytimg.com`); this is expected here and is checked for real in Task 14.
16. **Audits.** `npm audit --omit=dev`: 0 vulnerabilities. `pip-audit -r checker/requirements.txt`: no known
    vulnerabilities.

## Second cloud build (Task 13 Steps 0–3, Task 14 Step 1, self-review)

17. **Task 13, versions in the workflow.** Python 3.12 and Node 22 (notes 1 and 8). Actions are pinned to exact
    tags (`actions/checkout@v4.2.2`, `actions/setup-python@v5.6.0`, `actions/setup-node@v4.4.0`); the Vercel
    CLI is pinned to `vercel@64.7.0` (newest release older than two weeks). The workflow passes `actionlint`.
18. **Task 13, Step 2 ran on the test fixture, not real content.** There is no `content/` folder in the cloud
    (that is Task 8). So the exact workflow commands were run with `--content tests/fixtures/good` instead of
    `--content ../content`, and with `--skip-network` (the fixture's links are made-up `example.com`
    addresses and this sandbox has no open internet): `python -m pytest -q` → 100 passed; the checker with
    `--include-drafts` → exit 0, no problems; the same without `--include-drafts` → exit 0; `npx vitest run`
    → 52 passed; `npm run build` → success. The secret scan of the whole repo (part of every checker run) is
    clean. The real content check is done later on Hamza's computer (Task 13 Step 2 again, after Task 8).
19. **Task 13, how the workflow passes data to `notify.py`.** `notify.py` has a small command line
    (`python -m portfolio_checker.notify issue …` and `… keepalive …`). The workflow passes failed step ids
    (`checker_tests checker site_tests deploy`, or `setup` when the job failed with no named step failing);
    `notify.py` turns them into plain words ("the deploy step failed").
20. **Task 13, Vercel Root Directory.** The workflow runs the Vercel commands inside `site/`, so the Vercel
    project's Root Directory setting must stay empty. This is written in the README for Task 13 Step 4.
