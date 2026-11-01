from flask import Blueprint, redirect, render_template
from utils.content_loader import ContentNotFound
from services.past import past_categories, past_category_page, past_paper_page, paper_url, PaperMoved

# HTML pages: past questions (/past, /past/<category>, /past/<category>/<paper>).
# The data comes from services/past.py (shared with the JSON API in api/).

past_bp = Blueprint("past", __name__)


@past_bp.route("/past")
def index():
    return render_template("past-list.html", categories=past_categories().values())


@past_bp.route("/past/<category>")
def category(category):
    try:
        data = past_category_page(category)
    except ContentNotFound:
        return "<h1>Category not found</h1>", 404
    return render_template("past-list.html", category=data, paper_url=paper_url)


@past_bp.route("/past/<category>/<path:paper>")
def paper(category, paper):
    try:
        page = past_paper_page(category, paper)
    except PaperMoved as moved:
        return redirect(moved.url, 301)        # 301 = "moved permanently"
    except ContentNotFound:
        return "<h1>Paper not found</h1>", 404
    return render_template("practice.html", **page)
