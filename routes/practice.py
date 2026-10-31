from flask import Blueprint, render_template, url_for
from utils.content_loader import get_notes_list, get_practice_sets, load_practice, ContentNotFound
from utils.courses import course_name, topic_name

practice_bp = Blueprint("practice", __name__)


# Practice sets (content/practice/<course>/<topic>/, the same folders as the notes)
# --------------------------------------------------------------------------------
# /practice          every course, its topics and their sets (templates/practice-list.html)
# /practice/<path>   one set, shown like a note: floating bar, purple header,
#                    white card. Each problem has a hint, a step-by-step
#                    solution and an answer check (see static/js/practice.js).


def practice_courses():
    """[{"folder", "name", "topics": [{"folder", "name", "notes_first", "count", "sets": [...]}]}]
    in folder order. Topics with no notes are skipped (sets link back to the notes)."""
    notes = get_notes_list()
    courses = {}
    for s in get_practice_sets():
        course, topic = s["path"].split("/")[:2]
        folder = course + "/" + topic
        topic_notes = [n for n in notes if n.startswith(folder + "/")]
        if not topic_notes:
            continue
        c = courses.setdefault(course, {"folder": course, "name": course_name(course), "topics": {}})
        t = c["topics"].setdefault(topic, {
            "folder": folder, "name": topic_name(topic),
            "notes_first": topic_notes[0], "count": 0, "sets": [],
        })
        t["sets"].append(s)
        t["count"] += s["count"]
    return [dict(c, topics=list(c["topics"].values())) for c in courses.values()]


@practice_bp.route("/practice")
def index():
    return render_template("practice-list.html", courses=practice_courses())


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

    # "Where you are" for the floating bar and header: Math C › Plane Vectors · Practice 1 of 5
    location = {
        "course": course_name(parts[0]),
        "course_first": course_notes[0] if course_notes else None,
        "topic": topic_name(parts[1]) if len(parts) > 2 else None,
        "topic_first": topic_notes[0] if topic_notes else None,
        "index": index + 1,
        "total": len(siblings),
        "kind": "Practice",
        "kind_url": url_for("practice.index") + "#" + parts[0],
    }
    # Previous / next set: through the topic, then on to the next topic
    # and the next course (the order of the hub page)
    order = [s for c in practice_courses() for t in c["topics"] for s in t["sets"]]
    order_paths = [s["path"] for s in order]
    at = order_paths.index(practice_path) if practice_path in order_paths else None
    nav = {}
    for key, step in (("prev", -1), ("next", 1)):
        i = at + step if at is not None else -1
        if 0 <= i < len(order):
            other = order[i]["path"].split("/")
            nav[key] = {
                "url": url_for("practice.view_set", practice_path=order[i]["path"]),
                "title": order[i]["title"],
                "review": order[i]["review"],
                "where": course_name(other[0]) + " · " + topic_name(other[1]),
                "new_topic": other[:2] != parts[:2],
            }
        else:
            nav[key] = None

    return render_template(
        "practice.html",
        practice_path=practice_path,
        content=content,
        title=siblings[index]["title"],
        count=siblings[index]["count"],
        review=siblings[index]["review"],
        location=location,
        nav=nav,
    )
