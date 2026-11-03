"""Read every content file into models. Never raises on bad content (plan Task 1)."""
from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ValidationError

from .models import (
    Award,
    Content,
    InterestsFile,
    NewsItem,
    Profile,
    Project,
    ProofFile,
    Report,
    SkillsFile,
    SkipLink,
    Source,
    TeachingItem,
)

# --------------------------------------------------------------------------- YAML


class _Loader(yaml.SafeLoader):
    """Safe loader that keeps an impossible date (2026-13-01) as text instead of crashing."""


def _timestamp(loader: yaml.SafeLoader, node: yaml.Node) -> Any:
    raw = loader.construct_scalar(node)
    try:
        value = yaml.SafeLoader.construct_yaml_timestamp(loader, node)
    except ValueError:
        return raw
    if isinstance(value, datetime):
        return raw  # a time of day is not allowed in a date field; keep text so it is refused
    return value


_Loader.add_constructor("tag:yaml.org,2002:timestamp", _timestamp)


def read_yaml_text(text: str) -> Any:
    text = text.lstrip("﻿").replace("\r\n", "\n")
    return yaml.load(text, Loader=_Loader)  # noqa: S506 - _Loader is a SafeLoader


def _yaml_problem(exc: yaml.YAMLError) -> str:
    mark = getattr(exc, "problem_mark", None)
    where = f" (line {mark.line + 1})" if mark else ""
    problem = getattr(exc, "problem", None) or str(exc)
    return f"is not valid YAML{where}: {problem}"


# --------------------------------------------------------------------------- errors


def _field_name(loc: tuple[Any, ...]) -> str:
    parts: list[str] = []
    for p in loc:
        if isinstance(p, int):
            parts.append(f"[{p + 1}]")
        elif "[" in p or "(" in p:
            continue
        else:
            parts.append(("." if parts else "") + p)
    return "".join(parts) or "the file"


def simple_errors(exc: ValidationError) -> list[str]:
    """Turn pydantic errors into one simple sentence each."""
    out: list[str] = []
    for e in exc.errors():
        name = _field_name(e["loc"])
        kind = e["type"]
        value = e.get("input")
        if kind == "missing":
            msg = f"{name} is missing"
        elif kind == "extra_forbidden":
            msg = f"{name} is not a known field (check the spelling)"
        elif kind == "string_type" and isinstance(value, bool):
            msg = f"{name} looks like yes/no; put it in quotes"
        elif kind == "string_type":
            msg = f"{name} must be text; put it in quotes"
        elif kind == "bool_type":
            msg = f"{name} must be true or false"
        elif kind == "value_error":
            msg = f"{name}: {e['msg'].removeprefix('Value error, ')}"
        elif kind in ("date_parsing", "date_from_datetime_parsing", "date_type"):
            msg = f'{name}: "{value}" is not a real date (use YYYY-MM-DD)'
        elif kind == "literal_error":
            msg = f"{name}: \"{value}\" is not allowed ({e['msg'].removeprefix('Input should be ')})"
        elif kind.startswith("url_"):
            msg = f'{name}: "{value}" is not a valid web address'
        else:
            msg = f"{name}: {e['msg']}"
        if msg not in out:
            out.append(msg)
    return out


# --------------------------------------------------------------------------- files


def _rel(root: Path, path: Path) -> str:
    return "content/" + path.relative_to(root).as_posix()


def _read(root: Path, name: str, report: Report) -> tuple[bool, Any]:
    path = root / name
    label = _rel(root, path)
    if not path.is_file():
        report.error(label, "this file is missing")
        return False, None
    try:
        return True, read_yaml_text(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        report.error(label, "is not saved as UTF-8 text")
    except yaml.YAMLError as exc:
        report.error(label, _yaml_problem(exc))
    return False, None


def _one(model: type[BaseModel], data: Any, label: str, report: Report) -> Any:
    if not isinstance(data, dict):
        report.error(label, "must be a list of fields (key: value)")
        return None
    try:
        return model.model_validate(data)
    except ValidationError as exc:
        for msg in simple_errors(exc):
            report.error(label, msg)
        return None


def _item_name(i: int, raw: Any) -> str:
    slug = raw.get("slug") or raw.get("id") if isinstance(raw, dict) else None
    return f'item {i} ("{slug}")' if isinstance(slug, str) else f"item {i}"


def _many(model: type[BaseModel], data: Any, label: str, report: Report) -> list[Any]:
    if data is None:
        return []
    if not isinstance(data, list):
        report.error(label, "must be a list of items (each starting with -)")
        return []
    out = []
    for i, raw in enumerate(data, start=1):
        name = _item_name(i, raw)
        if not isinstance(raw, dict):
            report.error(label, f"{name}: must be a list of fields (key: value)")
            continue
        try:
            out.append(model.model_validate(raw))
        except ValidationError as exc:
            for msg in simple_errors(exc):
                report.error(label, f"{name}: {msg}")
    return out


def split_markdown(text: str) -> tuple[str, str] | None:
    """Split a project file into (YAML header, Markdown body) on the first two `---` lines."""
    lines = text.lstrip("﻿").replace("\r\n", "\n").split("\n")
    if not lines or lines[0].strip() != "---":
        return None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return "\n".join(lines[1:i]), "\n".join(lines[i + 1 :])
    return None


def load_project(text: str, label: str, report: Report) -> Project | None:
    parts = split_markdown(text)
    if parts is None:
        report.error(label, "must start with a --- line, then the header fields, then another --- line")
        return None
    header, body = parts
    try:
        data = read_yaml_text(header)
    except yaml.YAMLError as exc:
        report.error(label, "the header " + _yaml_problem(exc))
        return None
    if not isinstance(data, dict):
        report.error(label, "the header must be a list of fields (key: value)")
        return None
    if "body" in data:
        report.error(label, "body is not a header field; write the page text after the second --- line")
        return None
    data["body"] = body
    name = f'project "{data["slug"]}"' if isinstance(data.get("slug"), str) else "project"
    try:
        project = Project.model_validate(data)
    except ValidationError as exc:
        for msg in simple_errors(exc):
            report.error(label, f"{name}: {msg}")
        return None
    project._file = label
    return project


def load_content(root: Path) -> tuple[Content | None, Report]:
    root = Path(root)
    report = Report()

    ok, data = _read(root, "profile.yml", report)
    profile = _one(Profile, data, "content/profile.yml", report) if ok else None
    ok, data = _read(root, "interests.yml", report)
    interests = _one(InterestsFile, data, "content/interests.yml", report) if ok else None
    ok, data = _read(root, "skills.yml", report)
    skills = _one(SkillsFile, data, "content/skills.yml", report) if ok else None

    lists: dict[str, list[Any]] = {}
    for key, name, model in (
        ("news", "news.yml", NewsItem),
        ("teaching", "teaching.yml", TeachingItem),
        ("awards", "awards.yml", Award),
        ("proofs", "proofs.yml", ProofFile),
        ("skip_links", "link_check_skip.yml", SkipLink),
        ("sources", "sources.yml", Source),
    ):
        ok, data = _read(root, name, report)
        lists[key] = _many(model, data, f"content/{name}", report) if ok else []

    projects: list[Project] = []
    proj_dir = root / "projects"
    if proj_dir.is_dir():
        for path in sorted(proj_dir.glob("*.md")):
            label = _rel(root, path)
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                report.error(label, "is not saved as UTF-8 text")
                continue
            project = load_project(text, label, report)
            if project is not None:
                projects.append(project)

    if not report.ok():
        return None, report
    content = Content(
        profile=profile,
        interests=interests,
        skills=skills,
        projects=projects,
        **lists,
    )
    return content, report


__all__ = ["load_content", "load_project", "read_yaml_text", "simple_errors", "split_markdown", "date"]
