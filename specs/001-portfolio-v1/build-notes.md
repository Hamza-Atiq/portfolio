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
