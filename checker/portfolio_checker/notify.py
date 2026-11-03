"""Decisions for the workflow's last two steps (plan Task 13; spec FR-26, FR-27).

python -m portfolio_checker.notify issue --event E --branch B --problems-file F --failed-steps "ids"
       --open-issue N --run-url URL --body-file OUT      → prints none|create|update|close
python -m portfolio_checker.notify keepalive --last YYYY-MM-DD [--today YYYY-MM-DD]  → prints true|false
"""
from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path
from typing import Literal

ISSUE_TITLE = "Site check needs attention"
MAX_BODY = 60_000
KEEPALIVE_DAYS = 50

STEP_NAMES = {
    "checker_tests": "the checker tests step failed",
    "checker": "the content check step failed",
    "site_tests": "the site tests step failed",
    "deploy": "the deploy step failed",
}

Action = Literal["none", "create", "update", "close"]


def issue_action(
    event: str, branch: str, problems: list[str], failed_steps: list[str], open_issue: int | None
) -> Action:
    """Only daily and `main` runs touch the issue; `preview` (and any other branch) never does."""
    if branch != "main":
        return "none"
    if problems or failed_steps:
        return "update" if open_issue else "create"
    return "close" if open_issue else "none"


def issue_body(problems: list[str], failed_steps: list[str], run_url: str) -> str:
    """Simple English: one problem per line, then each failed step, then the run link. No log text."""
    tail = [""]
    for step in failed_steps:
        tail.append(f"- {STEP_NAMES.get(step, step)}")
    tail += ["", f"Log of this run: {run_url}", ""]
    tail_text = "\n".join(tail)
    head = "The site check found these problems:\n\n" if problems else "The site check did not finish cleanly.\n"
    lines = [f"- {p}" for p in problems]
    note = "\n- (more problems were cut; see the run log)"
    body_lines = "\n".join(lines)
    room = MAX_BODY - len(head) - len(tail_text)
    if len(body_lines) > room:
        body_lines = body_lines[: max(0, room - len(note))].rsplit("\n", 1)[0] + note
    return (head + body_lines + "\n" + tail_text)[:MAX_BODY]


def keepalive_needed(last_commit: date, today: date) -> bool:
    return (today - last_commit).days >= KEEPALIVE_DAYS


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="portfolio_checker.notify")
    sub = p.add_subparsers(dest="cmd", required=True)
    i = sub.add_parser("issue")
    i.add_argument("--event", required=True)
    i.add_argument("--branch", required=True)
    i.add_argument("--problems-file", type=Path, required=True)
    i.add_argument("--failed-steps", default="")
    i.add_argument("--open-issue", default="")
    i.add_argument("--run-url", required=True)
    i.add_argument("--body-file", type=Path, required=True)
    k = sub.add_parser("keepalive")
    k.add_argument("--last", required=True)
    k.add_argument("--today", default=None)
    args = p.parse_args(argv)

    if args.cmd == "keepalive":
        today = date.fromisoformat(args.today) if args.today else date.today()
        print("true" if keepalive_needed(date.fromisoformat(args.last), today) else "false")
        return 0

    problems: list[str] = []
    if args.problems_file.is_file():
        problems = [l for l in args.problems_file.read_text(encoding="utf-8").splitlines() if l.strip()]
    failed = [s for s in args.failed_steps.replace(",", " ").split() if s]
    failed = ["a setup step failed" if s == "setup" else s for s in failed]
    open_issue = int(args.open_issue) if args.open_issue.strip().isdigit() else None
    action = issue_action(args.event, args.branch, problems, failed, open_issue)
    args.body_file.write_text(issue_body(problems, failed, args.run_url), encoding="utf-8")
    print(action)
    return 0


if __name__ == "__main__":
    sys.exit(main())
