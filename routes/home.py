from flask import Blueprint, render_template, url_for, jsonify
from utils.content_loader import get_notes_list, get_notes_with_titles, get_practice_sets, get_past_papers
from utils.courses import SUBJECTS, course_name, course_subject, topic_name, past_category

home_bp = Blueprint("home", __name__)


# Home page helpers
# -----------------
# Group the notes into subjects → courses → topics for the home page.
def build_courses(notes_list):
    courses = {}
    for path in notes_list:  # already sorted, so the first note seen is note 01
        parts = path.split("/")
        if len(parts) < 3:
            continue
        course = courses.setdefault(parts[0], {
            "folder": parts[0], "name": course_name(parts[0]),
            "first": path, "count": 0, "topics": {},
        })
        course["count"] += 1
        course["topics"].setdefault(parts[1], {"name": topic_name(parts[1]), "first": path})
    for course in courses.values():
        course["topics"] = list(course["topics"].values())
    return list(courses.values())


def build_subjects(courses):
    subjects = [dict(s, courses=[]) for s in SUBJECTS]
    for course in courses:
        name = course_subject(course["folder"])
        subject = next((s for s in subjects if s["name"] == name), None)
        if subject is None:  # a new subject not listed in SUBJECTS
            subject = {"name": name, "icon": "fa-book", "courses": []}
            subjects.append(subject)
        subject["courses"].append(course)
    for subject in subjects:
        subject["count"] = sum(c["count"] for c in subject["courses"])
    return subjects


# One entry per page for the search box: title, link and "Math I · Quadratic Functions"
def build_search_index():
    index = []
    for note in get_notes_with_titles():
        parts = note["path"].split("/")
        where = " · ".join([course_name(parts[0])] + ([topic_name(parts[1])] if len(parts) > 2 else []))
        index.append({
            "title": note["title"], "where": where,
            "url": url_for("notes.view_note", note_path=note["path"]),
        })
    # Practice sets too, e.g. "Math C · Plane Vectors · Practice"
    for practice in get_practice_sets():
        parts = practice["path"].split("/")
        index.append({
            "title": "Practice: " + practice["title"],
            "where": " · ".join([course_name(parts[0]), topic_name(parts[1]), "Practice"]),
            "url": url_for("practice.view_set", practice_path=practice["path"]),
        })
    # Past questions, e.g. "EJU Past Questions · Past question"
    for paper in get_past_papers():
        category, name = paper["path"].split("/", 1)
        index.append({
            "title": "Past question: " + paper["title"],
            "where": past_category(category)["name"] + " · Past question",
            "url": url_for("past.paper", category=category, paper=name),
        })
    return index


@home_bp.route("/")
def index():
    courses = build_courses(get_notes_list())
    stats = {
        "notes": sum(c["count"] for c in courses),
        "courses": len(courses),
        "topics": sum(len(c["topics"]) for c in courses),
    }
    return render_template("home.html", subjects=build_subjects(courses), stats=stats)


# The search box in the floating bar loads this once, when it is first used,
# so pages don't have to carry the whole list of notes.
@home_bp.route("/search-index.json")
def search_index():
    return jsonify(build_search_index())
