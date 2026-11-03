from __future__ import annotations

from datetime import date, timedelta

from portfolio_checker.notify import MAX_BODY, issue_action, issue_body, keepalive_needed, main

RUN = "https://github.com/Owner/repo/actions/runs/1"
WARN = ["WARNING content/link_check_skip.yml: https://x was last checked on 2026-01-01; re-check this link by hand"]


def test_preview_never_acts():
    assert issue_action("push", "preview", WARN, ["deploy"], None) == "none"
    assert issue_action("push", "preview", [], [], 7) == "none"


def test_other_branch_never_acts():
    assert issue_action("push", "build/v1", WARN, [], None) == "none"


def test_warning_opens_issue():
    assert issue_action("schedule", "main", WARN, [], None) == "create"
    assert issue_action("push", "main", WARN, [], None) == "create"


def test_warning_updates_open_issue():
    assert issue_action("schedule", "main", WARN, [], 12) == "update"


def test_clean_closes_open_issue():
    assert issue_action("schedule", "main", [], [], 12) == "close"
    assert issue_action("workflow_dispatch", "main", [], [], 12) == "close"


def test_clean_without_issue_does_nothing():
    assert issue_action("push", "main", [], [], None) == "none"


def test_failed_job_opens_issue_even_with_no_lines():
    assert issue_action("push", "main", [], ["deploy"], None) == "create"


def test_failure_after_checker_lists_step_and_run_link():
    body = issue_body(["ERROR content/news.yml: item 1: text is missing"], ["deploy"], RUN)
    assert "ERROR content/news.yml: item 1: text is missing" in body
    assert "the deploy step failed" in body
    assert RUN in body
    assert body.index("text is missing") < body.index("the deploy step failed")


def test_setup_failure_never_closes_issue():
    assert issue_action("push", "main", [], ["a setup step failed"], 5) == "update"
    assert "a setup step failed" in issue_body([], ["a setup step failed"], RUN)


def test_body_cut_to_limit():
    body = issue_body(["ERROR x: " + "a" * 1000] * 200, ["deploy"], RUN)
    assert len(body) <= MAX_BODY
    assert RUN in body  # the run link survives the cut


def test_keepalive_49_days_false():
    today = date(2026, 11, 3)
    assert keepalive_needed(today - timedelta(days=49), today) is False


def test_keepalive_50_days_true():
    today = date(2026, 11, 3)
    assert keepalive_needed(today - timedelta(days=50), today) is True


def test_cli_issue(tmp_path, capsys):
    problems = tmp_path / "problems.txt"
    problems.write_text(WARN[0] + "\n", encoding="utf-8")
    body = tmp_path / "body.md"
    code = main(["issue", "--event", "schedule", "--branch", "main", "--problems-file", str(problems),
                 "--failed-steps", "", "--open-issue", "", "--run-url", RUN, "--body-file", str(body)])
    assert code == 0
    assert capsys.readouterr().out.strip() == "create"
    assert "re-check this link by hand" in body.read_text(encoding="utf-8")


def test_cli_issue_missing_problems_file(tmp_path, capsys):
    code = main(["issue", "--event", "push", "--branch", "main", "--problems-file", str(tmp_path / "nope.txt"),
                 "--failed-steps", "checker_tests deploy", "--open-issue", "4", "--run-url", RUN,
                 "--body-file", str(tmp_path / "b.md")])
    assert code == 0
    assert capsys.readouterr().out.strip() == "update"
    text = (tmp_path / "b.md").read_text(encoding="utf-8")
    assert "the checker tests step failed" in text and "the deploy step failed" in text


def test_cli_keepalive(capsys):
    assert main(["keepalive", "--last", "2026-01-01", "--today", "2026-03-01"]) == 0
    assert capsys.readouterr().out.strip() == "true"
    assert main(["keepalive", "--last", "2026-02-20", "--today", "2026-03-01"]) == 0
    assert capsys.readouterr().out.strip() == "false"


def test_cancelled_run_never_closes_issue(tmp_path, capsys):
    code = main(["issue", "--event", "schedule", "--branch", "main", "--problems-file", str(tmp_path / "none"),
                 "--failed-steps", "", "--job-status", "cancelled", "--open-issue", "3", "--run-url", RUN,
                 "--body-file", str(tmp_path / "b.md")])
    assert code == 0
    assert capsys.readouterr().out.strip() == "update"
    assert "did not finish" in (tmp_path / "b.md").read_text(encoding="utf-8")


def test_failed_job_without_named_step_counts_as_setup_failure(tmp_path, capsys):
    main(["issue", "--event", "push", "--branch", "main", "--problems-file", str(tmp_path / "none"),
          "--failed-steps", "", "--job-status", "failure", "--open-issue", "", "--run-url", RUN,
          "--body-file", str(tmp_path / "b.md")])
    assert capsys.readouterr().out.strip() == "create"
    assert "a setup step failed" in (tmp_path / "b.md").read_text(encoding="utf-8")
