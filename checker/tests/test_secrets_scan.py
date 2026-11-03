from __future__ import annotations

from pathlib import Path

from portfolio_checker.secrets_scan import scan_repo

# Tokens are built by joining parts, so this repo's own scan stays clean.
GH_TOKEN = "gh" + "p_" + "A1b2C3d4E5f6G7h8I9j0" + "K1l2M3n4O5p6Q7r8"
PG_URL = "postgres" + "ql://user:" + "s3cretpass" + "@db.example.com/main"
PHONE = "+92 " + "300 " + "1234567"


def _repo(tmp_path: Path, files: dict[str, str]) -> Path:
    for rel, text in files.items():
        p = tmp_path / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
    return tmp_path


def test_finds_github_token(tmp_path):
    repo = _repo(tmp_path, {"site/lib/x.ts": f"const a = 1;\nconst t = '{GH_TOKEN}';\n"})
    r = scan_repo(repo)
    assert len(r.errors) == 1
    p = r.errors[0]
    assert p.file == "site/lib/x.ts"
    assert "line 2" in p.message
    assert GH_TOKEN not in p.message and GH_TOKEN[:10] not in p.message


def test_finds_postgres_url_with_password(tmp_path):
    repo = _repo(tmp_path, {".env.example": f"DATABASE_URL={PG_URL}\n"})
    r = scan_repo(repo)
    assert len(r.errors) == 1 and "s3cretpass" not in r.errors[0].message


def test_finds_pk_phone_in_content(tmp_path):
    repo = _repo(tmp_path, {"content/profile.yml": f"name: X\nphone: '{PHONE}'\n"})
    r = scan_repo(repo)
    assert len(r.errors) == 1 and "line 2" in r.errors[0].message


def test_dob_word_only_in_content(tmp_path):
    repo = _repo(
        tmp_path,
        {
            "checker/portfolio_checker/x.py": "# never show the date of birth\n",
            "content/news.yml": "- text: 'Date of birth: 1 Jan'\n",
        },
    )
    r = scan_repo(repo)
    assert [p.file for p in r.errors] == ["content/news.yml"]


def test_clean_repo_passes(tmp_path):
    repo = _repo(tmp_path, {"content/news.yml": "- text: 'all good'\n", "README.md": "# hi\n"})
    (repo / "content" / "photo.png").write_bytes(b"\x89PNG\x00\x00" + GH_TOKEN.encode())
    (repo / "node_modules" / "pkg").mkdir(parents=True)
    (repo / "node_modules" / "pkg" / "a.js").write_text(GH_TOKEN)
    assert scan_repo(repo).ok()


def test_explicit_file_list(tmp_path):
    repo = _repo(tmp_path, {"a.txt": GH_TOKEN, "b.txt": "fine"})
    assert scan_repo(repo, [repo / "b.txt"]).ok()
    assert not scan_repo(repo, [repo / "a.txt"]).ok()
