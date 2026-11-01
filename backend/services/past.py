from utils.content_loader import get_past_papers, load_past, ContentNotFound
from utils.courses import past_category, past_group
from services.urls import past_category_url, past_paper_url

# Data for the past question pages (content/past/<category>/).
#   /past                                all categories, as cards
#   /past/<category>                     the papers in one category
#   /past/<category>/[<group>/]<paper>   one paper, shown like a practice set
# A new folder in content/past/ becomes a new category; its name and
# description go in PAST_CATEGORIES in utils/courses.py.
# A category may be split into subfolders ("groups", e.g. eju/course-1/):
# its list page then has one tab per group, and next/previous stay in the group.


class PaperMoved(Exception):
    """Raised for the old address of a renamed paper. `url` is where it is now."""
    def __init__(self, url):
        super().__init__(url)
        self.url = url


def _group(paper):
    """"course-1" for "eju/course-1/01-mock-paper", None for "eju/01-paper"."""
    parts = paper["path"].split("/")
    return parts[1] if len(parts) > 2 else None


def past_categories():
    """{folder: {"folder", "name", "icon", "about", "papers": [...],
    "groups": [{"folder", "name", "papers"}]}} in folder order.
    "groups" is empty for a category without subfolders."""
    categories = {}
    for paper in get_past_papers():
        folder = paper["path"].split("/")[0]
        cat = categories.setdefault(folder, dict(past_category(folder), papers=[], groups={}))
        cat["papers"].append(paper)
        group = _group(paper)
        if group:
            cat["groups"].setdefault(group, {"folder": group, "name": past_group(folder, group), "papers": []})
            cat["groups"][group]["papers"].append(paper)
    for cat in categories.values():
        cat["groups"] = list(cat["groups"].values())
    return categories


def paper_url(paper):
    return past_paper_url(paper["path"])


def past_category_page(category):
    """One category with its papers. Raises ContentNotFound for an unknown category."""
    categories = past_categories()
    if category not in categories:
        raise ContentNotFound(category)
    return categories[category]


def past_paper_page(category, paper):
    """Everything one past paper page shows.
    Raises PaperMoved for an old address, ContentNotFound for an unknown one."""
    past_path = category + "/" + paper
    papers = get_past_papers()
    if past_path not in [p["path"] for p in papers]:  # also blocks paths like ../
        # A renamed paper lists its old paths in data-moved-from: send old links there
        moved = next((p for p in papers if "past/" + past_path in (p["moved_from"] or "").split("|")), None)
        if moved:
            raise PaperMoved(paper_url(moved))
        raise ContentNotFound(past_path)
    content = load_past(past_path)

    info = past_category(category)
    this = next(p for p in papers if p["path"] == past_path)
    group = _group(this)
    # Papers in the same category and group, e.g. EJU Course 1
    siblings = [p for p in papers if p["path"].split("/")[0] == category and _group(p) == group]
    index = siblings.index(this)
    category_url = past_category_url(category, group)
    where = info["name"] + (" · " + past_group(category, group) if group else "")
    # Floating bar: EJU Mock Papers › Course 1 (Basic) · Paper 3 of 10
    location = {
        "course": info["name"], "course_url": past_category_url(category),
        "topic": past_group(category, group) if group else None, "topic_url": category_url,
        "topic_first": None,
        "index": index + 1, "total": len(siblings), "kind": "Paper",
    }
    nav = {}
    for key, i in (("prev", index - 1), ("next", index + 1)):
        nav[key] = {
            "url": paper_url(siblings[i]), "title": siblings[i]["title"], "where": where,
        } if 0 <= i < len(siblings) else None

    return {
        "practice_path": "past/" + past_path,   # progress key, kept apart from practice sets
        "content": content,                     # the paper's HTML
        "title": this["title"],
        "count": this["count"],
        "location": location,
        "nav": nav,
        "paper": {"category": where, "category_url": category_url},
    }
