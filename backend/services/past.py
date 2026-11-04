from utils.content_loader import get_past_papers, load_past, ContentNotFound
from utils.courses import past_category, past_group, past_section
from services.urls import past_category_url, past_paper_url

# Data for the past question pages (content/past/<category>/).
#   /past                                all categories, as cards
#   /past/<category>                     the papers in one category
#   /past/<category>/[<group>/]<paper>   one paper, shown like a practice set
# A new folder in content/past/ becomes a new category; its name and
# description go in PAST_CATEGORIES in utils/courses.py.
# A category may be split into subfolders ("groups", e.g. eju/course-1/,
# or 2 tiers e.g. jlpt/n2/vocab/): its list page then shows tabs per group/section,
# and next/previous stay in the same section.


class PaperMoved(Exception):
    """Raised for the old address of a renamed paper. `url` is where it is now."""
    def __init__(self, url):
        super().__init__(url)
        self.url = url


def _group(paper):
    """"course-1" for "eju/course-1/01-mock-paper", "n2" for "jlpt/n2/vocab/01-mock-test"."""
    parts = paper["path"].split("/")
    return parts[1] if len(parts) > 2 else None


def _section(paper):
    """"vocab" for "jlpt/n2/vocab/01-mock-test", None for "eju/course-1/01-mock-paper"."""
    parts = paper["path"].split("/")
    return parts[2] if len(parts) > 3 else None


def _paper_key(paper):
    parts = paper["path"].split("/")
    return tuple(parts[:-1])


def past_categories():
    """{folder: {"folder", "name", "icon", "about", "papers": [...],
    "groups": [{"folder", "name", "papers", "sections": [...]}]}} in folder order.
    "groups" is empty for a category without subfolders."""
    categories = {}
    for paper in get_past_papers():
        folder = paper["path"].split("/")[0]
        cat = categories.setdefault(folder, dict(past_category(folder), papers=[], groups={}))
        cat["papers"].append(paper)
        group = _group(paper)
        section = _section(paper)
        if group:
            g_dict = cat["groups"].setdefault(group, {
                "folder": group,
                "name": past_group(folder, group),
                "papers": [],
                "sections": {},
            })
            g_dict["papers"].append(paper)
            if section:
                s_dict = g_dict["sections"].setdefault(section, {
                    "folder": section,
                    "name": past_section(folder, section),
                    "papers": [],
                })
                s_dict["papers"].append(paper)

    for folder, cat in categories.items():
        cat_info = past_category(folder)
        group_order = list(cat_info.get("groups", {}).keys())
        section_order = list(cat_info.get("sections", {}).keys())

        for g in cat["groups"].values():
            if "sections" in g:
                secs = list(g["sections"].values())
                if section_order:
                    secs.sort(key=lambda s: section_order.index(s["folder"]) if s["folder"] in section_order else 999)
                g["sections"] = secs

        grps = list(cat["groups"].values())
        if group_order:
            grps.sort(key=lambda g: group_order.index(g["folder"]) if g["folder"] in group_order else 999)
        cat["groups"] = grps
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
    section = _section(this)
    this_key = _paper_key(this)
    siblings = [p for p in papers if _paper_key(p) == this_key]
    index = siblings.index(this)
    category_url = past_category_url(category, group)

    where_parts = [info["name"]]
    if group:
        where_parts.append(past_group(category, group))
    if section:
        where_parts.append(past_section(category, section))
    where = " · ".join(where_parts)

    location = {
        "course": info["name"],
        "course_url": past_category_url(category),
        "topic": " · ".join(where_parts[1:]) if len(where_parts) > 1 else None,
        "topic_url": category_url,
        "topic_first": None,
        "index": index + 1,
        "total": len(siblings),
        "kind": "Test" if category == "jlpt" else "Paper",
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
