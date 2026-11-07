from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

from portfolio_checker.__main__ import main
from tests.conftest import copy_bad, copy_good

CHECKER = Path(__file__).resolve().parents[1]


def _args(root: Path, site: Path, repo: Path, *extra: str) -> list[str]:
    return ["--content", str(root), "--site", str(site), "--repo", str(repo), "--mode", "push",
            "--skip-network", *extra]


def test_cli_exit_1_and_writes_nothing_on_error(tmp_path, capsys):
    root = copy_bad(tmp_path)
    site = tmp_path / "site"
    assert main(_args(root, site, tmp_path)) == 1
    assert not (site / "data" / "content.json").exists()
    assert not (site / "public").exists()
    out = capsys.readouterr().out
    assert "ERROR content/news.yml:" in out and "is not a real date" in out


def test_cli_good_fixture_exit_0(tmp_path):
    root = copy_good(tmp_path)
    site = tmp_path / "site"
    res = subprocess.run(
        [sys.executable, "-m", "portfolio_checker", *_args(root, site, tmp_path)],
        cwd=CHECKER, capture_output=True, text=True,
    )
    assert res.returncode == 0, res.stdout + res.stderr
    assert (site / "data" / "content.json").is_file()
    assert (site / "public" / "c" / "images" / "p013" / "cover.png").is_file()
    assert (site / "public" / "content-hash.txt").is_file()


def test_old_output_replaced(tmp_path):
    root = copy_good(tmp_path)
    site = tmp_path / "site"
    old = site / "public" / "c" / "old.png"
    old.parent.mkdir(parents=True)
    old.write_bytes(b"old")
    assert main(_args(root, site, tmp_path)) == 0
    assert not old.exists()


def test_production_refuses_unreviewed_profile(tmp_path, capsys):
    root = copy_good(tmp_path)
    p = root / "profile.yml"
    p.write_text(re.sub(r"^reviewed_by_hamza: .*\n", "", p.read_text(encoding="utf-8"), flags=re.M),
                 encoding="utf-8")
    assert main(_args(root, tmp_path / "site", tmp_path)) == 1
    assert "has no reviewed_by_hamza date" in capsys.readouterr().out
    assert main(_args(root, tmp_path / "site", tmp_path, "--include-drafts")) == 0


def test_problems_file_written_on_failure(tmp_path):
    root = copy_bad(tmp_path)
    problems = tmp_path / "problems.txt"
    assert main(_args(root, tmp_path / "site", tmp_path, "--problems-file", str(problems))) == 1
    lines = problems.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1 and lines[0].startswith("ERROR content/news.yml:")


def test_problems_file_inside_site_refused(tmp_path):
    root = copy_good(tmp_path)
    site = tmp_path / "site"
    assert main(_args(root, site, tmp_path, "--problems-file", str(site / "p.txt"))) == 1
    assert not (site / "data").exists()


def test_secret_in_repo_stops_build(tmp_path, capsys):
    root = copy_good(tmp_path)
    (tmp_path / "notes.txt").write_text("key " + "gh" + "p_" + "a" * 36 + "\n")
    assert main(_args(root, tmp_path / "site", tmp_path)) == 1
    assert "ERROR notes.txt:" in capsys.readouterr().out


def test_filled_sample_builds_with_five_projects(tmp_path):
    import json

    from tests.fixture_files import make_filled

    root = make_filled(tmp_path / "content")
    site = tmp_path / "site"
    assert main(_args(root, site, tmp_path)) == 0
    data = json.loads((site / "data" / "content.json").read_text(encoding="utf-8"))
    kinds = [p["kind"] for p in data["projects"]]
    assert len(kinds) == 5 and kinds.count("research") == 4
    assert any(p["cover"] is None for p in data["projects"])
