import os

NOTES_FOLDER = "notes"
def get_all_notes():
    note_paths = []
    for root, _, files in os.walk(NOTES_FOLDER):
        for file in files:
            if file.endswith(".html"):
                rel_path = os.path.relpath(os.path.join(root, file), NOTES_FOLDER)
                rel_path = rel_path.replace("\\", "/")  # Windows compatibility
                note_paths.append(rel_path[:-5])  # remove .html
    return sorted(note_paths)

notes_list = get_all_notes()
print(notes_list)