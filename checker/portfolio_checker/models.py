"""Pydantic models for every content file (spec §7, plan Task 1)."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import Annotated, Any, Literal

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    EmailStr,
    Field,
    HttpUrl,
    PrivateAttr,
    StrictBool,
    StrictInt,
    StrictStr,
)

# --------------------------------------------------------------------------- report


class Problem(BaseModel):
    file: str
    message: str


@dataclass
class Report:
    errors: list[Problem] = field(default_factory=list)
    warnings: list[Problem] = field(default_factory=list)

    def ok(self) -> bool:
        return not self.errors

    def error(self, file: str, message: str) -> None:
        self.errors.append(Problem(file=file, message=message))

    def warn(self, file: str, message: str) -> None:
        self.warnings.append(Problem(file=file, message=message))

    def extend(self, other: "Report") -> "Report":
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)
        return self


# --------------------------------------------------------------------------- field types


def _not_blank(v: str) -> str:
    if not v.strip():
        raise ValueError("is empty")
    return v


Text = Annotated[StrictStr, AfterValidator(_not_blank)]

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")


def _slug(v: str) -> str:
    if not SLUG_RE.match(v):
        raise ValueError(f'"{v}" is not a safe slug (use only a-z, 0-9 and -, starting with a letter or number)')
    return v


Slug = Annotated[StrictStr, AfterValidator(_slug)]


def _safe_path(v: str) -> str:
    if "\\" in v:
        raise ValueError(f'"{v}": use / in paths')
    if not v.strip():
        raise ValueError("is empty")
    if v.startswith("/") or re.match(r"^[A-Za-z]:", v) or ".." in v.split("/"):
        raise ValueError(f'"{v}" must be a path inside content/ (no "..", no leading "/", no drive letter)')
    return v


SafePath = Annotated[StrictStr, AfterValidator(_safe_path)]


def _real_date(v: Any) -> date:
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            try:
                return date.fromisoformat(v)
            except ValueError:
                pass
        raise ValueError(f'"{v}" is not a real date (use YYYY-MM-DD)')
    raise ValueError(f'"{v}" is not a real date (use YYYY-MM-DD)')


Day = Annotated[date, BeforeValidator(_real_date)]


def _year_month(v: Any) -> str:
    if isinstance(v, date):
        return v.isoformat()
    if isinstance(v, int) and not isinstance(v, bool):
        v = str(v)
    if isinstance(v, str):
        m = re.fullmatch(r"(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?", v)
        if m:
            y, mo, d = m.groups()
            try:
                date(int(y), int(mo or 1), int(d or 1))
                return v
            except ValueError:
                pass
    raise ValueError(f'"{v}" is not a real date (use YYYY, YYYY-MM or YYYY-MM-DD)')


YearMonth = Annotated[str, BeforeValidator(_year_month)]

TEAM_RE = re.compile(r"^(solo|team of ([2-9]|[1-9]\d+))$")


def _team(v: str) -> str:
    if not TEAM_RE.match(v):
        raise ValueError(f'"{v}" must be "solo" or "team of N" (N is 2 or more)')
    return v


Team = Annotated[StrictStr, AfterValidator(_team)]

Status = Literal["draft", "published"]
LinkLabel = Literal["code", "demo", "video", "proof", "paper"]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# --------------------------------------------------------------------------- models


class Link(Strict):
    label: LinkLabel
    url: HttpUrl


class Image(Strict):
    src: SafePath
    alt: Annotated[Text, Field(min_length=3)]


class EnglishTest(Strict):
    text: Text
    url: HttpUrl | None = None


class Profile(Strict):
    name: Text
    tagline: Text
    summary: Text
    photo_dark: Image
    photo_light: Image
    email: EmailStr
    links: dict[Literal["github", "linkedin", "leetcode", "lablab", "devpost"], HttpUrl]
    english_test: EnglishTest
    cv_file: SafePath | None = None
    cv_reviewed_by_hamza: Day | None = None
    reviewed_by_hamza: Day | None = None


class Interest(Strict):
    slug: Slug
    label: Text
    sentence: Text


class InterestsFile(Strict):
    reviewed_by_hamza: Day | None = None
    items: list[Interest]


class NewsItem(Strict):
    slug: Slug
    text: Text
    date: YearMonth
    link: Link
    status: Status
    reviewed_by_hamza: Day | None = None
    pin: StrictInt | None = None


class Project(Strict):
    title: Text
    subtitle: Text
    slug: Slug
    summary: Text
    result: Text
    kind: Literal["research", "hackathon"]
    status: Status
    reviewed_by_hamza: Day | None = None
    date: YearMonth
    tags: list[Text]
    team: Team
    my_role: Text | None = None
    cover: Image | None = None
    images: list[Image] = []
    links: dict[LinkLabel, HttpUrl] = {}
    proofs: list[Text] = []
    pin: StrictInt | None = None
    body: StrictStr = ""
    # where the project came from, for messages (not a content field)
    _file: str = PrivateAttr(default="")

    @property
    def file(self) -> str:
        return self._file or f"content/projects/{self.slug}.md"


class Video(Strict):
    title: Text
    url: HttpUrl


class TeachingItem(Strict):
    slug: Slug
    title: Text
    org: Text
    role: Text
    text: Text
    date: YearMonth
    videos: list[Video] = []
    status: Status
    reviewed_by_hamza: Day | None = None
    pin: StrictInt | None = None


class Award(Strict):
    slug: Slug
    text: Text
    date: YearMonth
    group: Literal["main", "other"]
    proof_url: HttpUrl
    proof_id: Text | None = None
    status: Status
    reviewed_by_hamza: Day | None = None
    pin: StrictInt | None = None


class SkillGroup(Strict):
    name: Text
    items: list[Text]


class SkillsFile(Strict):
    reviewed_by_hamza: Day | None = None
    groups: list[SkillGroup]


class ProofFile(Strict):
    id: Text
    file: SafePath
    note: Text
    private_info_checked: StrictBool


class SkipLink(Strict):
    url: HttpUrl
    checked_by_hamza: Day | None = None


class Source(Strict):
    repo: Annotated[StrictStr, Field(pattern=r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")]


class Content(BaseModel):
    profile: Profile
    interests: InterestsFile
    news: list[NewsItem]
    projects: list[Project]
    teaching: list[TeachingItem]
    awards: list[Award]
    skills: SkillsFile
    proofs: list[ProofFile]
    skip_links: list[SkipLink]
    sources: list[Source]
