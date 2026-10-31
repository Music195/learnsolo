import os
import re

# Reads the HTML files in content/ (format: docs/content-guide.md).
#
#   content/notes/<course>/<topic>/<nn-name>.html      the notes
#   content/practice/<course>/<topic>/<nn-name>.html   practice sets, same folders as the notes
#   content/past/<category>/<nn-name>.html             past question papers
#
# A file's "path" is its place inside notes/, practice/ or past/ without
# ".html", e.g. "math-1/03-quadratic-functions/05-quadratic-formula".
# It is also the end of the page's URL (/notes/<path>).
# The number prefixes make sorted paths follow the textbook order.

CONTENT_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "content")
NOTES_FOLDER = os.path.join(CONTENT_FOLDER, "notes")
PRACTICE_FOLDER = os.path.join(CONTENT_FOLDER, "practice")
PAST_FOLDER = os.path.join(CONTENT_FOLDER, "past")


# Error normalization
# -------------------
# Utils raise this instead of returning (html, status), so the routes
# decide how to respond (404 page, JSON, ...).
class ContentNotFound(Exception):
    """Raised when a content file does not exist"""
    pass


def _file_path(folder, path):
    return os.path.join(folder, *path.split("/")) + ".html"


def _read(folder, path):
    file = _file_path(folder, path)
    if not os.path.exists(file):
        raise ContentNotFound(path)
    with open(file, "r", encoding="utf-8") as f:
        return f.read()


def _paths(folder):
    """Every .html file in `folder` as a path, sorted."""
    paths = []
    for root, _, files in os.walk(folder):
        for file in files:
            if file.endswith(".html"):
                rel = os.path.relpath(os.path.join(root, file), folder).replace("\\", "/")
                paths.append(rel[:-5])
    return sorted(paths)


def _first(pattern, content):
    match = re.search(pattern, content, re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", match.group(1))).strip() if match else None


# Notes
# -----
# Cached, and rebuilt when anything in the notes folder changes.
_cache = {"mtime": None, "notes": None, "meta": None}


def _notes_mtime():
    try:
        return max(os.path.getmtime(root) for root, _, _ in os.walk(NOTES_FOLDER))
    except ValueError:
        return 0


def get_notes_with_titles():
    """[{"path", "title"}] for every note, in order."""
    mtime = _notes_mtime()
    if _cache["meta"] is None or mtime > _cache["mtime"]:
        meta = []
        for path in _paths(NOTES_FOLDER):
            content = _read(NOTES_FOLDER, path)
            # The note's <h1 class="note-title">, else its <title>, else the file name
            title = (_first(r'<h1[^>]*class="[^"]*note-title[^"]*"[^>]*>(.*?)</h1>', content)
                     or _first(r"<title[^>]*>(.*?)</title>", content)
                     or path.rsplit("/", 1)[-1])
            meta.append({"path": path, "title": title})
        _cache.update(mtime=mtime, meta=meta, notes=[n["path"] for n in meta])
    return _cache["meta"]


def get_notes_list():
    get_notes_with_titles()
    return _cache["notes"]


def refresh_notes_cache():
    _cache.update(mtime=None, notes=None, meta=None)


def load_note(note_path):
    return _read(NOTES_FOLDER, note_path)


# Practice sets and past papers
# -----------------------------
# Same file format; the folders are small, so they are read fresh each time.
def get_sets(folder):
    """Every set in `folder`, in order, as {"path", "title", "intro", "count", "notes", "review"}."""
    sets = []
    for path in _paths(folder):
        content = _read(folder, path)
        body = re.sub(r"<!--.*?-->", "", content, flags=re.S)
        sets.append({
            "path": path,
            "title": _first(r'<h1[^>]*class="[^"]*practice-title[^"]*"[^>]*>(.*?)</h1>', content)
                     or path.rsplit("/", 1)[-1],
            # first sentence of the intro, for lists of sets
            "intro": re.split(r"(?<=\.)\s", _first(r'<p class="practice-intro">(.*?)</p>', content) or "")[0],
            # count problems outside comments (the file's top comment mentions the tag too)
            "count": body.count('class="practice-problem"'),
            # the notes its problems link to ("Uses: ..."), for "Practise this note"
            "notes": sorted(set(re.findall(r'href="/notes/([^"#]+)"', body))),
            # the last set of a topic, a mix of the whole topic
            "review": path.endswith("-topic-review"),
        })
    return sets


def get_practice_sets():
    return get_sets(PRACTICE_FOLDER)


def load_practice(practice_path):
    return _read(PRACTICE_FOLDER, practice_path)


def get_past_papers():
    return get_sets(PAST_FOLDER)


def load_past(past_path):
    return _read(PAST_FOLDER, past_path)
