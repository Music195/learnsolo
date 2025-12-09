from flask import Blueprint, render_template, request, Response, redirect
from utils.note_loader import get_notes_list, load_note_content, get_folders_and_subfolders
import requests
import os
import re

notes_bp = Blueprint("notes", __name__)

@notes_bp.route("/")
def index():
    notes_list = get_notes_list()
    functions = [
        {"name": "View Formlae", "value": "view_note", "route": "/note/"},
        {"name": "Math Problem Solving", "value": "kind_of_problem", "route": "/note/"},
        {"name": "HIDE Channel", "value": "https://hide-channel.studio.site/", "route": "external"},
        {"name": "Future Projects(Comming Soon)", "value": "", "route": "disabled"}
    ]
    return render_template("index.html", notes_list=notes_list, functions=functions)

@notes_bp.route("/note/<path:note_path>")
def view_note(note_path):
    notes_list = get_notes_list()
    folders, subfolders = get_folders_and_subfolders(notes_list)

    if note_path not in notes_list:
        return "<h1>Note not found</h1>", 404

    index = notes_list.index(note_path)
    prev_note = notes_list[index-1] if index > 0 else None
    next_note = notes_list[index+1] if index < len(notes_list)-1 else None

    content = load_note_content(note_path)
    if isinstance(content, tuple):
        return content  # returns (error_html, 404)

    # Extract title
    title_match = re.search(r'<div class="fancy-title"[^>]*>([^<]+)</div>', content)
    note_title = title_match.group(1) if title_match else "📚 View By Topics"

    return render_template(
        "note.html",
        note_path=note_path,
        notes_list=notes_list,
        prev_note=prev_note,
        next_note=next_note,
        content=content,
        notes_json=str(notes_list),
        folders=folders,
        subfolders=subfolders,
        note_title=note_title
    )

@notes_bp.route("/proxy-pdf")
def proxy_pdf():
    from utils.google_drive import fetch_pdf
    return fetch_pdf()
