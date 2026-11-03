"""The facts row of profile.yml (spec §6: Education, Research, Teaching, Competitions)."""
from __future__ import annotations

from datetime import date
from pathlib import Path

from portfolio_checker.build import build_bundle
from portfolio_checker.links import all_links
from portfolio_checker.load import load_content
from portfolio_checker.rules import check_rules

TODAY = date(2026, 11, 3)


def _edit(root: Path, old: str, new: str) -> None:
    p = root / "profile.yml"
    text = p.read_text(encoding="utf-8")
    assert old in text
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def test_facts_load_and_reach_the_bundle(good_root):
    c, r = load_content(good_root)
    assert r.ok(), r.errors
    assert [f.label for f in c.profile.facts] == ["Education", "Research", "Teaching", "Competitions"]
    assert c.profile.facts[0].link is None and c.profile.facts[1].detail is None
    facts = build_bundle(c, False)["profile"]["facts"]
    assert facts[1] == {"label": "Research", "title": "Test research area", "detail": None, "link": "#research"}
    assert facts[3]["link"] == "https://example.com/proof/test-award"


def test_facts_are_optional(good_root):
    p = good_root / "profile.yml"
    text = p.read_text(encoding="utf-8")
    start, end = text.index("facts:\n"), text.index("cv_file:")
    p.write_text(text[:start] + text[end:], encoding="utf-8")
    c, r = load_content(good_root)
    assert r.ok(), r.errors
    assert c.profile.facts == []


def test_fact_needs_label_and_title(good_root):
    _edit(good_root, '    title: "Test degree"\n', "")
    _, r = load_content(good_root)
    assert len(r.errors) == 1 and "facts[1].title is missing" in r.errors[0].message, r.errors


def test_fact_link_must_be_a_section_or_web_address(good_root):
    _edit(good_root, 'link: "#research"', 'link: "research page"')
    _, r = load_content(good_root)
    assert len(r.errors) == 1 and "facts[2].link" in r.errors[0].message, r.errors


def test_fact_link_to_unknown_section_is_refused(good_root):
    _edit(good_root, 'link: "#research"', 'link: "#reserch"')
    c, r = load_content(good_root)
    assert r.ok(), r.errors
    rr = check_rules(c, good_root, TODAY, include_drafts=False)
    assert len(rr.errors) == 1 and "#reserch" in rr.errors[0].message, rr.errors
    assert rr.errors[0].file == "content/profile.yml"


def test_fact_web_link_is_link_checked(good_root):
    _edit(good_root, "link: https://example.com/proof/test-award", "link: https://example.com/facts-only")
    c, _ = load_content(good_root)
    assert ("content/profile.yml", "https://example.com/facts-only") in all_links(c)
