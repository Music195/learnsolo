from extensions import db
from models import Note, ProblemSet

# Reads notes, practice sets and past papers from the database. They get
# there from content/ with `flask import-content` (importer.py).
#
# A note's or set's "path" is its place inside content/notes/, practice/ or
# past/ without ".html", e.g. "math-1/03-quadratic-functions/05-quadratic-formula".
# It is also the end of the page's URL (/notes/<path>). Lists come back in
# the order of the files' number prefixes.


# Error normalization
# -------------------
# Utils raise this instead of returning (html, status), so the routes
# decide how to respond (api/__init__.py answers with a JSON 404).
class ContentNotFound(Exception):
    """Raised when a note or set is not in the database"""
    pass


# Notes
# -----
def get_notes_with_titles():
    """[{"path", "title"}] for every note, in order."""
    rows = db.session.execute(db.select(Note.path, Note.title).order_by(Note.position))
    return [{"path": path, "title": title} for path, title in rows]


def get_notes_list():
    return list(db.session.scalars(db.select(Note.path).order_by(Note.position)))


def load_note(note_path):
    html = db.session.scalar(db.select(Note.html).where(Note.path == note_path))
    if html is None:
        raise ContentNotFound(note_path)
    return html


# Practice sets and past papers
# -----------------------------
# Both are rows of problem_sets, told apart by kind ("practice" or "past").
_SET_FIELDS = (ProblemSet.path, ProblemSet.title, ProblemSet.intro, ProblemSet.count,
               ProblemSet.note_paths, ProblemSet.covers, ProblemSet.moved_from,
               ProblemSet.is_review, ProblemSet.labels)


def get_sets(kind):
    """Every set of `kind`, in order, as {"path", "title", "intro", "count", "notes", "covers", "moved_from", "review", "labels"}."""
    rows = db.session.execute(
        db.select(*_SET_FIELDS).where(ProblemSet.kind == kind).order_by(ProblemSet.position))
    return [{
        "path": r.path, "title": r.title, "intro": r.intro, "count": r.count,
        "notes": r.note_paths, "covers": r.covers, "moved_from": r.moved_from,
        "review": r.is_review, "labels": r.labels,
    } for r in rows]


def _load_set(kind, path):
    html = db.session.scalar(
        db.select(ProblemSet.html).where(ProblemSet.kind == kind, ProblemSet.path == path))
    if html is None:
        raise ContentNotFound(path)
    return html


def get_practice_sets():
    return get_sets("practice")


def load_practice(practice_path):
    return _load_set("practice", practice_path)


def get_past_papers():
    return get_sets("past")


def load_past(past_path):
    return _load_set("past", past_path)
