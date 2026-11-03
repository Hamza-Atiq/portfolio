from __future__ import annotations

import os
from datetime import date, timedelta
from pathlib import Path

import pytest

from portfolio_checker.load import load_content
from portfolio_checker.models import Content
from portfolio_checker.rules import check_rules

TODAY = date(2026, 11, 3)


def _load(root: Path) -> Content:
    content, r = load_content(root)
    assert r.ok(), r.errors
    return content


def _msgs(report, kind: str = "errors") -> str:
    return "\n".join(f"{p.file}: {p.message}" for p in getattr(report, kind))


def test_good_fixture_passes(good_root):
    r = check_rules(_load(good_root), good_root, TODAY, include_drafts=False)
    assert r.ok(), r.errors
    assert not r.warnings, r.warnings


def test_duplicate_slug(good_root):
    c = _load(good_root)
    c.news[1].slug = c.news[0].slug
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert r.errors[0].file == "content/news.yml"
    assert "test-project-live" in r.errors[0].message


def test_published_needs_review_date(good_root):
    c = _load(good_root)
    c.awards[0].reviewed_by_hamza = None
    for drafts in (False, True):
        r = check_rules(c, good_root, TODAY, include_drafts=drafts)
        assert len(r.errors) == 1, r.errors
        assert "is published but has no reviewed_by_hamza date" in r.errors[0].message


def test_profile_date_needed_only_in_production(good_root):
    c = _load(good_root)
    c.profile.reviewed_by_hamza = None
    c.interests.reviewed_by_hamza = None
    c.skills.reviewed_by_hamza = None
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    files = sorted(p.file for p in r.errors)
    assert files == ["content/interests.yml", "content/profile.yml", "content/skills.yml"], r.errors
    assert "has no reviewed_by_hamza date" in r.errors[0].message
    assert check_rules(c, good_root, TODAY, include_drafts=True).ok()


def test_unknown_proof_id(good_root):
    c = _load(good_root)
    c.awards[0].proof_id = "no-such-proof"
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert "no-such-proof" in r.errors[0].message and "proofs.yml" in r.errors[0].message


def test_project_proof_ids_checked(good_root):
    c = _load(good_root)
    c.projects[0].proofs = ["missing-one"]
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert r.errors[0].file == "content/projects/p013-grid-contingency.md"


def test_proof_not_privacy_checked(good_root):
    c = _load(good_root)
    c.proofs[0].private_info_checked = False
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert "private_info_checked" in r.errors[0].message


def test_unlisted_proof_file(good_root):
    (good_root / "proofs" / "extra.png").write_bytes(b"x")
    r = check_rules(_load(good_root), good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert "content/proofs/extra.png" in _msgs(r) and "not listed" in r.errors[0].message


def test_unlisted_cv_file(good_root):
    (good_root / "cv" / "old_cv.pdf").write_bytes(b"%PDF")
    r = check_rules(_load(good_root), good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors


def test_missing_image_file(good_root):
    (good_root / "images" / "p013" / "cover.png").unlink()
    r = check_rules(_load(good_root), good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert "does not exist" in r.errors[0].message


def test_backslash_image_path(good_root):
    c = _load(good_root)
    c.projects[0].cover.src = "images\\p013\\cover.png"  # bypasses the model, as if built in code
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert "use / in paths" in r.errors[0].message


@pytest.mark.skipif(not hasattr(os, "symlink"), reason="needs symlinks")
def test_symlink_out_of_content_refused(good_root, tmp_path):
    outside = tmp_path / "outside.png"
    outside.write_bytes(b"secret")
    link = good_root / "images" / "p013" / "cover.png"
    link.unlink()
    link.symlink_to(outside)
    r = check_rules(_load(good_root), good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert "outside content/" in r.errors[0].message


def test_image_over_2mb(good_root):
    (good_root / "images" / "p013" / "cover.png").write_bytes(b"\0" * (2 * 1024 * 1024 + 1))
    r = check_rules(_load(good_root), good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1, r.errors
    assert "2 MB" in r.errors[0].message


def test_image_exactly_2mb_ok(good_root):
    (good_root / "images" / "p013" / "cover.png").write_bytes(b"\0" * (2 * 1024 * 1024))
    assert check_rules(_load(good_root), good_root, TODAY, include_drafts=False).ok()


def test_source_image_paths_skipped(good_root):
    c = _load(good_root)
    c.projects[0].cover.src = "/c/sources/p013-grid-contingency/abc-cover.png"
    assert check_rules(c, good_root, TODAY, include_drafts=False).ok()


def test_cv_must_be_listed(good_root):
    c = _load(good_root)
    c.proofs = [p for p in c.proofs if p.file != "cv/test_cv.pdf"]
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    # the CV is not in proofs.yml, and the file in content/cv/ is unlisted
    assert any("cv_file" in p.message for p in r.errors), r.errors


def test_skip_link_older_than_90_days_warns(good_root):
    c = _load(good_root)
    for link in c.skip_links:
        link.checked_by_hamza = TODAY - timedelta(days=91)
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert r.ok()
    assert len(r.warnings) == 2
    assert "re-check this link by hand" in r.warnings[0].message
    for link in c.skip_links:
        link.checked_by_hamza = TODAY - timedelta(days=90)
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert r.ok() and not r.warnings


def test_skip_link_no_date_warns_on_drafts_errors_in_production(good_root):
    c = _load(good_root)
    c.skip_links[0].checked_by_hamza = None
    r = check_rules(c, good_root, TODAY, include_drafts=True)
    assert r.ok() and len(r.warnings) == 1
    r = check_rules(c, good_root, TODAY, include_drafts=False)
    assert len(r.errors) == 1 and r.errors[0].file == "content/link_check_skip.yml"
