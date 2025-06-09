from flask import Flask, render_template, redirect, url_for
import os
import json

app = Flask(__name__)
NOTES_FOLDER = "notes"

# Recursively collect all note paths (deep subfolders supported)
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

# Load tags from tags.json
# try:
#     with open("tags.json", encoding="utf-8") as f:
#         note_tags = json.load(f)
# except FileNotFoundError:
#     note_tags = {}

@app.route("/")
def index():
    if notes_list:
        return redirect(url_for("view_note", note_path=notes_list[0]))
    return "<h1>No notes available</h1>", 404

def get_folders_and_subfolders(notes_list):
    folders = set()
    subfolders = set()
    for note in notes_list:
        parts = note.split('/')
        if len(parts) > 0:
            folders.add(parts[0])
        if len(parts) > 1:
            subfolders.add(parts[1])
    return sorted(folders), sorted(subfolders)

@app.route("/note/<path:note_path>")
def view_note(note_path):
    folders, subfolders = get_folders_and_subfolders(notes_list)
    if note_path not in notes_list:
        return "<h1>Note not found</h1>", 404

    index = notes_list.index(note_path)
    prev_note = notes_list[index - 1] if index > 0 else None
    next_note = notes_list[index + 1] if index < len(notes_list) - 1 else None

    html_path = os.path.join(NOTES_FOLDER, *note_path.split("/")) + ".html"

    try:
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        return "<h1>Note file missing</h1>", 404

    # ...existing code...
    notes_json = json.dumps(notes_list)
    # tags_json = json.dumps(note_tags)
    return render_template(
        "note.html",
        note_path=note_path,
        notes_list=notes_list, 
        prev_note=prev_note, 
        next_note=next_note, 
        content=content,
        notes_json=notes_json,
        folders=folders,
        subfolders=subfolders 
    )
        # tags_json=tags_json)
# ...existing code...

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000)) # Default to 5000 if PORT not set
    app.run(host="0.0.0.0", port=port, debug=True)