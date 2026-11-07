from __future__ import annotations

import hashlib

import httpx
import pytest

from portfolio_checker import sources
from portfolio_checker.models import Source
from portfolio_checker.sources import pull_sources
from tests.fixture_files import tiny_png

RAW = "https://raw.githubusercontent.com"
REPO = "Test-Owner/test-repo"

YML = """\
title: "A pulled test project"
subtitle: "From a public repo"
slug: pulled-project
kind: hackathon
status: published
reviewed_by_hamza: 2026-10-24
date: 2026-09
tags: [test]
team: "team of 3"
summary: "Pulled summary."
result: "Pulled result."
cover: { src: docs/img/cover.png, alt: "Pulled cover" }
images:
  - { src: other/cover.png, alt: "Another image with the same name" }
links:
  code: https://github.com/Test-Owner/test-repo
body: |
  ## Problem
  Text.
"""

PNG = tiny_png()


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    monkeypatch.setattr(sources, "_sleep", lambda s: None)


def _client(answers: dict, calls: list | None = None) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if calls is not None:
            calls.append(url)
        ans = answers.get(url, 404)
        if callable(ans):
            ans = ans()
        if isinstance(ans, int):
            return httpx.Response(ans)
        return httpx.Response(200, content=ans if isinstance(ans, bytes) else ans.encode())

    return httpx.Client(transport=httpx.MockTransport(handler))


def _answers(yml: str = YML) -> dict:
    return {
        f"{RAW}/{REPO}/HEAD/portfolio.yml": yml,
        f"{RAW}/{REPO}/HEAD/docs/img/cover.png": PNG,
        f"{RAW}/{REPO}/HEAD/other/cover.png": PNG + b"2",
    }


def _h(src: str) -> str:
    return hashlib.sha256(src.encode()).hexdigest()[:12]


def test_pulls_project_and_image(tmp_path):
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(_answers()))
    assert r.ok() and not r.warnings, (r.errors, r.warnings)
    assert len(projects) == 1
    p = projects[0]
    assert p.slug == "pulled-project" and p.body.startswith("## Problem")
    web = f"/c/sources/pulled-project/{_h('docs/img/cover.png')}-cover.png"
    assert p.cover.src == web
    assert (tmp_path / web.lstrip("/")).read_bytes() == PNG
    assert p.file == f"{REPO}/portfolio.yml"


def test_same_name_images_do_not_collide(tmp_path):
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(_answers()))
    assert r.ok()
    p = projects[0]
    assert p.cover.src != p.images[0].src
    assert (tmp_path / p.images[0].src.lstrip("/")).read_bytes() == PNG + b"2"


def test_missing_repo_is_warning_not_error(tmp_path):
    answers = _answers()
    other = "Test-Owner/gone"
    projects, r = pull_sources([Source(repo=other), Source(repo=REPO)], tmp_path, _client(answers))
    assert r.ok()
    assert len(r.warnings) == 1 and other in r.warnings[0].message
    assert [p.slug for p in projects] == ["pulled-project"]


def test_bad_portfolio_yml_is_error(tmp_path):
    for bad in (YML.replace('summary: "Pulled summary."\n', ""), "title: [unclosed"):
        projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(_answers(bad)))
        assert not r.ok() and projects == []
        assert r.errors[0].file == f"{REPO}/portfolio.yml"


def test_big_image_is_error(tmp_path):
    answers = _answers()
    answers[f"{RAW}/{REPO}/HEAD/docs/img/cover.png"] = b"\0" * (2 * 1024 * 1024 + 1)
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(answers))
    assert len(r.errors) == 1 and "2 MB" in r.errors[0].message
    assert projects == []


def test_source_image_without_alt_is_error(tmp_path):
    calls: list[str] = []
    yml = YML.replace('alt: "Pulled cover"', 'alt: ""')
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(_answers(yml), calls))
    assert not r.ok() and projects == []
    assert not any(u.endswith(".png") for u in calls)  # checked before any download


def test_source_unsafe_path_is_error(tmp_path):
    calls: list[str] = []
    yml = YML.replace("src: docs/img/cover.png", "src: ../../etc/passwd")
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(_answers(yml), calls))
    assert not r.ok() and projects == []
    assert not any("passwd" in u for u in calls)
    assert not (tmp_path / "c").exists()


def test_source_bad_slug_is_error(tmp_path):
    yml = YML.replace("slug: pulled-project", 'slug: "../evil"')
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(_answers(yml)))
    assert not r.ok() and projects == []
    assert "slug" in r.errors[0].message


def test_outage_is_error_not_skip(tmp_path):
    answers = _answers()
    answers[f"{RAW}/{REPO}/HEAD/portfolio.yml"] = 503
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(answers))
    assert len(r.errors) == 1 and projects == []
    assert not r.warnings


def test_missing_image_is_error(tmp_path):
    answers = _answers()
    del answers[f"{RAW}/{REPO}/HEAD/other/cover.png"]
    projects, r = pull_sources([Source(repo=REPO)], tmp_path, _client(answers))
    assert len(r.errors) == 1 and projects == []
