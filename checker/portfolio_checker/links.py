"""Link checker (plan Task 3; spec FR-8, FR-12)."""
from __future__ import annotations

import re
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Literal

import httpx
from markdown_it import MarkdownIt
from pydantic import HttpUrl, TypeAdapter, ValidationError

from .models import Content, Report

USER_AGENT = "Mozilla/5.0 (portfolio link check)"
TRIES = 3
WAITS = (1, 2)
TIMEOUT = 10.0
WORKERS = 8
SKIP_HINT = "If this site blocks robots (it opens fine in your browser), add it to content/link_check_skip.yml."

_sleep = time.sleep
_URL_IN_TEXT = re.compile(r"https?://[^\s<>()\[\]\"']+")
_md = MarkdownIt("commonmark")
_URL = TypeAdapter(HttpUrl)


def body_links(markdown: str) -> list[str]:
    """Every http(s) link in Markdown text; code blocks and inline code are ignored."""
    found: list[str] = []

    def walk(tokens) -> None:
        for t in tokens:
            if t.type in ("link_open", "image"):
                href = str(t.attrGet("href" if t.type == "link_open" else "src") or "")
                if href.startswith(("http://", "https://")):
                    found.append(href)
            elif t.type == "text":
                found.extend(u.rstrip(".,;:!?") for u in _URL_IN_TEXT.findall(t.content))
            if t.children:
                walk(t.children)

    walk(_md.parse(markdown))
    return found


def normal_url(url: str) -> str:
    """One written form per address (as pydantic writes it), so the skip list matches exactly."""
    try:
        return str(_URL.validate_python(url))
    except ValidationError:
        return url


def all_links(content: Content) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    prof = "content/profile.yml"
    out += [(prof, str(u)) for u in content.profile.links.values()]
    if content.profile.english_test.url:
        out.append((prof, str(content.profile.english_test.url)))
    out += [("content/news.yml", str(n.link.url)) for n in content.news]
    for p in content.projects:
        out += [(p.file, str(u)) for u in p.links.values()]
        out += [(p.file, u) for u in body_links(p.body)]
    for t in content.teaching:
        out += [("content/teaching.yml", str(v.url)) for v in t.videos]
    out += [("content/awards.yml", str(a.proof_url)) for a in content.awards]
    out = [(f, normal_url(u)) for f, u in out]
    seen: set[tuple[str, str]] = set()
    return [x for x in out if not (x in seen or seen.add(x))]


def _try_once(client: httpx.Client, url: str) -> tuple[bool, str]:
    """One check: a GET with a browser-like User-Agent, streamed so only the status line and headers are read.

    HEAD is never trusted on its own: some sites answer HEAD with 200 while the page itself is gone.
    The response is closed without reading its body.
    """
    try:
        with client.stream(
            "GET", url, follow_redirects=True, timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}
        ) as resp:
            status = resp.status_code
    except httpx.HTTPError as exc:
        return False, f"error: {type(exc).__name__}"
    if status < 400:
        return True, str(status)
    return False, f"status {status}"


def check_url(client: httpx.Client, url: str) -> tuple[bool, str]:
    why = ""
    for attempt in range(TRIES):
        good, why = _try_once(client, url)
        if good:
            return True, why
        if attempt < TRIES - 1:
            _sleep(WAITS[attempt])
    return False, why


def check_links(
    content: Content, mode: Literal["push", "daily"], client: httpx.Client | None = None
) -> Report:
    report = Report()
    skip = {normal_url(str(s.url)) for s in content.skip_links}
    pairs = [(f, u) for f, u in all_links(content) if u not in skip]
    urls = list(dict.fromkeys(u for _, u in pairs))
    own = client is None
    client = client or httpx.Client(timeout=TIMEOUT)
    try:
        with ThreadPoolExecutor(max_workers=WORKERS) as pool:
            results = dict(zip(urls, pool.map(lambda u: check_url(client, u), urls)))
    finally:
        if own:
            client.close()
    for file, url in pairs:
        good, why = results[url]
        if not good:
            msg = f"the link {url} did not answer ({why}). {SKIP_HINT}"
            (report.error if mode == "push" else report.warn)(file, msg)
    return report
