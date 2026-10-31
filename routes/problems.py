from flask import Blueprint, render_template, url_for
from utils.note_loader import get_notes_list, NoteNotFound
from utils.practice_loader import get_practice_sets, load_practice, get_past_papers, load_past
from routes.notes import COURSE_NAMES, TOPIC_NAMES

problems_bp = Blueprint("problems", __name__)

# Past questions (HTML pages in past/<Category>/)
# ----------------------------------------------
# /note/kind_of_problem              all categories, as cards
# /note/kind_of_problem/<category>   the papers in one category
# /past/<category>/<paper>           one paper, shown like a practice set
# A new folder in past/ becomes a new category; a short description can be
# added to CATEGORY_INFO (folders without one get a generic description).
CATEGORY_INFO = {
    "EJU Past Questions": {
        "icon": "fa-file-pen",
        "about": "Examination for Japanese University Admission for International Students: Mathematics Course 1 and Course 2.",
    },
    "J-University Past Questions": {
        "icon": "fa-building-columns",
        "about": "Entrance exams of Japanese universities: longer problems with written solutions.",
    },
}


def past_categories():
    """{name: {"name", "icon", "about", "papers": [...]}} in folder order."""
    categories = {}
    for paper in get_past_papers():
        name = paper["path"].split("/")[0]
        info = CATEGORY_INFO.get(name, {})
        categories.setdefault(name, {
            "name": name,
            "icon": info.get("icon", "fa-folder-open"),
            "about": info.get("about", "Past exam problems with hints and full solutions."),
            "papers": [],
        })["papers"].append(paper)
    return categories


@problems_bp.route("/note/kind_of_problem")
def kind_of_problem():
    return render_template("problems_list.html", categories=past_categories().values())


@problems_bp.route("/note/kind_of_problem/<path:category>")
def problem(category):
    categories = past_categories()
    if category not in categories:
        return "<h1>Category not found</h1>", 404
    return render_template("problems_list.html", category=categories[category])


@problems_bp.route("/past/<path:past_path>")
def past(past_path):
    papers = get_past_papers()
    if past_path not in [p["path"] for p in papers]:  # also blocks paths like ../
        return "<h1>Paper not found</h1>", 404
    try:
        content = load_past(past_path)
    except NoteNotFound:
        return "<h1>Paper not found</h1>", 404

    name = past_path.split("/")[0]
    siblings = [p for p in papers if p["path"].split("/")[0] == name]
    index = [p["path"] for p in siblings].index(past_path)
    category_url = url_for("problems.problem", category=name)
    # Floating bar: EJU Past Questions · Paper 1 of 2
    location = {
        "course": name, "course_url": category_url,
        "topic": None, "topic_first": None,
        "index": index + 1, "total": len(siblings), "kind": "Paper",
    }
    nav = {}
    for key, i in (("prev", index - 1), ("next", index + 1)):
        nav[key] = {
            "url": url_for("problems.past", past_path=siblings[i]["path"]),
            "title": siblings[i]["title"],
            "where": name,
        } if 0 <= i < len(siblings) else None

    return render_template(
        "practice.html",
        practice_path="past/" + past_path,   # progress key, kept apart from practice sets
        content=content,
        title=siblings[index]["title"],
        count=siblings[index]["count"],
        location=location,
        nav=nav,
        paper={"category": name, "category_url": category_url},
    )


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
