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
21. **Task 14 Step 1, e2e tests ran locally on the fixture.** `site/e2e/acceptance.spec.ts` (Playwright
    `@playwright/test@1.64.1`, `npm run e2e`) reads the same `site/data/content.json` the site was built from.
    It was run against `next start` twice:
    - **drafts build** (`--include-drafts`, like `preview`): 11 passed, 1 skipped (`draft_not_on_public`, which
      needs a production build);
    - **production build** (no drafts, `SITE_URL` set): all 12 passed. `curl` also confirmed the fixture's draft
      news line is not in the page.
    Limits of the fixture: `p013_page_opens` checks the fixture's test title and result, not the real P-013
    wording; `tap_targets_44px` cannot test the project filter chips, because they appear only with 4 or more
    projects and the fixture has 1; YouTube thumbnails cannot load in this sandbox (no internet). The cloud
    sandbox has an older Chromium installed, so `PW_CHROMIUM_PATH` lets the config use it; on a normal computer
    run `npx playwright install chromium` once.
22. **Task 14 Step 1, "no device setting" in a real browser.** Modern browsers no longer report "no preference"
    for the colour scheme (Chromium reports light). So "dark when the device gives no setting" (FR-18) cannot
    be tested in Playwright; it is covered by the unit tests (`pickTheme(null, null)` and the script with no
    `matchMedia`).
23. **Self-review, test not used in CI.** `checker/tests/test_db_sync_real.py` runs the real sync and the search
    query against a real Postgres, only when `TEST_DATABASE_URL` is set (it is skipped in normal runs and in CI).
    It was run here against a local Postgres 16: 2 passed.

## Self-review

A strict review of every file on `build/v1`, against spec.md section by section (§4 sections, §4.1 awards,
FR-1 to FR-30, §6, §9, §11). Each real problem was first shown by a failing test, then fixed.

| # | Spec | Problem found | Fix and test |
|---|---|---|---|
| R1 | Constitution 8, FR-8 | The phone-number rule matched long numbers inside links. A LinkedIn post id (19 digits) contains `03` followed by 9 digits fairly often, so a real award link could stop the build with a false "phone number" error. | Phone patterns now need a non-digit before and after; `CNIC` is matched as a word. `test_long_numbers_in_links_are_not_phone_numbers`, `test_phone_next_to_text_is_found`. |
| R2 | Constitution 8 | `private_info_checked: true` was required only for proof files a page uses. The repo will be public, so an unused proof file in `content/proofs/` is public too. | Every entry in `proofs.yml` must have `private_info_checked: true`. `test_every_listed_proof_must_be_privacy_checked`. |
| R3 | FR-8 ("every image ≤ 2 MB") | Proof images (certificate thumbnails shown on the page) were not size-checked. | Image proof files (png/jpg/webp/avif/gif) must be ≤ 2 MB; PDFs are not limited. `test_image_proof_over_2mb`, `test_big_pdf_proof_is_fine`. |
| R4 | FR-8 ("every link works") | Images in a project's Markdown (`![…](https://…)`) were not link-checked. | Image addresses are checked too. `test_markdown_body_image_is_checked`. |
| R5 | FR-8 (skip list by exact address) | A link written without a trailing `/` in Markdown did not match the same address in `link_check_skip.yml` (pydantic writes it with `/`), so a skipped site was still fetched and could fail the build. | Every address is written in one normal form before comparing. `test_skip_list_matches_body_link_without_trailing_slash`. |
| R6 | FR-12 | The daily run decides "something changed" from `content-hash.txt`, which covered only the JSON. If a project repo changed only an image, the daily run would not deploy it. | The hash now also covers every file under `public/c/`. `test_hash_changes_when_an_image_changes`, `test_hash_changes_when_a_pulled_image_changes`. |
| R7 | FR-26 | A cancelled or timed-out run had no failed step and no problem lines, so it would **close** the open issue as if clean. | `notify.py` gets `--job-status`; a failed job with no named step counts as "a setup step failed", and a cancelled one is reported, never closing the issue. `test_cancelled_run_never_closes_issue`, `test_failed_job_without_named_step_counts_as_setup_failure`. |
| R8 | FR-22 (phone, no sideways scroll) | A long word or file path in a project page (common in results) widened the page to 784 px on a 360 px phone. | `overflow-wrap: anywhere` on the page text (code blocks still scroll). The fixture project now has such text, and the e2e test `no_sideways_scroll_360_and_1440` (which also opens project pages) failed before and passes now. |
| R9 | FR-21 (phone) | On a touch phone the card "lift" stuck after a tap (hover on touch). | Lift on hover only for devices that can hover; keyboard focus still lifts. e2e `cards_do_not_stay_lifted_after_a_tap` (Pixel 7) failed before and passes now. |
| R10 | FR-28, FR-20 | If `SITE_URL` was missing at build time, the public sitemap, robots file and share previews would silently point to `http://localhost:3000`. | Use `SITE_URL`, else Vercel's own `VERCEL_PROJECT_PRODUCTION_URL`; a public production build with neither now fails with a clear message (preview/drafts builds never fail on this). Tests in `seo.test.ts`. |
| R11 | FR-20 | A project page's Twitter/X card kept the main page's title and text. | The project page sets its own card. `metadata_twitter_card_is_the_project`. |

Checked and found correct (no change): section order and hiding rules (§4); hackathon line; news 6 + "show all";
filter chips only from 4 projects; awards main/other lists and proof thumbnails; CV button only with
`cv_reviewed_by_hamza`; English line only with its link; drafts never in production or the database; database
address only on `main`; 2-second search fallback; theme with no flash and blocked storage; round photo per mode;
custom 404 with status 404; favicon; preview build `noindex`; Markdown raw HTML not rendered; nothing written
when a check fails; the real sync SQL and search query (note 23). One suspected bug was **not** a bug:
`_item_name` in `load.py` reads `a or b if c else d` as `(a or b) if c else d`, so a list item that is plain
text gives an error, not a crash; a regression test was added.

**For the owner (not changed, because it would add to the spec):** project text is rendered as standard
(CommonMark) Markdown. Markdown **tables** are not part of it and would show as plain `|` text. If the P-013
page should have a results table, either write results as a list (no change), or approve adding table support
(`remark-gfm`, one small package).

## Two small fixes (after the self-review)

24. **Repeated keys in YAML are refused.** PyYAML silently keeps the last of two equal keys (for example two
    `summary:` lines), so text could be lost without notice. The loader now refuses any mapping that repeats a
    key, at any depth, in every content file, project header and pulled `portfolio.yml`. The error names the file,
    the line and the key, for example `content/news.yml: is not valid YAML (line 3): the key "text" appears twice
    (first on line 2)`. Line numbers in a project header count from the top of the `.md` file. Tests:
    `test_repeated_key_refused`, `test_repeated_key_in_project_header_names_the_file_line`,
    `test_repeated_key_in_nested_mapping_refused`.
25. **A link is never accepted on HEAD alone.** Plan Task 3 said: HEAD first, GET only after 403/405/429 or an
    error. But some sites answer HEAD with 200 while the page itself answers 404, so a dead link could pass. Each
    check is now one GET with the browser-like User-Agent, sent as a stream: only the status and headers are
    read, and the response is closed without downloading the page. Everything else is unchanged: redirects
    followed, good = status below 400, 3 tries with 1 s and 2 s waits, 10 s timeout, 8 at a time, skip list,
    error on push and warning on daily. Tests: `test_head_ok_alone_is_not_enough`,
    `test_get_does_not_download_the_body`; `test_ok_link_passes` and `test_gives_up_after_three_tries` now count
    GET requests.
