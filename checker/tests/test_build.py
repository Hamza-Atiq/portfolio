from __future__ import annotations

import json

import pytest

from portfolio_checker.build import build_bundle, sort_items, write_site
from portfolio_checker.load import load_content
from tests.conftest import FIX


@pytest.fixture
def content():
    c, r = load_content(FIX / "good")
    assert r.ok(), r.errors
    return c


def test_drafts_hidden_by_default(content):
    b = build_bundle(content, include_drafts=False)
    assert "test-draft-news" not in [n["slug"] for n in b["news"]]
    assert "test-draft-news" not in [e["slug"] for e in b["search_index"]]
    assert b["include_drafts"] is False


def test_drafts_shown_with_flag(content):
    b = build_bundle(content, include_drafts=True)
    assert "test-draft-news" in [n["slug"] for n in b["news"]]
    assert b["include_drafts"] is True


def test_sort_pin_then_newest(content):
    n = content.news
    n[0].date, n[1].date, n[2].date = "2025", "2026-03-15", "2026-03"
    for item in n:
        item.status = "published"
    assert [i.slug for i in sort_items(n)] == ["test-award-news", "test-draft-news", "test-project-live"]
    n[0].pin = 1
    assert [i.slug for i in sort_items(n)][0] == "test-project-live"
    n[2].pin = 2
    assert [i.slug for i in sort_items(n)] == ["test-project-live", "test-draft-news", "test-award-news"]


def test_awards_split_main_other(content):
    b = build_bundle(content, include_drafts=False)
    assert [a["slug"] for a in b["awards"]["main"]] == ["test-award-main"]
    assert [a["slug"] for a in b["awards"]["other"]] == ["test-award-other"]
    assert b["awards"]["main"][0]["proof_file"] == {"label": "proof", "url": "/c/proofs/test_certificate.png"}


def test_cv_hidden_without_review_date(content):
    assert build_bundle(content, False)["profile"]["cv_file"] == "/c/cv/test_cv.pdf"
    content.profile.cv_reviewed_by_hamza = None
    assert build_bundle(content, False)["profile"]["cv_file"] is None


def test_asset_paths_rewritten(content):
    b = build_bundle(content, False)
    assert b["profile"]["photo_dark"]["src"] == "/c/photo/test_dark.png"
    assert b["projects"][0]["cover"]["src"] == "/c/images/p013/cover.png"


def test_hash_ignores_generated_at(content, tmp_path):
    b1 = build_bundle(content, False)
    b2 = build_bundle(content, False)
    b2["generated_at"] = "1999-01-01T00:00:00Z"
    h1 = write_site(b1, FIX / "good", tmp_path / "s1")
    h2 = write_site(b2, FIX / "good", tmp_path / "s2")
    assert h1 == h2
    written = json.loads((tmp_path / "s1" / "data" / "content.json").read_text(encoding="utf-8"))
    assert written["hash"] == h1
    assert (tmp_path / "s1" / "public" / "content-hash.txt").read_text().strip() == h1
    content.news[0].text = "changed"
    assert build_bundle(content, False)["hash"] != h1


def test_write_site_copies_only_used_assets(content, tmp_path):
    content.profile.cv_reviewed_by_hamza = None
    write_site(build_bundle(content, False), FIX / "good", tmp_path)
    pub = tmp_path / "public" / "c"
    assert (pub / "photo" / "test_dark.png").is_file()
    assert (pub / "proofs" / "test_certificate.png").is_file()
    assert not (pub / "cv").exists()
    data = json.loads((tmp_path / "data" / "content.json").read_text(encoding="utf-8"))
    assert data["projects"][0]["slug"] == "p013-grid-contingency"


def test_hash_changes_when_an_image_changes(content, tmp_path):
    import shutil

    from tests.fixture_files import GOOD

    root = tmp_path / "content"
    shutil.copytree(GOOD, root)
    h1 = write_site(build_bundle(content, False), root, tmp_path / "s1")
    (root / "images" / "p013" / "cover.png").write_bytes(b"a different image")
    h2 = write_site(build_bundle(content, False), root, tmp_path / "s2")
    assert h1 != h2
    data = json.loads((tmp_path / "s2" / "data" / "content.json").read_text(encoding="utf-8"))
    assert data["hash"] == h2 == (tmp_path / "s2" / "public" / "content-hash.txt").read_text().strip()


def test_hash_changes_when_a_pulled_image_changes(content, tmp_path):
    site = tmp_path / "s"
    pulled = site / "public" / "c" / "sources" / "x" / "abc-cover.png"
    pulled.parent.mkdir(parents=True)
    pulled.write_bytes(b"one")
    h1 = write_site(build_bundle(content, False), FIX / "good", site)
    pulled.write_bytes(b"two")
    h2 = write_site(build_bundle(content, False), FIX / "good", site)
    assert h1 != h2
