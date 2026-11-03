"""Cross-file rules (plan Task 2; spec FR-4, FR-8, §9)."""
from __future__ import annotations

from collections import Counter
from datetime import date
from pathlib import Path
from typing import Iterable

from .models import Content, Image, Report

MAX_IMAGE_BYTES = 2 * 1024 * 1024
SKIP_LINK_MAX_DAYS = 90
SOURCE_PREFIX = "/c/sources/"
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"}


def _dupes(slugs: Iterable[str]) -> list[str]:
    return sorted(s for s, n in Counter(slugs).items() if n > 1)


def inside(root: Path, rel: str) -> Path | None:
    """The real path of `rel` under `root`, or None if it leaves `root` (after following links)."""
    base = root.resolve()
    target = (root / rel).resolve()
    if target == base or base not in target.parents:
        return None
    return target


def check_file(root: Path, rel: str, report: Report, file: str, what: str) -> Path | None:
    """Shared path test: `/` only, inside content/, exists. Returns the real path when good."""
    if "\\" in rel:
        report.error(file, f'{what} "{rel}": use / in paths')
        return None
    real = inside(root, rel)
    if real is None:
        report.error(file, f'{what} "{rel}" points outside content/; files must stay inside content/')
        return None
    if not real.is_file():
        report.error(file, f'{what} "content/{rel}" does not exist')
        return None
    return real


def _check_image(img: Image, root: Path, report: Report, file: str) -> None:
    if img.src.startswith(SOURCE_PREFIX):
        return  # already checked by pull_sources (Task 5)
    real = check_file(root, img.src, report, file, "image")
    if real is not None and real.stat().st_size > MAX_IMAGE_BYTES:
        mb = real.stat().st_size / (1024 * 1024)
        report.error(file, f'image "content/{img.src}" is {mb:.1f} MB; images must be at most 2 MB')


def check_rules(content: Content, root: Path, today: date, include_drafts: bool) -> Report:
    report = Report()
    root = Path(root)

    # 1. unique slugs per kind
    for label, slugs in (
        ("content/news.yml", [n.slug for n in content.news]),
        ("content/teaching.yml", [t.slug for t in content.teaching]),
        ("content/awards.yml", [a.slug for a in content.awards]),
        ("content/interests.yml", [i.slug for i in content.interests.items]),
        ("content/proofs.yml", [p.id for p in content.proofs]),
    ):
        for s in _dupes(slugs):
            report.error(label, f'two items use the same slug "{s}"; every slug must be different')
    for s in _dupes(p.slug for p in content.projects):
        files = ", ".join(p.file for p in content.projects if p.slug == s)
        report.error(files, f'two projects use the same slug "{s}"; every slug must be different')

    # 2. review dates
    items = (
        [("content/news.yml", n) for n in content.news]
        + [("content/teaching.yml", t) for t in content.teaching]
        + [("content/awards.yml", a) for a in content.awards]
        + [(p.file, p) for p in content.projects]
    )
    for file, item in items:
        if item.status == "published" and item.reviewed_by_hamza is None:
            report.error(file, f'"{item.slug}" is published but has no reviewed_by_hamza date')
    if not include_drafts:
        for file, obj in (
            ("content/profile.yml", content.profile),
            ("content/interests.yml", content.interests),
            ("content/skills.yml", content.skills),
        ):
            if obj.reviewed_by_hamza is None:
                report.error(file, "has no reviewed_by_hamza date; Hamza must approve this file before it goes public")

    # 3. proofs
    proofs = {p.id: p for p in content.proofs}
    for p in content.proofs:
        real = check_file(root, p.file, report, "content/proofs.yml", f'proof "{p.id}" file')
        if p.private_info_checked is not True:
            report.error("content/proofs.yml", f'proof "{p.id}" has private_info_checked not true; the repo is '
                         "public, so open the file, check it has no private details, then set it to true")
        if real is not None and real.suffix.lower() in IMAGE_SUFFIXES and real.stat().st_size > MAX_IMAGE_BYTES:
            mb = real.stat().st_size / (1024 * 1024)
            report.error("content/proofs.yml", f'proof image "content/{p.file}" is {mb:.1f} MB; '
                         "images must be at most 2 MB")
    used: list[tuple[str, str]] = [("content/awards.yml", a.proof_id) for a in content.awards if a.proof_id]
    used += [(p.file, pid) for p in content.projects for pid in p.proofs]
    for file, pid in used:
        entry = proofs.get(pid)
        if entry is None:
            report.error(file, f'proof "{pid}" is not listed in content/proofs.yml')
    listed = {p.file for p in content.proofs}
    for folder in ("proofs", "cv"):
        base = root / folder
        if base.is_dir():
            for f in sorted(base.rglob("*")):
                if f.is_file() and f.relative_to(root).as_posix() not in listed:
                    rel = f.relative_to(root).as_posix()
                    report.error(f"content/{rel}", "this file is not listed in content/proofs.yml; "
                                 "add it there (after checking it for private details) or delete it")

    # 4. images
    prof = content.profile
    _check_image(prof.photo_dark, root, report, "content/profile.yml")
    _check_image(prof.photo_light, root, report, "content/profile.yml")
    for p in content.projects:
        for img in ([p.cover] if p.cover else []) + list(p.images):
            _check_image(img, root, report, p.file)

    # 5. CV
    if prof.cv_file:
        check_file(root, prof.cv_file, report, "content/profile.yml", "cv_file")
        entry = next((p for p in content.proofs if p.file == prof.cv_file), None)
        if entry is None:
            report.error("content/profile.yml", f'cv_file "{prof.cv_file}" is not listed in content/proofs.yml')

    # 6. links checked by hand
    for link in content.skip_links:
        if link.checked_by_hamza is None:
            msg = f"{link.url} has no checked_by_hamza date; open it in your browser, then add the date"
            if include_drafts:
                report.warn("content/link_check_skip.yml", msg)
            else:
                report.error("content/link_check_skip.yml", msg)
        elif (today - link.checked_by_hamza).days > SKIP_LINK_MAX_DAYS:
            report.warn("content/link_check_skip.yml",
                        f"{link.url} was last checked on {link.checked_by_hamza}; re-check this link by hand "
                        "and update checked_by_hamza")
    return report
