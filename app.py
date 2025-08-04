import requests
from flask import Flask, render_template, redirect, request, url_for, Response
import os
import json
import lists_of_kind_of_problem as lkp
import google_drive_link as gdl

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

@app.route("/")
def index():
    """Returns a list of all application functions."""
    functions = [
        {"name": "View Formlae", "value": "view_note", "route": "/note/"},
        {"name": "Math Problem Solving", "value": "kind_of_problem", "route": "/note/"},
        {"name": "Future Projects", "value": "", "route": "/note/"}
        # Add more functions as needed
    ]
    return render_template('index.html',
                          notes_list=notes_list,
                          functions=functions)
    # if notes_list:
    #     return redirect(url_for("view_note", note_path=notes_list[0]))
    # return "<h1>No notes available</h1>", 404

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
    
@app.route('/note/kind_of_problem')
def kind_of_problem():
    categorized_links=gdl.categorized_links
    return render_template('kind_of_problem.html',
                            categorized_links=categorized_links
                           )

category= list(gdl.categorized_links.keys())

@app.route('/note/kind_of_problem/<path:category>')
def problem(category):
    topic=category
    lists_of_link_dic=gdl.categorized_links[category]
    return render_template('problem.html',
                            lists_of_link_dic=lists_of_link_dic,
                            topic=topic
                           )

@app.route('/note/kind_of_problem/problem/viewer')
def viewer():
    file_url = request.args.get('file')
    return render_template('viewer.html', file_url=file_url)

@app.route('/proxy-pdf')
def proxy_pdf():
    url = request.args.get('url')
    
    # Optional: Validate the URL is from trusted sources
    if not url or not (url.startswith('https://drive.google.com') or url.startswith('/static/')):
        return "Invalid URL", 400
        
    # For external URLs (like Google Drive)
    if url.startswith('http'):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return Response(
                    response.content, 
                    mimetype='application/pdf',
                    headers={
                        'Content-Disposition': 'inline; filename=document.pdf'
                    }
                )
            else:
                return f"Failed to fetch PDF: {response.status_code}", 400
        except Exception as e:
            return f"Error fetching PDF: {str(e)}", 500
    
    # For local files, serve directly
    else:
        return redirect(url)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000)) # Default to 5000 if PORT not set
    app.run(host="0.0.0.0", port=port, debug=True)