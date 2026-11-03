"""Turn checked content into `site/data/content.json` plus assets (plan Task 6; spec FR-3, FR-5, FR-24)."""
from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, TypeVar

from .models import Content

T = TypeVar("T")
ASSET_PREFIX = "/c/"
SOURCE_PREFIX = "/c/sources/"


def _date_key(value: str) -> tuple[int, int, int]:
    parts = [int(x) for x in value.split("-")] + [0, 0]
    return parts[0], parts[1], parts[2]


def sort_items(items: Iterable[T]) -> list[T]:
    """Pinned first (pin ascending), then newest first, then slug (FR-5)."""

    def key(item: Any) -> tuple:
        y, m, d = _date_key(item.date)
        pinned = item.pin is not None
        return (0 if pinned else 1, item.pin if pinned else 0, -y, -m, -d, item.slug)

    return sorted(items, key=key)


def _asset(src: str) -> str:
    return src if src.startswith(ASSET_PREFIX) else ASSET_PREFIX + src


def _image(img: dict | None) -> dict | None:
    if img is None:
        return None
    return {**img, "src": _asset(img["src"])}


def _json_text(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, sort_keys=True, indent=1)


def _hash(bundle: dict) -> str:
    stable = {k: v for k, v in bundle.items() if k not in ("hash", "generated_at")}
    return hashlib.sha256(_json_text(stable).encode("utf-8")).hexdigest()


def build_bundle(content: Content, include_drafts: bool) -> dict:
    def visible(items: Iterable[T]) -> list[T]:
        return sort_items(i for i in items if include_drafts or i.status == "published")

    proof_files = {p.id: p.file for p in content.proofs}

    def proof_link(pid: str) -> dict:
        return {"label": "proof", "url": _asset(proof_files[pid])}

    prof = content.profile.model_dump(mode="json")
    prof["photo_dark"] = _image(prof["photo_dark"])
    prof["photo_light"] = _image(prof["photo_light"])
    prof["cv_file"] = (
        _asset(prof["cv_file"]) if prof["cv_file"] and content.profile.cv_reviewed_by_hamza else None
    )

    news = [n.model_dump(mode="json") for n in visible(content.news)]

    projects = []
    for p in visible(content.projects):
        d = p.model_dump(mode="json")
        d["cover"] = _image(d["cover"])
        d["images"] = [_image(i) for i in d["images"]]
        d["proofs"] = [proof_link(pid) for pid in p.proofs]
        projects.append(d)

    teaching = [t.model_dump(mode="json") for t in visible(content.teaching)]

    awards: dict[str, list[dict]] = {"main": [], "other": []}
    for a in visible(content.awards):
        d = a.model_dump(mode="json")
        d["proof_file"] = proof_link(a.proof_id) if a.proof_id else None
        del d["proof_id"]
        awards[a.group].append(d)

    index: list[dict] = []
    for p in projects:
        index.append({"kind": "project", "slug": p["slug"], "title": p["title"],
                      "text": " ".join([p["subtitle"], p["summary"], p["result"], " ".join(p["tags"])]),
                      "url": f"/projects/{p['slug']}"})
    for a in awards["main"] + awards["other"]:
        index.append({"kind": "award", "slug": a["slug"], "title": a["text"], "text": a["text"],
                      "url": "/#awards"})
    for n in news:
        index.append({"kind": "news", "slug": n["slug"], "title": n["text"], "text": n["text"], "url": "/#news"})
    for t in teaching:
        index.append({"kind": "teaching", "slug": t["slug"], "title": t["title"],
                      "text": " ".join([t["org"], t["role"], t["text"]]), "url": "/#teaching"})

    bundle = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "include_drafts": include_drafts,
        "profile": prof,
        "interests": [i.model_dump(mode="json") for i in content.interests.items],
        "news": news,
        "projects": projects,
        "teaching": teaching,
        "awards": awards,
        "skills": [g.model_dump(mode="json") for g in content.skills.groups],
        "search_index": index,
    }
    bundle["hash"] = _hash(bundle)
    return bundle


def used_assets(bundle: dict) -> list[str]:
    """Every local `/c/...` path in the bundle (not pulled `/c/sources/` files), relative to content/."""
    found: set[str] = set()

    def walk(v: Any) -> None:
        if isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif isinstance(v, str) and v.startswith(ASSET_PREFIX) and not v.startswith(SOURCE_PREFIX):
            found.add(v[len(ASSET_PREFIX):])

    walk(bundle)
    return sorted(found)


def write_site(bundle: dict, content_root: Path, site_root: Path) -> str:
    """Write content.json, copy used assets to public/c/, write content-hash.txt. Returns the hash."""
    site_root = Path(site_root)
    h = _hash(bundle)
    bundle = {**bundle, "hash": h}
    data_dir = site_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "content.json").write_text(_json_text(bundle) + "\n", encoding="utf-8")
    pub = site_root / "public"
    for rel in used_assets(bundle):
        target = pub / "c" / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(Path(content_root) / rel, target)
    pub.mkdir(parents=True, exist_ok=True)
    (pub / "content-hash.txt").write_text(h + "\n", encoding="utf-8")
    return h
