from flask import Blueprint, render_template, request, Response, redirect
from utils.note_loader import (
    get_notes_list, 
    load_note_content, 
    get_folders_and_subfolders, 
    get_notes_with_titles,
    NoteNotFound
)
import requests
import os
import re
import json

notes_bp = Blueprint("notes", __name__)

# STEP 5: Navigation helper
# ------------------------
# Computes previous and next note paths
# so route and templates stay simple.
def build_nav_links(notes_list, current_note):
    if current_note not in notes_list:
        return {"prev": None, "next": None}

    index = notes_list.index(current_note)

    return {
        "prev": notes_list[index - 1] if index > 0 else None,
        "next": notes_list[index + 1] if index < len(notes_list) - 1 else None,
    }


# Home page helper
# ----------------
# Groups the notes into courses and topics for the course cards.
# Folder names stay as they are on disk; these maps only change
# what the home page shows.
COURSE_NAMES = {
    "Mathematics 1": "Math I", "Mathematics 2": "Math II", "Mathematics 3": "Math III",
    "Mathematics A": "Math A", "Mathematics B": "Math B", "Mathematics C": "Math C",
}
TOPIC_NAMES = {
    "Quardratic Function": "Quadratic Function",  # folder name has a typo
    "Other": "Integers",                          # divisibility, gcd, congruence
    "Parabola": "Conic Sections",                 # also covers ellipses and hyperbolas
}

def build_courses(notes_list):
    courses = {}
    for path in notes_list:  # already sorted, so the first note seen is note 01
        parts = path.split("/")
        if len(parts) < 3:
            continue
        course = courses.setdefault(parts[0], {
            "name": COURSE_NAMES.get(parts[0], parts[0]),
            "first": path, "count": 0, "topics": {},
        })
        course["count"] += 1
        course["topics"].setdefault(parts[1], {
            "name": TOPIC_NAMES.get(parts[1], parts[1]), "first": path,
        })
    for course in courses.values():
        course["topics"] = list(course["topics"].values())
    return list(courses.values())


@notes_bp.route("/")
def index():
    courses = build_courses(get_notes_list())
    stats = {
        "notes": sum(c["count"] for c in courses),
        "courses": len(courses),
        "topics": sum(len(c["topics"]) for c in courses),
    }
    return render_template("index.html", courses=courses, stats=stats)

@notes_bp.route("/note/<path:note_path>")
def view_note(note_path):
    notes_meta = get_notes_with_titles()
    notes_list = [n["path"] for n in notes_meta]
    folders, subfolders = get_folders_and_subfolders(notes_list)

    if note_path not in notes_list:
        return "<h1>Note not found</h1>", 404

    nav = build_nav_links(notes_list, note_path)

    # STEP 4: Route-level error handling
    # --------------------------------
    # Catch NoteNotFound here to:
    # - return proper HTTP 404
    # - keep utils framework-agnostic
    # - allow future response changes (JSON, custom page)

    try:
        content = load_note_content(note_path)
    except NoteNotFound:
        return "<h1>Note not found</h1>", 404


    # Extract title
    # Old notes use <div class="fancy-title">, converted notes use <h1 class="note-title">
    title_match = re.search(r'<(?:div|h1) class="(?:fancy|note)-title"[^>]*>([^<]+)</(?:div|h1)>', content)
    note_title = title_match.group(1).strip() if title_match else "📚 View By Topics"

    return render_template(
        "note.html",
        note_path=note_path,
        notes_list=notes_list,
        notes_meta_json=json.dumps(notes_meta),
        nav=nav,
        content=content,
        notes_json=json.dumps(notes_list),
        folders=folders,
        subfolders=subfolders,
        note_title=note_title
    )

@notes_bp.route("/proxy-pdf")
def proxy_pdf():
    from utils.google_drive import fetch_pdf
    return fetch_pdf()

@notes_bp.route("/viewer")
def viewer():
    """
    WHY:
    - Renders custom PDF viewer UI
    - Does NOT stream PDF data
    -Receives a PDF URL and passes it to the template
    """
    
    pdf_url = request.args.get("file")
    
    if not pdf_url:
        return "<h1>No PDF specified</h1>", 400
    
    return render_template (
        "viewer.html",
        file_url=pdf_url
    )
