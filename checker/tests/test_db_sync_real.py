"""Runs the real sync against a real Postgres, only when TEST_DATABASE_URL is set (never in normal runs).

Example: TEST_DATABASE_URL=postgresql://postgres@localhost:55432/postgres python -m pytest tests/test_db_sync_real.py
"""
from __future__ import annotations

import os

import psycopg
import pytest

from portfolio_checker.db_sync import sync_db

URL = os.environ.get("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not URL, reason="TEST_DATABASE_URL not set")

ROWS = [
    {"kind": "project", "slug": "grid", "title": "Grid contingency screening", "text": "power line failures", "url": "/projects/grid"},
    {"kind": "news", "slug": "n1", "title": "Project published", "text": "Project published", "url": "/#news"},
]


def _rows():
    with psycopg.connect(URL) as conn:
        return conn.execute("select kind, slug, title, body from items order by kind, slug").fetchall()


def test_real_sync_upserts_updates_and_deletes():
    with psycopg.connect(URL) as conn:
        conn.execute("drop table if exists items")
    r = sync_db(ROWS, URL)
    assert r.ok() and not r.warnings, r.warnings
    assert [x[1] for x in _rows()] == ["n1", "grid"]
    changed = [{**ROWS[0], "title": "New title"}]
    r = sync_db(changed, URL)
    assert not r.warnings, r.warnings
    assert _rows() == [("project", "grid", "New title", "power line failures")]
    assert not sync_db([], URL).warnings
    assert _rows() == []


def test_real_search_query_matches():
    assert not sync_db(ROWS, URL).warnings
    sql = (
        "select slug from items where search @@ websearch_to_tsquery('english', %s) "
        "order by ts_rank(search, websearch_to_tsquery('english', %s)) desc limit 10"
    )
    with psycopg.connect(URL) as conn:
        assert [r[0] for r in conn.execute(sql, ("power failure", "power failure"))] == ["grid"]
        assert [r[0] for r in conn.execute(sql, ("published", "published"))] == ["n1"]
