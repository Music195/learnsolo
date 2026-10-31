from flask import Blueprint, render_template, url_for
from utils.content_loader import get_past_papers, load_past, ContentNotFound
from utils.courses import past_category

past_bp = Blueprint("past", __name__)

# Past questions (content/past/<category>/)
# -----------------------------------------
# /past                        all categories, as cards
# /past/<category>             the papers in one category
# /past/<category>/<paper>     one paper, shown like a practice set
# A new folder in content/past/ becomes a new category; its name and
# description go in PAST_CATEGORIES in utils/courses.py.


def past_categories():
    """{folder: {"folder", "name", "icon", "about", "papers": [...]}} in folder order."""
    categories = {}
    for paper in get_past_papers():
        folder = paper["path"].split("/")[0]
        categories.setdefault(folder, dict(past_category(folder), papers=[]))["papers"].append(paper)
    return categories


@past_bp.route("/past")
def index():
    return render_template("past-list.html", categories=past_categories().values())


@past_bp.route("/past/<category>")
def category(category):
    categories = past_categories()
    if category not in categories:
        return "<h1>Category not found</h1>", 404
    return render_template("past-list.html", category=categories[category])


@past_bp.route("/past/<category>/<paper>")
def paper(category, paper):
    past_path = category + "/" + paper
    papers = get_past_papers()
    if past_path not in [p["path"] for p in papers]:  # also blocks paths like ../
        return "<h1>Paper not found</h1>", 404
    try:
        content = load_past(past_path)
    except ContentNotFound:
        return "<h1>Paper not found</h1>", 404

    info = past_category(category)
    siblings = [p for p in papers if p["path"].split("/")[0] == category]
    index = [p["path"] for p in siblings].index(past_path)
    category_url = url_for("past.category", category=category)
    # Floating bar: EJU Past Questions · Paper 1 of 2
    location = {
        "course": info["name"], "course_url": category_url,
        "topic": None, "topic_first": None,
        "index": index + 1, "total": len(siblings), "kind": "Paper",
    }
    nav = {}
    for key, i in (("prev", index - 1), ("next", index + 1)):
        nav[key] = {
            "url": url_for("past.paper", category=category, paper=siblings[i]["path"].split("/", 1)[1]),
            "title": siblings[i]["title"],
            "where": info["name"],
        } if 0 <= i < len(siblings) else None

    return render_template(
        "practice.html",
        practice_path="past/" + past_path,   # progress key, kept apart from practice sets
        content=content,
        title=siblings[index]["title"],
        count=siblings[index]["count"],
        location=location,
        nav=nav,
        paper={"category": info["name"], "category_url": category_url},
    )
