from api import api_bp
from services.home import home_page, build_search_index
from services.notes import note_page, notes_sidebar
from services.practice import practice_courses, practice_page
from services.past import past_categories, past_category_page, past_paper_page, PaperMoved

# Read-only content endpoints: notes, practice sets, past papers, search.
#
# Each one returns the same data its HTML page gets (see services/). Fields
# called "content" hold the HTML of a note, set or paper, for React to show.
# Unknown paths raise ContentNotFound, which api/__init__.py turns into
# {"error": "not found"} with status 404.


# Home and search
# ---------------

@api_bp.get("/home")
def api_home():
    """Subject tabs with their courses and topics, and the counts.
    {"subjects": [{"name", "icon", "count", "courses": [...]}], "stats": {"notes", "courses", "topics"}}"""
    return home_page()


@api_bp.get("/search-index")
def api_search_index():
    """Every note, set and paper: [{"title", "where", "url"}]."""
    return build_search_index()


# Notes
# -----

@api_bp.get("/notes")
def api_notes():
    """Every note with its title, in order, plus display names for the
    course and topic folders: what the Topics sidebar needs.
    {"notes_meta": [{"path", "title"}], "folders": [...], "display_names": {"courses", "topics"}}"""
    return notes_sidebar()


@api_bp.get("/notes/<path:note_path>")
def api_note(note_path):
    """One note: {"note_path", "note_title", "content", "location", "nav", "practice"}."""
    return note_page(note_path)


# Practice sets
# -------------

@api_bp.get("/practice")
def api_practice():
    """Courses → topics → sets, as on the practice page: {"courses": [...]}."""
    return {"courses": practice_courses()}


@api_bp.get("/practice/<path:practice_path>")
def api_practice_set(practice_path):
    """One set: {"practice_path", "title", "count", "review", "content", "location", "nav"}."""
    return practice_page(practice_path)


# Past papers
# -----------

@api_bp.get("/past")
def api_past():
    """Every category with its papers: {"categories": [...]}."""
    return {"categories": list(past_categories().values())}


@api_bp.get("/past/<category>")
def api_past_category(category):
    """One category: {"folder", "name", "icon", "about", "papers", "groups"}."""
    return past_category_page(category)


@api_bp.get("/past/<category>/<path:paper>")
def api_past_paper(category, paper):
    """One paper: {"practice_path", "title", "count", "content", "location", "nav", "paper"}.
    For the old address of a renamed paper: 404 with {"moved_to": "/past/..."},
    so React can switch to the new address."""
    try:
        return past_paper_page(category, paper)
    except PaperMoved as moved:
        return {"error": "moved", "moved_to": moved.url}, 404
