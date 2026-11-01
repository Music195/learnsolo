import os

from flask import Blueprint, abort, current_app, send_from_directory
from werkzeug.security import safe_join

# Serving the React app.
#
# `npm run build` (in frontend/) turns the React code into plain files in
# frontend/dist/:
#   index.html            the one HTML page
#   assets/index-1a2b3c.js, assets/index-4d5e6f.css
#                         all the JavaScript and CSS, with a "hash" in the
#                         name that changes whenever the file's content does
#   static/...            copied as they are from frontend/public/
#                         (favicon, and the demo helpers notes load by address)
#
# Flask sends those files. Every other address (/notes/..., /practice, ...)
# gets index.html, and React Router (frontend/src/App.jsx) shows the page
# for it. That's why opening or refreshing any page works. /api/... is
# never sent here: those routes are in api/ and are matched first.
#
# While developing you don't need this: `npm run dev` serves the React app
# on :5173 itself, and only asks Flask for /api/...

frontend_bp = Blueprint("frontend", __name__)

# A week, in seconds. Files in assets/ can be kept that long by the browser:
# a new build gives them new names, so an old copy is never used by mistake.
ONE_WEEK = 7 * 24 * 60 * 60


@frontend_bp.get("/", defaults={"path": ""})
@frontend_bp.get("/<path:path>")
def react_app(path):
    dist = current_app.config["FRONTEND_DIST"]

    # A /api/ address that matched no API route: a JSON 404 (api/__init__.py),
    # not the React page
    if path.startswith("api/"):
        abort(404)

    # A real file in dist/, e.g. assets/index-1a2b3c.js or static/favicon.png?
    # safe_join refuses tricks like "../../.env" that would leave dist/.
    file = safe_join(dist, path) if path else None
    if file and os.path.isfile(file):
        max_age = ONE_WEEK if path.startswith("assets/") else 0
        return send_from_directory(dist, path, max_age=max_age)

    # Any other address: the React page
    if not os.path.isfile(os.path.join(dist, "index.html")):
        return (
            "The React app hasn't been built. Run `npm run build` in frontend/, "
            "or open the dev server (npm run dev) at http://localhost:5173",
            503,   # 503 = "not available right now"
        )
    # max_age=0: the browser checks for a new index.html every time, so it
    # always loads the latest assets after a deploy
    return send_from_directory(dist, "index.html", max_age=0)
