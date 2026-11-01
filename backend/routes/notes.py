from flask import Blueprint, render_template, request, url_for
from utils.content_loader import get_notes_with_titles, get_practice_sets, load_note, ContentNotFound
from utils.courses import course_name, topic_name

notes_bp = Blueprint("notes", __name__)


# Navigation helper
# -----------------
# Computes previous and next note paths so route and templates stay simple.
def build_nav_links(notes_list, current_note):
    if current_note not in notes_list:
        return {"prev": None, "next": None}

    index = notes_list.index(current_note)

    return {
        "prev": notes_list[index - 1] if index > 0 else None,
        "next": notes_list[index + 1] if index < len(notes_list) - 1 else None,
    }


# "Where you are" for the floating bar and the note header,
# e.g. Math C › Plane Vectors · 17 of 17, with links to the course and topic.
def build_location(notes_list, note_path):
    parts = note_path.split("/")
    folder = note_path.rsplit("/", 1)[0]
    siblings = [p for p in notes_list if p.rsplit("/", 1)[0] == folder]
    course_first = next(p for p in notes_list if p.startswith(parts[0] + "/"))
    return {
        "course": course_name(parts[0]),
        "course_first": course_first,
        "topic": topic_name(parts[1]) if len(parts) > 2 else None,
        "topic_first": siblings[0],
        "index": siblings.index(note_path) + 1,
        "total": len(siblings),
    }


@notes_bp.route("/notes/<path:note_path>")
def view_note(note_path):
    notes_meta = get_notes_with_titles()
    notes_list = [n["path"] for n in notes_meta]

    if note_path not in notes_list:  # also blocks paths like ../
        return "<h1>Note not found</h1>", 404

    try:
        content = load_note(note_path)
    except ContentNotFound:
        return "<h1>Note not found</h1>", 404

    nav = build_nav_links(notes_list, note_path)

    # Titles come from each note's <h1 class="note-title"> (see content_loader.py)
    titles = {n["path"]: n["title"] for n in notes_meta}
    # Previous / next cards: the title, and the course · topic shown under it
    for key in ("prev", "next"):
        if nav[key]:
            location = build_location(notes_list, nav[key])
            nav[key] = {
                "url": url_for("notes.view_note", note_path=nav[key]), "title": titles[nav[key]],
                "where": " · ".join(filter(None, [location["course"], location["topic"]])),
            }

    # Sidebar dropdowns: every course, and the display name of every folder
    courses = sorted({p.split("/")[0] for p in notes_list})
    topics = {p.split("/")[1] for p in notes_list if p.count("/") >= 2}

    return render_template(
        "note.html",
        note_path=note_path,
        notes_meta=notes_meta,
        nav=nav,
        content=content,
        folders=courses,
        note_title=titles[note_path],
        location=build_location(notes_list, note_path),
        display_names={"courses": {c: course_name(c) for c in courses},
                       "topics": {t: topic_name(t) for t in topics}},
        show_topics=True,
        practice=build_practice(note_path),
    )


# Practice after a note: the set that practises this note, then the topic's
# other sets. The main set is the first concept set whose problems link to
# the note; if none does, the topic's first set.
def build_practice(note_path):
    folder = note_path.rsplit("/", 1)[0]
    sets = [s for s in get_practice_sets() if s["path"].rsplit("/", 1)[0] == folder]
    if not sets:
        return None
    main = next((s for s in sets if not s["review"] and note_path in s["notes"]), sets[0])
    return {"main": main, "more": [s for s in sets if s is not main], "topic": topic_name(folder.split("/")[-1])}


# PDF viewer (for PDFs on Google Drive)
# -------------------------------------
@notes_bp.route("/proxy-pdf")
def proxy_pdf():
    from utils.google_drive import fetch_pdf
    return fetch_pdf()


@notes_bp.route("/viewer")
def viewer():
    """
    Renders the PDF viewer page. It does not stream the PDF itself:
    it passes the PDF URL to the template, which loads it through /proxy-pdf.
    """
    pdf_url = request.args.get("file")

    if not pdf_url:
        return "<h1>No PDF specified</h1>", 400

    return render_template("pdf-viewer.html", file_url=pdf_url)
