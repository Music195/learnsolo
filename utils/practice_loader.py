import os
import re

from utils.note_loader import NoteNotFound

# Practice sets live next to the notes, in the same Course/Topic folders:
#   practice/Mathematics C/Vector/01._Dot_Product_and_Angles.html
# Each file is an HTML fragment like a note (see docs/note-structure.md).
PRACTICE_FOLDER = "practice"


def _file_path(practice_path):
    return os.path.join(PRACTICE_FOLDER, *practice_path.split("/")) + ".html"


def get_practice_sets():
    """
    Every practice set, sorted by path, as
    {"path", "title", "count"} where count is the number of problems.
    The folder is small, so it is read fresh each time (no cache).
    """
    sets = []
    for root, _, files in os.walk(PRACTICE_FOLDER):
        for file in files:
            if not file.endswith(".html"):
                continue
            rel = os.path.relpath(os.path.join(root, file), PRACTICE_FOLDER).replace("\\", "/")[:-5]
            with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                content = f.read()
            match = re.search(r'<h1[^>]*class="[^"]*practice-title[^"]*"[^>]*>(.*?)</h1>', content, re.S)
            sets.append({
                "path": rel,
                "title": re.sub(r"\s+", " ", match.group(1)).strip() if match else os.path.basename(rel),
                # count problems outside comments (the file's top comment mentions the tag too)
                "count": re.sub(r"<!--.*?-->", "", content, flags=re.S).count('class="practice-problem"'),
            })
    return sorted(sets, key=lambda s: s["path"])


def load_practice(practice_path):
    path = _file_path(practice_path)
    if not os.path.exists(path):
        raise NoteNotFound(practice_path)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
