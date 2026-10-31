import os
import re

from utils.note_loader import NoteNotFound

# Practice sets live next to the notes, in the same Course/Topic folders:
#   practice/Mathematics C/Vector/01._Dot_Product_and_Angles.html
# Past questions are grouped by exam instead:
#   past/EJU Past Questions/01._Sample_Paper_Math_Course_2.html
# Both are HTML fragments in the same format (see docs/note-structure.md).
PRACTICE_FOLDER = "practice"
PAST_FOLDER = "past"


def _file_path(folder, set_path):
    return os.path.join(folder, *set_path.split("/")) + ".html"


def _first(pattern, content):
    match = re.search(pattern, content, re.S)
    return re.sub(r"\s+", " ", match.group(1)).strip() if match else None


def get_sets(folder):
    """
    Every set in `folder`, sorted by path, as
    {"path", "title", "intro", "count"} where count is the number of problems.
    The folders are small, so they are read fresh each time (no cache).
    """
    sets = []
    for root, _, files in os.walk(folder):
        for file in files:
            if not file.endswith(".html"):
                continue
            rel = os.path.relpath(os.path.join(root, file), folder).replace("\\", "/")[:-5]
            with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                content = f.read()
            sets.append({
                "path": rel,
                "title": _first(r'<h1[^>]*class="[^"]*practice-title[^"]*"[^>]*>(.*?)</h1>', content)
                         or os.path.basename(rel),
                # first sentence of the intro, for lists of sets
                "intro": re.split(r"(?<=\.)\s", re.sub(r"<[^>]+>", "",
                                  _first(r'<p class="practice-intro">(.*?)</p>', content) or ""))[0],
                # count problems outside comments (the file's top comment mentions the tag too)
                "count": re.sub(r"<!--.*?-->", "", content, flags=re.S).count('class="practice-problem"'),
            })
    return sorted(sets, key=lambda s: s["path"])


def load_set(folder, set_path):
    path = _file_path(folder, set_path)
    if not os.path.exists(path):
        raise NoteNotFound(set_path)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def get_practice_sets():
    return get_sets(PRACTICE_FOLDER)


def load_practice(practice_path):
    return load_set(PRACTICE_FOLDER, practice_path)


def get_past_papers():
    return get_sets(PAST_FOLDER)


def load_past(past_path):
    return load_set(PAST_FOLDER, past_path)
