from __future__ import annotations

import pytest

from portfolio_checker import db_sync
from portfolio_checker.__main__ import main
from portfolio_checker.db_sync import sync_db
from tests.conftest import copy_good

FAKE_URL = "postgresql://fake-host/db"  # no password: a test address only

INDEX = [
    {"kind": "project", "slug": "a", "title": "A", "text": "alpha", "url": "/projects/a"},
    {"kind": "news", "slug": "b", "title": "B", "text": "beta", "url": "/#news"},
]


@pytest.fixture(autouse=True)
def no_sleep(monkeypatch):
    monkeypatch.setattr(db_sync, "_sleep", lambda s: None)


class FakeCursor:
    def __init__(self, log):
        self.log = log

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def execute(self, sql, params=None):
        self.log.append(("execute", " ".join(sql.split()), params))

    def executemany(self, sql, rows):
        self.log.append(("executemany", " ".join(sql.split()), list(rows)))


class FakeConn:
    def __init__(self, log):
        self.log = log

    def __enter__(self):
        return self

    def __exit__(self, exc_type, *rest):
        self.log.append(("rollback",) if exc_type else ("commit",))
        return False

    def cursor(self):
        return FakeCursor(self.log)


def test_upserts_and_deletes_removed():
    log: list = []
    urls: list = []

    def connect(url, **kw):
        urls.append(url)
        return FakeConn(log)

    r = sync_db(INDEX, FAKE_URL, connect=connect)
    assert r.ok() and not r.warnings
    assert urls == [FAKE_URL]
    many = [x for x in log if x[0] == "executemany"]
    assert len(many) == 1 and "on conflict (kind, slug) do update" in many[0][1]
    assert many[0][2] == [("project", "a", "A", "alpha", "/projects/a"), ("news", "b", "B", "beta", "/#news")]
    deletes = [x for x in log if x[0] == "execute" and x[1].startswith("delete from items")]
    assert len(deletes) == 1 and deletes[0][2] == (["project", "news"], ["a", "b"])
    assert log[-1] == ("commit",)


def test_empty_index_deletes_all():
    log: list = []
    sync_db([], FAKE_URL, connect=lambda url, **kw: FakeConn(log))
    assert any(x[0] == "execute" and x[1] == "delete from items" for x in log)


def test_no_url_is_warning():
    r = sync_db(INDEX, None, connect=lambda *a, **k: pytest.fail("must not connect"))
    assert r.ok()
    assert r.warnings[0].message == "database not set, search uses the built-in copy"


def test_three_failures_is_warning_not_error():
    calls = []

    def connect(url, **kw):
        calls.append(url)
        raise OSError("connection refused to " + url)

    r = sync_db(INDEX, FAKE_URL, connect=connect)
    assert r.ok() and len(calls) == 3
    assert len(r.warnings) == 1
    assert FAKE_URL not in r.warnings[0].message and "fake-host" not in r.warnings[0].message


def test_second_try_works():
    tries = []

    def connect(url, **kw):
        tries.append(1)
        if len(tries) == 1:
            raise OSError("down")
        return FakeConn([])

    r = sync_db(INDEX, FAKE_URL, connect=connect)
    assert r.ok() and not r.warnings and len(tries) == 2


def test_cli_refuses_sync_with_drafts(tmp_path, capsys):
    root = copy_good(tmp_path)
    args = ["--content", str(root), "--site", str(tmp_path / "site"), "--repo", str(tmp_path),
            "--skip-network", "--include-drafts", "--sync-db"]
    assert main(args) == 1
    assert "drafts never go to the database" in capsys.readouterr().out
    assert not (tmp_path / "site" / "data").exists()


def test_cli_sync_without_url_warns(tmp_path, capsys, monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    root = copy_good(tmp_path)
    args = ["--content", str(root), "--site", str(tmp_path / "site"), "--repo", str(tmp_path),
            "--skip-network", "--sync-db"]
    assert main(args) == 0
    assert "WARNING" in capsys.readouterr().out
