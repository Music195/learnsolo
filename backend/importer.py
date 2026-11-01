import os
import re

from config import PROJECT_ROOT
from extensions import db
from models import Course, Note, ProblemSet, Topic
from utils.courses import course_name, course_subject, topic_name

# Copies content/ into the database: run `flask import-content` after
# adding, editing, renaming or deleting a content file.
# (File format: docs/content-guide.md)
#
#   content/notes/<course>/<topic>/<nn-name>.html      -> notes (+ courses, topics)
#   content/practice/<course>/<topic>/<nn-name>.html   -> problem_sets, kind "practice"
#   content/past/<category>/[<group>/]<nn-name>.html   -> problem_sets, kind "past"
#
# Rows are matched by path: new files are added, changed ones updated and
# rows whose file is gone are deleted. It all happens in one transaction,
# so a failed import leaves the database as it was.

CONTENT_FOLDER = os.path.join(PROJECT_ROOT, "content")
NOTES_FOLDER = os.path.join(CONTENT_FOLDER, "notes")
PRACTICE_FOLDER = os.path.join(CONTENT_FOLDER, "practice")
PAST_FOLDER = os.path.join(CONTENT_FOLDER, "past")


# Reading the files
# -----------------
def _paths(folder):
    """Every .html file in `folder` as a path ("math-1/03-.../05-...", no .html), sorted."""
    paths = []
    for root, _, files in os.walk(folder):
        for file in files:
            if file.endswith(".html"):
                rel = os.path.relpath(os.path.join(root, file), folder).replace("\\", "/")
                paths.append(rel[:-5])
    return sorted(paths)


def _read(folder, path):
    with open(os.path.join(folder, *path.split("/")) + ".html", "r", encoding="utf-8") as f:
        return f.read()


def _first(pattern, content):
    """Text of the first match's group 1, tags removed and spaces collapsed."""
    match = re.search(pattern, content, re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", match.group(1))).strip() if match else None


def parse_note(path, content):
    # The note's <h1 class="note-title">, else its <title>, else the file name
    title = (_first(r'<h1[^>]*class="[^"]*note-title[^"]*"[^>]*>(.*?)</h1>', content)
             or _first(r"<title[^>]*>(.*?)</title>", content)
             or path.rsplit("/", 1)[-1])
    return {"path": path, "title": title, "html": content}


def parse_set(path, content):
    body = re.sub(r"<!--.*?-->", "", content, flags=re.S)
    return {
        "path": path,
        "html": content,
        "title": _first(r'<h1[^>]*class="[^"]*practice-title[^"]*"[^>]*>(.*?)</h1>', content)
                 or path.rsplit("/", 1)[-1],
        # first sentence of the intro, for lists of sets
        "intro": re.split(r"(?<=\.)\s", _first(r'<p class="practice-intro">(.*?)</p>', content) or "")[0],
        # count problems outside comments (the file's top comment mentions the tag too)
        "count": body.count('class="practice-problem"'),
        # the notes its problems link to ("Uses: ..."), for "Practise this note"
        "note_paths": sorted(set(re.findall(r'href="/notes/([^"#]+)"', body))),
        # from the top comment, e.g. "01–05" or "05, 10 and 11" (concept sets only)
        "covers": _first(r"covers notes ([^.\n]+)\.", content),
        # earlier paths ("old|older"), where saved progress may still be
        "moved_from": _first(r'data-moved-from="([^"]*)"', content),
        # the last set of a topic, a mix of the whole topic
        "is_review": path.endswith("-topic-review"),
        # past papers: what each problem practises, from <span class="exam-label">I Q1 · Quadratics</span>
        "labels": [l.split("·")[-1].strip() for l in re.findall(r'class="exam-label">([^<]*)<', body)],
    }


# Writing to the database
# -----------------------
def _sync(model, rows, key_of, existing, stats):
    """Insert or update `rows` (dicts of column values) in `model`. A row is
    matched to an object in `existing` ({key: object}) by key_of(row); matched
    objects are removed from `existing`, so what is left there has no file."""
    result = {}
    for position, row in enumerate(rows):
        row = dict(row, position=position)
        key = key_of(row)
        obj = existing.pop(key, None)
        if obj is None:
            obj = model(**row)
            db.session.add(obj)
            stats["added"] += 1
        elif any(getattr(obj, field) != value for field, value in row.items()):
            for field, value in row.items():
                setattr(obj, field, value)
            stats["updated"] += 1
        result[key] = obj
    return result


def import_content():
    """Sync the database with content/. Returns {table: {"added", "updated", "removed"}}."""
    notes = [parse_note(p, _read(NOTES_FOLDER, p)) for p in _paths(NOTES_FOLDER)]
    sets = ([dict(parse_set(p, _read(PRACTICE_FOLDER, p)), kind="practice") for p in _paths(PRACTICE_FOLDER)]
            + [dict(parse_set(p, _read(PAST_FOLDER, p)), kind="past") for p in _paths(PAST_FOLDER)])
    report = {name: {"added": 0, "updated": 0, "removed": 0}
              for name in ("courses", "topics", "notes", "problem sets")}

    # Courses and topics come from the note folders, in folder order
    course_rows, topic_rows = {}, {}
    for note in notes:
        parts = note["path"].split("/")
        course_rows.setdefault(parts[0], {"slug": parts[0], "name": course_name(parts[0]),
                                          "subject": course_subject(parts[0])})
        if len(parts) > 2:
            topic_rows.setdefault((parts[0], parts[1]), {"course_slug": parts[0], "slug": parts[1],
                                                         "name": topic_name(parts[1])})

    old_courses = {c.slug: c for c in Course.query.all()}
    courses = _sync(Course, course_rows.values(), lambda r: r["slug"], old_courses, report["courses"])

    old_topics = {(t.course.slug, t.slug): t for t in Topic.query.all()}
    topics = _sync(Topic, [{"course": courses[r.pop("course_slug")], **r} for r in topic_rows.values()],
                   lambda r: (r["course"].slug, r["slug"]), old_topics, report["topics"])

    for note in notes:
        parts = note["path"].split("/")
        note["topic"] = topics[(parts[0], parts[1])] if len(parts) > 2 else None
    old_notes = {n.path: n for n in Note.query.all()}
    _sync(Note, notes, lambda r: r["path"], old_notes, report["notes"])

    old_sets = {(s.kind, s.path): s for s in ProblemSet.query.all()}
    _sync(ProblemSet, sets, lambda r: (r["kind"], r["path"]), old_sets, report["problem sets"])

    # Rows left over have no file any more: delete them, children first
    for name, leftovers in (("problem sets", old_sets), ("notes", old_notes),
                            ("topics", old_topics), ("courses", old_courses)):
        for obj in leftovers.values():
            db.session.delete(obj)
        report[name]["removed"] = len(leftovers)
        db.session.flush()

    db.session.commit()
    return report
