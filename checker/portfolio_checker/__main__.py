"""Command line: check everything, then build the site data (plan Task 6; spec FR-8, FR-9).

python -m portfolio_checker --content ../content --site ../site --repo .. --mode push|daily
    [--include-drafts] [--skip-network] [--sync-db] [--problems-file PATH]
"""
from __future__ import annotations

import argparse
import os
import shutil
import sys
import tempfile
from datetime import date
from pathlib import Path

from .build import build_bundle, write_site
from .load import load_content
from .models import Report
from .rules import check_rules
from .secrets_scan import scan_repo


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="portfolio_checker", description="Check content/ and build site data.")
    p.add_argument("--content", required=True, type=Path)
    p.add_argument("--site", required=True, type=Path)
    p.add_argument("--repo", required=True, type=Path)
    p.add_argument("--mode", choices=["push", "daily"], default="push")
    p.add_argument("--include-drafts", action="store_true")
    p.add_argument("--skip-network", action="store_true", help="skip link checks and source pulls (local tests)")
    p.add_argument("--sync-db", action="store_true", help="copy the search index to DATABASE_URL after a pass")
    p.add_argument("--problems-file", type=Path)
    return p


def _lines(report: Report) -> list[str]:
    return [f"ERROR {p.file}: {p.message}" for p in report.errors] + [
        f"WARNING {p.file}: {p.message}" for p in report.warnings
    ]


def _inside(path: Path, folder: Path) -> bool:
    path, folder = path.resolve(), folder.resolve()
    return path == folder or folder in path.parents


def _move_into_site(tmp_site: Path, site: Path) -> None:
    (site / "data").mkdir(parents=True, exist_ok=True)
    (site / "public").mkdir(parents=True, exist_ok=True)
    shutil.move(str(tmp_site / "data" / "content.json"), str(site / "data" / "content.json"))
    old = site / "public" / "c"
    if old.exists():
        shutil.rmtree(old)
    if (tmp_site / "public" / "c").exists():
        shutil.move(str(tmp_site / "public" / "c"), str(old))
    shutil.move(str(tmp_site / "public" / "content-hash.txt"), str(site / "public" / "content-hash.txt"))


def run(args: argparse.Namespace) -> tuple[int, Report]:
    report = Report()
    if args.problems_file and _inside(args.problems_file, args.site):
        report.error("--problems-file", "must be outside the site folder, so it is never published")
        return 1, report
    if args.sync_db and args.include_drafts:
        report.error("--sync-db", "cannot be used with --include-drafts; drafts never go to the database")
        return 1, report

    content, load_report = load_content(args.content)
    report.extend(load_report)
    tmp = Path(tempfile.mkdtemp(prefix="portfolio-build-"))
    try:
        if content is not None:
            if not args.skip_network:
                from .sources import pull_sources

                pulled, src_report = pull_sources(content.sources, tmp / "public")
                report.extend(src_report)
                content.projects.extend(pulled)
            report.extend(check_rules(content, args.content, date.today(), args.include_drafts))
            if not args.skip_network:
                from .links import check_links

                report.extend(check_links(content, args.mode))
        report.extend(scan_repo(args.repo))
        if not report.ok() or content is None:
            return 1, report

        bundle = build_bundle(content, args.include_drafts)
        write_site(bundle, args.content, tmp)
        _move_into_site(tmp, args.site)

        if args.sync_db:
            from .db_sync import sync_db

            report.extend(sync_db(bundle["search_index"], os.environ.get("DATABASE_URL") or None))
        return 0, report
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    code, report = run(args)
    lines = _lines(report)
    for line in lines:
        print(line)
    if args.problems_file and not (report.errors and report.errors[0].file == "--problems-file"):
        args.problems_file.parent.mkdir(parents=True, exist_ok=True)
        args.problems_file.write_text("".join(f"{l}\n" for l in lines), encoding="utf-8")
    if code == 0:
        print(f"OK: checks passed with {len(report.warnings)} warning(s); site data written to {args.site}")
    else:
        print(f"FAILED: {len(report.errors)} problem(s); nothing was written, the live site stays as it is")
    return code


if __name__ == "__main__":
    sys.exit(main())
