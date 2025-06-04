from flask import Flask, render_template_string, redirect, url_for
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
try:
    with open("tags.json", encoding="utf-8") as f:
        note_tags = json.load(f)
except FileNotFoundError:
    note_tags = {}

@app.route("/")
def index():
    return redirect(url_for("view_note", note_path=notes_list[0]))

@app.route("/note/<path:note_path>")
def view_note(note_path):
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
    tags_json = json.dumps(note_tags)

    return render_template_string("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{{ note_path }} - Math Notes</title>
            <script>
                const NOTES_LIST = {{ notes_json|safe }};
                const NOTE_TAGS = {{ tags_json|safe }};
            </script>
            <script src="https://cdn.jsdelivr.net/npm/fuse.js@6.6.2"></script>
            <script src="/static/script.js" defer></script>
            <style>
                body {
                    font-family: sans-serif;
                    padding: 2em;
                    max-width: 800px;
                    margin: auto;
                }
                nav {
                    margin-bottom: 1em;
                }
                .nav-buttons a {
                    margin-right: 1em;
                }
                #search-results a {
                    display: block;
                    margin-bottom: 5px;
                }
            </style>
            <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
            <script type="text/javascript" async
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
            </script>
        </head>
        <body style="border: 1px solid #ccc; padding: 1em; margin: 0 auto">
            <nav>
                <div class="nav-buttons">
                    {% if prev_note %}<a href="/note/{{ prev_note }}">⬅ Back</a>{% endif %}
                    {% if next_note %}<a href="/note/{{ next_note }}">Next ➡</a>{% endif %}
                </div>
                <div>
                    <input type="text" id="search" placeholder="Search notes...">
                    <select id="tagFilter" onchange="filterByTag()">
                        <option value="">Filter by Tag</option>
                    </select>
                    <select id="noteSelect" onchange="location = this.value;">
                        {% for n in notes_list %}
                            <option value="/note/{{ n }}" {% if n == note_path %}selected{% endif %}>{{ n }}</option>
                        {% endfor %}
                    </select>
                    <div id="search-results"></div>
                </div>
            </nav>
            <div style="padding: 1em; margin: auto 10% auto 10%">{{ content|safe }}</div>
        </body>
        </html>
        """, note_path=note_path, notes_list=notes_list, prev_note=prev_note, next_note=next_note, content=content, notes_json=notes_json, tags_json=tags_json)
# ...existing code...

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000)) # Default to 5000 if PORT not set
    app.run(host="0.0.0.0", port=port, debug=True)