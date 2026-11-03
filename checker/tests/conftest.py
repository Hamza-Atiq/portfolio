from __future__ import annotations

import shutil
from pathlib import Path

import pytest

from tests.fixture_files import GOOD, ensure_fixture_files

FIX = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session", autouse=True)
def _fixture_files() -> None:
    ensure_fixture_files(GOOD)


def copy_good(dest: Path) -> Path:
    """Copy the good fixture to `dest/content` and return that folder."""
    ensure_fixture_files(GOOD)
    root = dest / "content"
    shutil.copytree(GOOD, root)
    return root


def copy_bad(dest: Path) -> Path:
    """The good fixture with the files of `fixtures/bad` laid on top."""
    root = copy_good(dest)
    for f in (FIX / "bad").iterdir():
        if f.name != "README.md":
            shutil.copy(f, root / f.name)
    return root


@pytest.fixture
def good_root(tmp_path: Path) -> Path:
    return copy_good(tmp_path)
