import os

NOTES_FOLDER = "notes"
_cached_notes = None

def get_notes_list():
    global _cached_notes
    if _cached_notes is not None:
        return _cached_notes

    note_paths = []
    for root, _, files in os.walk(NOTES_FOLDER):
        for file in files:
            if file.endswith(".html"):
                rel = os.path.relpath(os.path.join(root, file), NOTES_FOLDER)
                rel = rel.replace("\\", "/")
                note_paths.append(rel[:-5])

    _cached_notes = sorted(note_paths)
    return _cached_notes


def load_note_content(note_path):
    html_path = os.path.join(NOTES_FOLDER, *note_path.split("/")) + ".html"
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "<h1>Note file missing</h1>", 404


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
