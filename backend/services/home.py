from utils.content_loader import get_notes_list, get_notes_with_titles, get_practice_sets, get_past_papers
from utils.courses import SUBJECTS, course_name, course_subject, topic_name, past_category, past_group
from services.urls import note_url, practice_url, past_paper_url

# Data for the home page and the search box.


# Group the notes into subjects → courses → topics for the home page.
def build_courses(notes_list):
    """One dict per course folder:
    {"folder": "math-1", "name": "Math I", "first": <its first note>, "count": <notes>,
     "topics": [{"name": "Quadratic Functions", "first": <the topic's first note>}, ...]}"""
    courses = {}
    for path in notes_list:  # already sorted, so the first note seen is note 01
        parts = path.split("/")          # ["math-1", "03-quadratic-functions", "05-quadratic-formula"]
        if len(parts) < 3:
            continue                     # a note outside a topic folder isn't listed on the home page
        # setdefault: get the course if we've seen it, otherwise add it first
        course = courses.setdefault(parts[0], {
            "folder": parts[0], "name": course_name(parts[0]),
            "first": path, "count": 0, "topics": {},
        })
        course["count"] += 1
        course["topics"].setdefault(parts[1], {"name": topic_name(parts[1]), "first": path})
    # topics were a dict (to find them quickly); the page only needs the list
    for course in courses.values():
        course["topics"] = list(course["topics"].values())
    return list(courses.values())


def build_subjects(courses):
    """Put the courses under their subject tab (SUBJECTS in utils/courses.py)."""
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


def home_page():
    """Everything the home page shows: the subject tabs and the counts at the top."""
    courses = build_courses(get_notes_list())
    stats = {
        "notes": sum(c["count"] for c in courses),
        "courses": len(courses),
        "topics": sum(len(c["topics"]) for c in courses),
    }
    return {"subjects": build_subjects(courses), "stats": stats}


def build_search_index():
    """One entry per page for the search box:
    {"title": "Quadratic Formula", "where": "Math I · Quadratic Functions", "url": "/notes/..."}"""
    index = []
    for note in get_notes_with_titles():
        parts = note["path"].split("/")
        where = " · ".join([course_name(parts[0])] + ([topic_name(parts[1])] if len(parts) > 2 else []))
        index.append({"title": note["title"], "where": where, "url": note_url(note["path"])})
    # Practice sets too, e.g. "Math C · Plane Vectors · Practice"
    for practice in get_practice_sets():
        parts = practice["path"].split("/")
        index.append({
            "title": "Practice: " + practice["title"],
            "where": " · ".join([course_name(parts[0]), topic_name(parts[1]), "Practice"]),
            "url": practice_url(practice["path"]),
        })
    # Past questions, e.g. "EJU Mock Papers · Course 1 (Basic) · Past question"
    for paper in get_past_papers():
        category, name = paper["path"].split("/", 1)
        group = [past_group(category, name.split("/")[0])] if "/" in name else []
        index.append({
            "title": "Past question: " + paper["title"],
            "where": " · ".join([past_category(category)["name"]] + group + ["Past question"]),
            "url": past_paper_url(paper["path"]),
        })
    return index
