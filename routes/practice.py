from flask import Blueprint, render_template, url_for
from utils.content_loader import get_notes_list, get_practice_sets, load_practice, ContentNotFound
from utils.courses import course_name, topic_name

practice_bp = Blueprint("practice", __name__)


# Practice sets (content/practice/<course>/<topic>/, the same folders as the notes)
# --------------------------------------------------------------------------------
# Shown like a note: floating bar, purple header, white card.
# Each problem has a hint, a step-by-step solution and an answer check
# (see static/js/practice.js).
@practice_bp.route("/practice/<path:practice_path>")
def view_set(practice_path):
    sets = get_practice_sets()
    paths = [s["path"] for s in sets]
    if practice_path not in paths:  # also blocks paths like ../ outside the folder
        return "<h1>Practice set not found</h1>", 404
    try:
        content = load_practice(practice_path)
    except ContentNotFound:
        return "<h1>Practice set not found</h1>", 404

    parts = practice_path.split("/")
    folder = practice_path.rsplit("/", 1)[0]
    siblings = [s for s in sets if s["path"].rsplit("/", 1)[0] == folder]
    index = [s["path"] for s in siblings].index(practice_path)
    notes = get_notes_list()
    topic_notes = [n for n in notes if n.startswith(folder + "/")]
    course_notes = [n for n in notes if n.startswith(parts[0] + "/")]

    # "Where you are" for the floating bar and header: Math C › Plane Vectors · Practice 1 of 1
    location = {
        "course": course_name(parts[0]),
        "course_first": course_notes[0] if course_notes else None,
        "topic": topic_name(parts[1]) if len(parts) > 2 else None,
        "topic_first": topic_notes[0] if topic_notes else None,
        "index": index + 1,
        "total": len(siblings),
        "kind": "Practice",
    }
    # Previous / next practice set in the same topic
    nav = {}
    for key, i in (("prev", index - 1), ("next", index + 1)):
        nav[key] = {
            "url": url_for("practice.view_set", practice_path=siblings[i]["path"]),
            "title": siblings[i]["title"],
            "where": "Practice",
        } if 0 <= i < len(siblings) else None

    return render_template(
        "practice.html",
        practice_path=practice_path,
        content=content,
        title=siblings[index]["title"],
        count=siblings[index]["count"],
        location=location,
        nav=nav,
    )
