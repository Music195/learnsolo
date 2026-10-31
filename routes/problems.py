from flask import Blueprint, render_template, url_for
import utils.google_drive as gdl
from utils.note_loader import get_notes_list, NoteNotFound
from utils.practice_loader import get_practice_sets, load_practice
from routes.notes import COURSE_NAMES, TOPIC_NAMES

problems_bp = Blueprint("problems", __name__)

@problems_bp.route("/note/kind_of_problem")
def kind_of_problem():
    categorized_links = gdl.get_links()
    return render_template("problems_list.html", categorized_links=categorized_links)

@problems_bp.route("/note/kind_of_problem/<path:category>")
def problem(category):
    categorized_links = gdl.get_links()
    if category not in categorized_links:
        return "<h1>Category not found</h1>", 404

    lists_of_link_dic = categorized_links[category]
    return render_template("problems_list.html",
                           lists_of_link_dic=lists_of_link_dic,
                           topic=category)


# Practice sets (HTML pages in practice/<Course>/<Topic>/)
# -------------------------------------------------------
# Shown like a note: floating bar, purple header, white card.
# Each problem has a hint, a step-by-step solution and an answer check
# (see static/js/practice.js).
@problems_bp.route("/practice/<path:practice_path>")
def practice(practice_path):
    sets = get_practice_sets()
    paths = [s["path"] for s in sets]
    if practice_path not in paths:  # also blocks paths like ../ outside the folder
        return "<h1>Practice set not found</h1>", 404
    try:
        content = load_practice(practice_path)
    except NoteNotFound:
        return "<h1>Practice set not found</h1>", 404

    parts = practice_path.split("/")
    folder = practice_path.rsplit("/", 1)[0]
    siblings = [s for s in sets if s["path"].rsplit("/", 1)[0] == folder]
    index = [s["path"] for s in siblings].index(practice_path)
    notes = get_notes_list()
    topic_notes = [n for n in notes if n.startswith(folder + "/")]
    course_notes = [n for n in notes if n.startswith(parts[0] + "/")]

    # "Where you are" for the floating bar and header: Math C › Vector · Practice 1 of 1
    location = {
        "course": COURSE_NAMES.get(parts[0], parts[0]),
        "course_first": course_notes[0] if course_notes else None,
        "topic": TOPIC_NAMES.get(parts[1], parts[1]) if len(parts) > 2 else None,
        "topic_first": topic_notes[0] if topic_notes else None,
        "index": index + 1,
        "total": len(siblings),
        "kind": "Practice",
    }
    # Previous / next practice set in the same topic
    nav = {}
    for key, i in (("prev", index - 1), ("next", index + 1)):
        ok = 0 <= i < len(siblings)
        nav[key] = {
            "url": url_for("problems.practice", practice_path=siblings[i]["path"]),
            "title": siblings[i]["title"],
            "where": "Practice",
        } if ok else None

    return render_template(
        "practice.html",
        practice_path=practice_path,
        content=content,
        title=siblings[index]["title"],
        count=siblings[index]["count"],
        location=location,
        nav=nav,
    )
