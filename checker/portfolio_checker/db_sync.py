"""Copy the search index to Neon Postgres (plan Task 7; spec FR-10, FR-11, FR-13).

Never raises: the files are the master copy, so a database problem is only a warning.
"""
from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Callable

import psycopg

from .models import Report

SCHEMA = (Path(__file__).resolve().parents[1] / "schema.sql").read_text(encoding="utf-8")
WAITS = (1, 2, 4)
_sleep = time.sleep

UPSERT = """
insert into items (kind, slug, title, body, url) values (%s, %s, %s, %s, %s)
on conflict (kind, slug) do update
  set title = excluded.title, body = excluded.body, url = excluded.url
"""
DELETE_REMOVED = """
delete from items where (kind, slug) not in (
  select k, s from unnest(%s::text[], %s::text[]) as t(k, s)
)
"""


def sync_db(
    index: list[dict], database_url: str | None, tries: int = 3, connect: Callable[..., Any] = psycopg.connect
) -> Report:
    report = Report()
    if not database_url:
        report.warn("database", "database not set, search uses the built-in copy")
        return report
    rows = [(e["kind"], e["slug"], e["title"], e["text"], e["url"]) for e in index]
    why = ""
    for attempt in range(tries):
        try:
            with connect(database_url, connect_timeout=10) as conn:  # one transaction, committed on exit
                with conn.cursor() as cur:
                    cur.execute(SCHEMA)
                    if rows:
                        cur.executemany(UPSERT, rows)
                        cur.execute(DELETE_REMOVED, ([r[0] for r in rows], [r[1] for r in rows]))
                    else:
                        cur.execute("delete from items")
            return report
        except Exception as exc:  # noqa: BLE001 - any failure is only a warning (FR-11)
            why = type(exc).__name__  # never the message: it can contain the database address
            if attempt < tries - 1:
                _sleep(WAITS[min(attempt, len(WAITS) - 1)])
    report.warn("database", f"could not update the search database after {tries} tries ({why}); "
                            "the site still deploys and search uses the built-in copy")
    return report
