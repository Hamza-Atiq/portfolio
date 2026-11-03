Build the code tasks of this portfolio website from its approved plan. The owner, Hamza Atiq, approved this private repo for cloud building.

Read these first, fully: specs/constitution.md, specs/001-portfolio-v1/spec.md, specs/001-portfolio-v1/plan.md.

SCOPE: Do plan Tasks 1, 2, 3, 4, 5, 6, 7, then 9, 10, 11, 12, in that order. Do NOT do Task 0, 8, 13 or 14. They need the owner's computer, accounts or approval.

BRANCH: Create the branch `build/v1` from `main`. Commit and push ONLY to `build/v1`. Never push to `main` or `preview`, never change repo settings or visibility, and do not open a pull request. Push after every finished task, so the work survives if this session ends. If you cannot push, say so at once with the exact error, and stop.

RULES:
- Follow the plan's steps exactly: write the failing tests, watch them fail, implement, watch them pass, then commit with the plan's commit message.
- End every commit message with this line: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
- Do not make up personal content. Tests use only `checker/tests/fixtures/good`, with tiny test photos made by test setup code. The owner's real files are not in this environment. Do not create the real `content/` folder; that is Task 8.
- No secrets or real accounts are available or needed. Do not create Vercel, Neon or other accounts, and do not call external services except package registries. Tests must not use the real network.
- Spec and plan were reviewed but never built. If a step cannot work as written, make the smallest fix that keeps the spec's meaning, then write it in `specs/001-portfolio-v1/build-notes.md` (what the step said, what went wrong, what you did) and go on. If a problem would change what the owner sees or an owner's decision in the spec, do not guess: note it in that file, skip only that part, and go on.
- Do not stop to ask questions: the owner may be away. Use the rules above.
- Never claim something passes without running it.

FINISH: Report in simple English, in under 300 words: which tasks are done, the last commit hash on `build/v1`, the exact final results of `python -m pytest -q` (from `checker/`), `npx vitest run` and `npm run build` (from `site/`), anything skipped, and each entry in build-notes.md.
