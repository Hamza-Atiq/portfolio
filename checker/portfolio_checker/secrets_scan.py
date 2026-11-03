"""Secret and private-data scan (plan Task 4; constitution 8, spec FR-8).

Messages name the file and line, never the secret itself.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from .models import Report

SKIP_DIRS = {"node_modules", ".git", ".next", ".venv", "__pycache__", ".vercel"}

SECRETS: list[tuple[str, re.Pattern[str]]] = [
    ("an AWS access key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("an Anthropic API key", re.compile(r"sk-ant-[A-Za-z0-9_-]{20,}")),
    ("an API key (sk-...)", re.compile(r"sk-[A-Za-z0-9_-]{20,}")),
    ("a GitHub token", re.compile(r"gh[pousr]_[A-Za-z0-9]{36}")),
    ("a Google API key", re.compile(r"AIza[0-9A-Za-z_-]{35}")),
    ("a Groq API key", re.compile(r"gsk_[A-Za-z0-9]{20,}")),
    ("a database address with a password", re.compile(r"postgres(ql)?://[^\s:]+:[^\s@]+@")),
    ("a private key", re.compile("-----BEGIN " + r"[A-Z ]*PRIVATE KEY-----")),
]

PRIVATE: list[tuple[str, re.Pattern[str]]] = [
    ("a date of birth", re.compile(r"date of birth", re.IGNORECASE)),
    ("a date of birth (DOB)", re.compile(r"\bDOB\b")),
    ("an ID card number (CNIC)", re.compile(r"\bCNIC\b")),
    ("a passport number", re.compile(r"passport (no|number)", re.IGNORECASE)),
    ("a phone number", re.compile(r"(?<![\d\w])\+?92[ -]?3\d{2}[ -]?\d{7}(?!\d)")),
    ("a phone number", re.compile(r"(?<![\d\w])03\d{2}-?\d{7}(?!\d)")),
]


def _list_files(root: Path) -> list[Path]:
    if (root / ".git").exists():
        try:
            out = subprocess.run(
                ["git", "-c", "safe.directory=*", "-C", str(root), "ls-files", "-z"],
                capture_output=True, check=True,
            ).stdout.decode("utf-8")
            return [root / f for f in out.split("\0") if f]
        except (OSError, subprocess.CalledProcessError):
            pass
    return [
        p for p in sorted(root.rglob("*"))
        if p.is_file() and not SKIP_DIRS.intersection(p.relative_to(root).parts)
    ]


def _is_binary(data: bytes) -> bool:
    # PDFs are binary too: their text is not read; privacy for PDFs = private_info_checked.
    return b"\0" in data[:8192] or data[:5] == b"%PDF-"


def scan_repo(repo_root: Path, files: list[Path] | None = None) -> Report:
    root = Path(repo_root).resolve()
    report = Report()
    for path in files if files is not None else _list_files(root):
        path = Path(path)
        path = path if path.is_absolute() else root / path
        if not path.is_file():
            continue
        try:
            rel = path.resolve().relative_to(root).as_posix()
        except ValueError:
            rel = path.as_posix()
        data = path.read_bytes()
        if _is_binary(data):
            continue
        text = data.decode("utf-8", errors="replace")
        checks = SECRETS + (PRIVATE if rel.startswith("content/") else [])
        for n, line in enumerate(text.splitlines(), start=1):
            for what, pattern in checks:
                if pattern.search(line):
                    report.error(rel, f"line {n}: looks like {what}; remove it (secrets belong in GitHub/Vercel "
                                      "secrets, private details never go in the repo)")
                    break
    return report
