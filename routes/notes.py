from flask import Blueprint, render_template, request, Response, redirect, url_for, jsonify
from utils.note_loader import (
    get_notes_list, 
    load_note_content, 
    get_folders_and_subfolders, 
    get_notes_with_titles,
    NoteNotFound
)
import requests
import os

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


# Home page helpers
# -----------------
# Group the notes into subjects → courses → topics for the home page.
# Folder names stay as they are on disk; these maps only change
# what the home page shows.

# Subjects in tab order. A course folder belongs to the subject its
# name starts with ("Mathematics 1" → Mathematics, "Physics Basic" →
# Physics). A subject with no notes yet shows as "Coming soon".
# A folder that matches none of these gets its own tab, named after
# the folder's first word.
SUBJECTS = [
    {"name": "Mathematics", "icon": "fa-square-root-variable"},
    {"name": "Physics", "icon": "fa-atom"},
]
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
            "folder": parts[0], "name": COURSE_NAMES.get(parts[0], parts[0]),
            "first": path, "count": 0, "topics": {},
        })
        course["count"] += 1
        course["topics"].setdefault(parts[1], {
            "name": TOPIC_NAMES.get(parts[1], parts[1]), "first": path,
        })
    for course in courses.values():
        course["topics"] = list(course["topics"].values())
    return list(courses.values())


def build_subjects(courses):
    subjects = [dict(s, courses=[]) for s in SUBJECTS]
    for course in courses:
        subject = next((s for s in subjects if course["folder"].startswith(s["name"])), None)
        if subject is None:  # a new subject not listed in SUBJECTS
            subject = {"name": course["folder"].split()[0], "icon": "fa-book", "courses": []}
            subjects.append(subject)
        subject["courses"].append(course)
    for subject in subjects:
        subject["count"] = sum(c["count"] for c in subject["courses"])
    return subjects


# One entry per note for the search box: title, link and "Math I · Vector"
def build_search_index():
    index = []
    for note in get_notes_with_titles():
        parts = note["path"].split("/")
        where = " · ".join(
            [COURSE_NAMES.get(parts[0], parts[0])] +
            ([TOPIC_NAMES.get(parts[1], parts[1])] if len(parts) > 2 else [])
        )
        index.append({
            "title": note["title"], "where": where,
            "url": url_for("notes.view_note", note_path=note["path"]),
        })
    return index


@notes_bp.route("/")
def index():
    courses = build_courses(get_notes_list())
    stats = {
        "notes": sum(c["count"] for c in courses),
        "courses": len(courses),
        "topics": sum(len(c["topics"]) for c in courses),
    }
    return render_template("index.html", subjects=build_subjects(courses), stats=stats)


# The search box in the floating bar loads this once, when it is first used,
# so pages don't have to carry the whole list of notes.
@notes_bp.route("/search-index.json")
def search_index():
    return jsonify(build_search_index())


# Note page helper: "where you are" for the floating bar and the note header,
# e.g. Math C › Vector · 17 of 17, with links to the course and topic.
def build_location(notes_list, note_path):
    parts = note_path.split("/")
    folder = note_path.rsplit("/", 1)[0]
    siblings = [p for p in notes_list if p.rsplit("/", 1)[0] == folder]
    course_first = next(p for p in notes_list if p.startswith(parts[0] + "/"))
    return {
        "course": COURSE_NAMES.get(parts[0], parts[0]),
        "course_first": course_first,
        "topic": TOPIC_NAMES.get(parts[1], parts[1]) if len(parts) > 2 else None,
        "topic_first": siblings[0],
        "index": siblings.index(note_path) + 1,
        "total": len(siblings),
    }

@notes_bp.route("/note/<path:note_path>")
def view_note(note_path):
    notes_meta = get_notes_with_titles()
    notes_list = [n["path"] for n in notes_meta]
    folders, _ = get_folders_and_subfolders(notes_list)

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


    # Titles come from each note's <h1 class="note-title"> (see note_loader.py)
    titles = {n["path"]: n["title"] for n in notes_meta}
    # Previous / next cards: the title, and the course · topic shown under it
    for key in ("prev", "next"):
        if nav[key]:
            location = build_location(notes_list, nav[key])
            nav[key] = {
                "path": nav[key], "title": titles[nav[key]],
                "where": " · ".join(filter(None, [location["course"], location["topic"]])),
            }

    return render_template(
        "note.html",
        note_path=note_path,
        notes_meta=notes_meta,
        nav=nav,
        content=content,
        folders=folders,
        note_title=titles[note_path],
        location=build_location(notes_list, note_path),
        display_names={"courses": COURSE_NAMES, "topics": TOPIC_NAMES},
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
