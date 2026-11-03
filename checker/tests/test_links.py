from __future__ import annotations

import threading

import httpx
import pytest

from portfolio_checker import links
from portfolio_checker.links import all_links, check_links
from portfolio_checker.load import load_content
from tests.conftest import FIX


@pytest.fixture
def content():
    c, r = load_content(FIX / "good")
    assert r.ok(), r.errors
    return c


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    waits: list[float] = []
    monkeypatch.setattr(links, "_sleep", waits.append)
    return waits


class Recorder:
    """A MockTransport handler: answers by URL, records every call."""

    def __init__(self, answers=None, default=200):
        self.answers = answers or {}
        self.default = default
        self.calls: list[tuple[str, str]] = []
        self.lock = threading.Lock()

    def __call__(self, request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        with self.lock:
            self.calls.append((request.method, url))
            n = sum(1 for _, u in self.calls if u == url)
        ans = self.answers.get(url, self.default)
        if callable(ans):
            ans = ans(request, n)
        return httpx.Response(ans)

    def client(self) -> httpx.Client:
        return httpx.Client(transport=httpx.MockTransport(self))


def test_ok_link_passes(content):
    rec = Recorder()
    r = check_links(content, "push", rec.client())
    assert r.ok() and not r.warnings, r.errors
    assert ("HEAD", "https://example.com/code/test-project") in rec.calls


def test_markdown_body_link_is_checked(content):
    found = [u for _, u in all_links(content)]
    assert "https://example.com/body-link" in found
    assert "https://example.com/in-a-code-block-not-checked" not in found
    rec = Recorder()
    check_links(content, "push", rec.client())
    assert any(u == "https://example.com/body-link" for _, u in rec.calls)


def test_404_is_error_on_push(content):
    rec = Recorder({"https://example.com/demo/test-project": 404})
    r = check_links(content, "push", rec.client())
    assert len(r.errors) == 1, r.errors
    p = r.errors[0]
    assert p.file == "content/projects/p013-grid-contingency.md"
    assert "https://example.com/demo/test-project" in p.message and "404" in p.message
    assert p.message.endswith(
        "If this site blocks robots (it opens fine in your browser), add it to content/link_check_skip.yml."
    )


def test_404_is_warning_on_daily(content):
    rec = Recorder({"https://example.com/demo/test-project": 404})
    r = check_links(content, "daily", rec.client())
    assert r.ok()
    assert len(r.warnings) == 1


def test_head_405_falls_back_to_get(content):
    url = "https://example.com/code/test-project"

    def answer(request, n):
        if request.method == "HEAD":
            return 405
        assert request.headers["user-agent"] == "Mozilla/5.0 (portfolio link check)"
        return 200

    rec = Recorder({url: answer})
    r = check_links(content, "push", rec.client())
    assert r.ok(), r.errors
    assert ("GET", url) in rec.calls


def test_skip_url_not_fetched(content):
    skipped = "https://www.linkedin.com/in/test-person"
    rec = Recorder()
    r = check_links(content, "push", rec.client())
    assert r.ok()
    assert all(u != skipped for _, u in rec.calls)
    assert all("linkedin.com/posts/test-person-post" not in u for _, u in rec.calls)


def test_similar_url_still_checked(content):
    similar = "https://www.linkedin.com/in/test-persom"
    content.profile.links["linkedin"] = similar
    rec = Recorder()
    check_links(content, "push", rec.client())
    assert any(u == similar for _, u in rec.calls)


def test_retries_three_times(content, no_sleep):
    url = "https://example.com/code/test-project"
    rec = Recorder({url: lambda req, n: 503 if n <= 2 else 200})  # two 503, then 200
    r = check_links(content, "push", rec.client())
    assert r.ok(), r.errors
    assert no_sleep == [1, 2]


def test_gives_up_after_three_tries(content, no_sleep):
    url = "https://example.com/code/test-project"
    rec = Recorder({url: 503})
    r = check_links(content, "push", rec.client())
    assert len(r.errors) == 2  # the URL is used by the project and by a news item
    assert sum(1 for m, u in rec.calls if u == url and m == "HEAD") == 3


def test_network_error_is_broken(content):
    url = "https://example.com/code/test-project"

    def answer(request, n):
        raise httpx.ConnectError("no route")

    rec = Recorder({url: answer})
    r = check_links(content, "push", rec.client())
    assert r.errors and "did not answer" in r.errors[0].message
