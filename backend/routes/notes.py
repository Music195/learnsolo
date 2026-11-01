from flask import Blueprint, render_template, request
from utils.content_loader import ContentNotFound
from services.notes import note_page, notes_sidebar

# HTML pages: one note (/notes/<path>), and the older Google Drive PDF viewer.
# The data comes from services/notes.py (shared with the JSON API in api/).

notes_bp = Blueprint("notes", __name__)


# <path:note_path> takes the rest of the address, slashes included,
# e.g. "math-1/03-quadratic-functions/05-quadratic-formula"
@notes_bp.route("/notes/<path:note_path>")
def view_note(note_path):
    try:
        page = note_page(note_path)
    except ContentNotFound:
        return "<h1>Note not found</h1>", 404
    return render_template("note.html", **page, **notes_sidebar(), show_topics=True)


# PDF viewer (for PDFs on Google Drive)
# -------------------------------------
@notes_bp.route("/proxy-pdf")
def proxy_pdf():
    from utils.google_drive import fetch_pdf
    return fetch_pdf()


@notes_bp.route("/viewer")
def viewer():
    """
    Renders the PDF viewer page. It does not stream the PDF itself:
    it passes the PDF URL to the template, which loads it through /proxy-pdf.
    """
    pdf_url = request.args.get("file")

    if not pdf_url:
        return "<h1>No PDF specified</h1>", 400

    return render_template("pdf-viewer.html", file_url=pdf_url)
