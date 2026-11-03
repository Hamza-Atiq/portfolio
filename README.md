# Portfolio website

The site is built from the small text files in `content/`. You change the site by editing those files
and pushing. You never edit page code to add content.

- `content/` — everything on the site (profile, news, projects, awards, …)
- `checker/` — the robot that checks every push (Python)
- `site/` — the website (Next.js)
- `specs/` — the spec, the plan and the build notes

## How a change goes live

1. You push to `main`.
2. GitHub Actions runs the checker. It checks every file, every link, every proof file and the whole repo for
   secret keys or private details.
3. If anything is wrong, it stops, names the file and the problem in simple words, and **nothing is deployed**.
   The live site stays as it was. Fix the file and push again.
4. If all is well, it copies the search data to the database and deploys the site to Vercel. This takes about
   2 minutes (at most 5).

It also runs once a day by itself, and when you press **Run workflow** on the Actions page.

## Add a news line

Add one item at the **top** of `content/news.yml`:

```yaml
- slug: my-new-line              # a-z, 0-9 and - only; different from every other news slug
  text: "What happened, in one line"
  date: 2026-11                  # YYYY, YYYY-MM or YYYY-MM-DD
  link: { label: proof, url: https://… }   # label: code, demo, video, proof or paper
  status: published              # or draft
  reviewed_by_hamza: 2026-11-05  # the date you read and approved it
```

Commit and push. Put text in quotes if it is only `yes`, `no`, a number, or starts with a special sign.

## Add a project

Copy `content/projects/p013-grid-contingency.md` to `content/projects/<new-slug>.md` and change the header
(between the two `---` lines) and the text below it. Put images in `content/images/<new-slug>/` (at most 2 MB
each) and give each one an `alt` text. Use `/` in paths, never `\`.

A project can also live in its own **public** repo: add a `portfolio.yml` file there (the same fields, with
the page text in a `body:` field) and add the repo to `content/sources.yml`:

```yaml
- repo: Hamza-Atiq/<repo-name>
```

## Proof files

Every file in `content/proofs/` and `content/cv/` must be listed in `content/proofs.yml` with
`private_info_checked: true`. Open the file first and check that it shows no date of birth, ID number,
phone number or home address.

## Links that block robots (LinkedIn)

Some sites refuse robots, so the checker cannot test them. List each such link in
`content/link_check_skip.yml` with the date you last opened it in your browser:

```yaml
- url: https://www.linkedin.com/posts/…
  checked_by_hamza: 2026-11-05
```

The checker warns when a date is more than 90 days old. Open the link again and update the date.

## See a change before it is public: the `preview` branch

Push to the `preview` branch. You get a private preview link (you must be logged in to Vercel to open it).
It also shows items with `status: draft`. It never changes the public site or the database.

```bash
git checkout preview
git merge main
git push
```

## Undo a change

- **With git:** find the commit with `git log`, then run `git revert <commit>` and push. The site redeploys
  without that change.
- **With Vercel:** open the project on vercel.com → Deployments → pick the previous good deployment →
  **Instant Rollback**. This is the fastest way back; the next push deploys normally again.

## When something needs your attention

If a daily run or a `main` run ends with a warning or a failure, GitHub opens one issue called
**"Site check needs attention"** and assigns it to you, so you get an email. It lists each problem in simple
words and links to the run's log. When a later run is clean, the issue closes by itself.

## The keepalive commit

GitHub stops daily checks in a repo with no activity for 60 days. So when `main` has had no commit for 50 days,
the daily run makes one small commit to `.github/keepalive.txt`. **Run `git pull` before your next push**, or
your push will be refused.

## Run the checks on your computer

```bash
cd checker
python -m pip install -r requirements.txt
python -m pytest -q
python -m portfolio_checker --content ../content --site ../site --repo .. --mode push --include-drafts
```

```bash
cd site
npm ci
npx vitest run
npm run build
npm start
```

## Set-up notes (for the first deploy)

- GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`. GitHub variable: `SITE_URL`.
- Set `SITE_URL` in Vercel too (the public address, for example `https://hamza-atiq.vercel.app`). A public build
  with no address stops with a clear message, so the sitemap never lists a wrong address.
- The Vercel project is made from the command line and is **not** connected to this GitHub repo. Its
  Root Directory setting stays empty, because the workflow runs the Vercel commands inside `site/`.
- The database address is set in Vercel for **Production only**, never Preview or Development.
