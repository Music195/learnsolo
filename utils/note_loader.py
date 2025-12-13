import os

# STEP 4: Error normalization
# ---------------------------
# Custom exception used to separate:
# - file system logic (utils)
# - HTTP response logic (routes)
#
# Instead of returning (html, status) from utils,
# we raise a clear exception and let routes decide
# how to respond (404, JSON, template, etc.).

class NoteNotFound(Exception):
    """Raised when a note file does not exist"""
    pass


NOTES_FOLDER = "notes"
_cached_notes = None
_cached_mtime = 0

def get_notes_list():
    global _cached_notes, _cached_mtime

    # Get latest modification time of notes folder
    try:
        current_mtime = max(
            os.path.getmtime(root)
            for root, _, _ in os.walk(NOTES_FOLDER)
        )
    except ValueError:
        current_mtime = 0

    # Return cache if still valid
    if _cached_notes is not None and current_mtime <= _cached_mtime:
        return _cached_notes

    # Rebuild cache
    note_paths = []
    for root, _, files in os.walk(NOTES_FOLDER):
        for file in files:
            if file.endswith(".html"):
                rel = os.path.relpath(os.path.join(root, file), NOTES_FOLDER)
                rel = rel.replace("\\", "/")
                note_paths.append(rel[:-5])

    _cached_notes = sorted(note_paths)
    _cached_mtime = current_mtime
    return _cached_notes

# STEP 6: Manual cache invalidation hook
def refresh_notes_cache():
    global _cached_notes, _cached_mtime
    _cached_notes = None
    _cached_mtime = 0



# STEP 4: Clean responsibility boundaries
# --------------------------------------
# This function ONLY loads note content.
# It does NOT return HTTP responses or HTML errors.
#
# If the note does not exist, it raises NoteNotFound
# so the route layer can handle the HTTP behavior.


def load_note_content(note_path):
    html_path = os.path.join(NOTES_FOLDER, *note_path.split("/")) + ".html"

    if not os.path.exists(html_path):
        raise NoteNotFound(note_path)

    with open(html_path, "r", encoding="utf-8") as f:
        return f.read()


def get_folders_and_subfolders(notes_list):
    folders = set()
    subfolders = set()
    for note in notes_list:
        parts = note.split("/")
        if len(parts) >= 1:
            folders.add(parts[0])
        if len(parts) >= 2:
            subfolders.add(parts[1])
    return sorted(folders), sorted(subfolders)
