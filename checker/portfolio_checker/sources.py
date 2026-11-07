"""Projects from `portfolio.yml` in Hamza's public repos (plan Task 5; spec FR-2, §9)."""
from __future__ import annotations

import hashlib
import shutil
import time
from pathlib import Path, PurePosixPath

import httpx
import yaml
from pydantic import ValidationError

from .load import read_yaml_text, simple_errors
from .models import Project, Report, Source
from .rules import MAX_IMAGE_BYTES

RAW = "https://raw.githubusercontent.com"
TRIES = 3
WAITS = (1, 2)
TIMEOUT = 10.0
_sleep = time.sleep


class _Missing(Exception):
    """The file answered 404."""


class _TooBig(Exception):
    pass


def _fetch(client: httpx.Client, url: str, limit: int | None = None) -> bytes:
    """GET with 3 tries. Raises _Missing on 404, _TooBig past `limit`, RuntimeError on other failures."""
    why = ""
    for attempt in range(TRIES):
        try:
            with client.stream("GET", url, timeout=TIMEOUT, follow_redirects=True) as resp:
                if resp.status_code == 404:
                    raise _Missing(url)
                if resp.status_code >= 400:
                    why = f"status {resp.status_code}"
                else:
                    data = bytearray()
                    for chunk in resp.iter_bytes():
                        data.extend(chunk)
                        if limit is not None and len(data) > limit:
                            raise _TooBig(url)
                    return bytes(data)
        except httpx.HTTPError as exc:
            why = f"error: {type(exc).__name__}"
        if attempt < TRIES - 1:
            _sleep(WAITS[attempt])
    raise RuntimeError(why)


def _pull_one(src: Source, site_public: Path, client: httpx.Client, report: Report) -> Project | None:
    repo = src.repo
    label = f"{repo}/portfolio.yml"
    try:
        raw = _fetch(client, f"{RAW}/{repo}/HEAD/portfolio.yml")
    except _Missing:
        report.warn("content/sources.yml", f"{repo}: no public portfolio.yml found (the repo may be private, "
                                           "deleted or renamed); its project is skipped")
        return None
    except RuntimeError as exc:
        report.error(label, f"could not be read after {TRIES} tries ({exc}); nothing deploys, try again later")
        return None
    try:
        data = read_yaml_text(raw.decode("utf-8"))
    except (UnicodeDecodeError, yaml.YAMLError) as exc:
        report.error(label, f"is not valid YAML text: {exc}")
        return None
    if not isinstance(data, dict):
        report.error(label, "must be a list of fields (key: value)")
        return None
    try:
        project = Project.model_validate(data)
    except ValidationError as exc:
        for msg in simple_errors(exc):
            report.error(label, msg)
        return None
    project._file = label

    dest_dir = (site_public / "c" / "sources" / project.slug).resolve()
    images = ([project.cover] if project.cover else []) + list(project.images)
    planned = []
    for img in images:
        name = PurePosixPath(img.src).name
        digest = hashlib.sha256(img.src.encode("utf-8")).hexdigest()[:12]
        target = (dest_dir / f"{digest}-{name}").resolve()
        if target.parent != dest_dir:
            report.error(label, f'image "{img.src}" would be saved outside its folder')
            return None
        planned.append((img, target, f"/c/sources/{project.slug}/{digest}-{name}"))

    downloaded: list[tuple[Path, bytes]] = []
    for img, target, _ in planned:
        url = f"{RAW}/{repo}/HEAD/{img.src}"
        try:
            downloaded.append((target, _fetch(client, url, limit=MAX_IMAGE_BYTES)))
        except _TooBig:
            report.error(label, f'image "{img.src}" is bigger than 2 MB; images must be at most 2 MB')
            return None
        except _Missing:
            report.error(label, f'image "{img.src}" is listed but not found in the repo')
            return None
        except RuntimeError as exc:
            report.error(label, f'image "{img.src}" could not be downloaded after {TRIES} tries ({exc})')
            return None

    if dest_dir.exists():
        shutil.rmtree(dest_dir)
    dest_dir.mkdir(parents=True)
    for target, data in downloaded:
        target.write_bytes(data)
    for img, _, web in planned:
        img.src = web
    return project


def pull_sources(
    sources: list[Source], site_public: Path, client: httpx.Client | None = None
) -> tuple[list[Project], Report]:
    report = Report()
    projects: list[Project] = []
    own = client is None
    client = client or httpx.Client(timeout=TIMEOUT)
    try:
        for src in sources:
            project = _pull_one(src, Path(site_public), client, report)
            if project is not None:
                projects.append(project)
    finally:
        if own:
            client.close()
    return projects, report
