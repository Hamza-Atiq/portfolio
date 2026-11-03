"""Make the tiny test photos, cover, certificate and CV used by the `good` fixture.

These files are generated (never a real photo) and are git-ignored.
Run `python -m tests.fixture_files` from `checker/` to make them by hand.
"""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

GOOD = Path(__file__).parent / "fixtures" / "good"


def tiny_png(width: int = 4, height: int = 4, rgb: tuple[int, int, int] = (245, 184, 61)) -> bytes:
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    row = b"\x00" + bytes(rgb) * width
    raw = row * height
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


TINY_PDF = b"%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n"

FILES: dict[str, bytes] = {
    "photo/test_dark.png": tiny_png(rgb=(20, 20, 23)),
    "photo/test_light.png": tiny_png(rgb=(250, 248, 244)),
    "images/p013/cover.png": tiny_png(16, 9),
    "proofs/test_certificate.png": tiny_png(8, 6),
    "cv/test_cv.pdf": TINY_PDF,
}


def ensure_fixture_files(root: Path = GOOD) -> None:
    for rel, data in FILES.items():
        path = root / rel
        if not path.exists() or path.read_bytes() != data:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)


if __name__ == "__main__":
    ensure_fixture_files()
    print(f"made test files in {GOOD}")
