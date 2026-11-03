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
