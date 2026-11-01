from flask import Blueprint, jsonify, request
from utils.content_loader import ContentNotFound

# The JSON API, for the React frontend.
#
# Every address starts with /api (url_prefix below). Each route returns a
# Python dict or list, and Flask turns it into JSON automatically. Open one
# in the browser to see it, e.g. http://localhost:5000/api/home
#
# The data comes from services/, the same functions the HTML pages use.

api_bp = Blueprint("api", __name__, url_prefix="/api")


# Errors as JSON
# --------------
# React reads the status code (404) and the "error" message, so every
# error from the API looks like {"error": "..."} instead of an HTML page.

@api_bp.errorhandler(ContentNotFound)
def content_not_found(error):
    # A route raised ContentNotFound: that note, set or paper doesn't exist
    return {"error": "not found"}, 404


@api_bp.app_errorhandler(404)
def page_not_found(error):
    # An address that matches no route at all, e.g. /api/nothing-here.
    # This handler sees every 404 in the app, so only answer with JSON
    # for /api/ addresses and let the HTML pages keep Flask's usual 404.
    if request.path.startswith("/api/"):
        return jsonify(error="not found"), 404
    return error


# Requests that change something (log in, save progress) only accept a JSON
# body. Together with the SameSite login cookie (config.py), that stops other
# websites from sending them in your name: a browser won't send JSON or the
# cookie to another site without this site agreeing, and it doesn't.

# Load the routes. This import is at the bottom because the route files need
# api_bp, which has to exist first.
from api import content, auth, progress  # noqa: E402,F401
