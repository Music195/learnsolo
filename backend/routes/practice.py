from flask import Blueprint, render_template
from utils.content_loader import ContentNotFound
from services.practice import practice_courses, practice_page

# HTML pages: the practice page (/practice) and one practice set (/practice/<path>).
# The data comes from services/practice.py (shared with the JSON API in api/).

practice_bp = Blueprint("practice", __name__)


@practice_bp.route("/practice")
def index():
    return render_template("practice-list.html", courses=practice_courses())


@practice_bp.route("/practice/<path:practice_path>")
def view_set(practice_path):
    try:
        page = practice_page(practice_path)
    except ContentNotFound:
        return "<h1>Practice set not found</h1>", 404
    return render_template("practice.html", **page)
