# Tests for `flask import-content` (importer.py).

from importer import import_content, parse_note, parse_set


def test_second_import_changes_nothing(app):
    # The `app` fixture already imported everything once, so a second
    # run should find every row up to date.
    report = import_content()
    for table, counts in report.items():
        assert counts == {"added": 0, "updated": 0, "removed": 0}, table


def test_parse_note_title():
    html = '<h1 class="note-title">Law of <b>Sines</b></h1>'
    assert parse_note("math-1/04-trig/06-law-of-sines", html)["title"] == "Law of Sines"


def test_parse_note_falls_back_to_the_file_name():
    assert parse_note("math-1/04-trig/06-law-of-sines", "<p>no title</p>")["title"] == "06-law-of-sines"


def test_parse_set_counts_problems_outside_comments():
    html = """<!-- each problem is a <div class="practice-problem"> -->
    <h1 class="practice-title">Vertex Form</h1>
    <div class="practice-problem"></div>
    <div class="practice-problem"></div>"""
    data = parse_set("math-1/03-quadratic-functions/02-topic-review", html)
    assert data["title"] == "Vertex Form"
    assert data["count"] == 2              # the one in the comment isn't counted
    assert data["is_review"] is True       # the path ends in -topic-review
