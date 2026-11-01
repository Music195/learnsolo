from flask import Blueprint, render_template, jsonify
from services.home import home_page, build_search_index

# HTML pages: the home page, and the search list the floating bar loads.
# The data comes from services/home.py (shared with the JSON API in api/).

# A Blueprint is a group of routes. app.py registers it with the app.
home_bp = Blueprint("home", __name__)


@home_bp.route("/")
def index():
    # home_page() returns {"subjects": ..., "stats": ...}; ** passes them
    # to the template as subjects=... and stats=...
    return render_template("home.html", **home_page())


# The search box in the floating bar loads this once, when it is first used,
# so pages don't have to carry the whole list of notes.
@home_bp.route("/search-index.json")
def search_index():
    return jsonify(build_search_index())
