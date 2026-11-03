from __future__ import annotations

import json
from pathlib import Path

import pytest

from portfolio_checker.load import load_content
from tests.conftest import FIX, copy_bad


def _replace(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    assert old in text, f"{old!r} not in {path}"
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


PROJECT = "projects/p013-grid-contingency.md"


def test_good_fixture_loads():
    content, r = load_content(FIX / "good")
    assert r.ok(), r.errors
    assert content is not None
    assert content.projects[0].slug == "p013-grid-contingency"


def test_bad_date_message(tmp_path):
    root = copy_bad(tmp_path)
    content, r = load_content(root)
    assert len(r.errors) == 1, r.errors
    assert r.errors[0].file == "content/news.yml"
    assert "is not a real date" in r.errors[0].message


def test_month_only_date_ok(good_root):
    content, r = load_content(good_root)
    assert r.ok(), r.errors
    assert content.projects[0].date == "2026-10"


def test_yaml_bool_in_text_refused(good_root):
    _replace(good_root / "news.yml", 'text: "Test project published"', "text: no")
    _, r = load_content(good_root)
    assert len(r.errors) == 1, r.errors
    assert "put it in quotes" in r.errors[0].message


def test_unicode_survives_round_trip(good_root):
    text = "M(IT)² rank 482 × 559 → ok"
    _replace(good_root / "awards.yml", "Test Cup 2025, Round 1: rank 5 of 50", text)
    content, r = load_content(good_root)
    assert r.ok(), r.errors
    assert content.awards[1].text == text
    again = json.loads(content.model_dump_json())
    assert again["awards"][1]["text"] == text


def test_crlf_file_loads(good_root):
    for name in ("news.yml", "profile.yml", PROJECT):
        p = good_root / name
        p.write_bytes(p.read_bytes().replace(b"\r\n", b"\n").replace(b"\n", b"\r\n"))
    content, r = load_content(good_root)
    assert r.ok(), r.errors
    assert content.projects[0].body.strip().startswith("## Problem")


@pytest.mark.parametrize("bad", ["../secret.png", "/etc/passwd", "C:/x.png"])
@pytest.mark.parametrize(
    "where",
    [
        (PROJECT, "src: images/p013/cover.png", "src: {bad}"),
        ("proofs.yml", "file: proofs/test_certificate.png", "file: {bad}"),
        ("profile.yml", "cv_file: cv/test_cv.pdf", "cv_file: {bad}"),
    ],
)
def test_unsafe_paths_refused(good_root, bad, where):
    name, old, new = where
    _replace(good_root / name, old, new.format(bad=bad))
    _, r = load_content(good_root)
    assert len(r.errors) == 1, r.errors
    assert r.errors[0].file == f"content/{name}"


def test_bad_slug_refused(good_root):
    _replace(good_root / "news.yml", "slug: test-award-news", 'slug: "../x"')
    _, r = load_content(good_root)
    assert len(r.errors) == 1, r.errors
    assert "slug" in r.errors[0].message


def test_missing_required_field(good_root):
    _replace(good_root / PROJECT, 'summary: "A test summary for the checker."\n', "")
    _, r = load_content(good_root)
    assert len(r.errors) == 1, r.errors
    assert "summary is missing" in r.errors[0].message


def test_my_role_optional(good_root):
    _replace(good_root / PROJECT, "team: solo", 'team: "team of 3"')
    _replace(good_root / PROJECT, 'my_role: "Built the test project"\n', "")
    content, r = load_content(good_root)
    assert r.ok(), r.errors
    assert content.projects[0].my_role is None
    assert content.projects[0].team == "team of 3"


def test_bad_team_form(good_root):
    _replace(good_root / PROJECT, "team: solo", 'team: "team of 1"')
    _, r = load_content(good_root)
    assert len(r.errors) == 1, r.errors
    assert "team" in r.errors[0].message


def test_list_item_that_is_not_a_mapping_is_an_error_not_a_crash(good_root):
    p = good_root / "news.yml"
    p.write_text(p.read_text(encoding="utf-8") + "- just some text\n", encoding="utf-8")
    _, r = load_content(good_root)
    assert len(r.errors) == 1, r.errors
    assert r.errors[0].file == "content/news.yml" and "item 4" in r.errors[0].message
