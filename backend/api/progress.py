from flask import request
from flask_login import current_user, login_required

from api import api_bp
from extensions import db
from models import Progress

# Practice progress saved to the logged-in user's account.
#
# One row per problem set (or past paper) per user. Its "data" is the same
# JSON map the browser keeps without an account:
#   problem number (from 0, as text) → "solved" or "review", e.g. {"0": "solved", "2": "review"}
# set_path is the same key too: "math-1/03-.../01-..." for a practice set,
# "past/eju/course-1/03-mock-paper" for a past paper.
#
# @login_required: only for logged-in users. Without the login cookie the
# answer is 401 {"error": "login required"} (see app.py), and every query
# here only touches current_user's own rows.

STATES = {"solved", "review"}


def _clean(data):
    """Check that data looks like {"0": "solved", ...}; return it, or None if not."""
    if not isinstance(data, dict) or len(data) > 200:
        return None
    for key, value in data.items():
        if not (isinstance(key, str) and key.isdigit() and value in STATES):
            return None
    return data


def _valid_path(path):
    return 0 < len(path) <= 310 and ".." not in path


def _all_progress():
    """{set_path: data} for every set the user has progress in."""
    rows = Progress.query.filter_by(user_id=current_user.id).all()
    return {row.set_path: row.data for row in rows}


def _save(set_path, data):
    """Insert or update one set's progress (call db.session.commit() after)."""
    row = Progress.query.filter_by(user_id=current_user.id, set_path=set_path).first()
    if row is None:
        db.session.add(Progress(user_id=current_user.id, set_path=set_path, data=data))
    else:
        row.data = data


@api_bp.get("/progress")
@login_required
def api_progress():
    """All of the user's progress: {"progress": {set_path: data}}."""
    return {"progress": _all_progress()}


@api_bp.put("/progress/<path:set_path>")
@login_required
def api_save_progress(set_path):
    """Save one set's progress. Body: the data, e.g. {"0": "solved"}.
    {} is fine too ("Start again" clears everything)."""
    data = _clean(request.get_json(silent=True))
    if data is None or not _valid_path(set_path):
        return {"error": 'Expected progress like {"0": "solved", "2": "review"}.'}, 400
    _save(set_path, data)
    db.session.commit()
    return {"set_path": set_path, "data": data}


@api_bp.delete("/progress/<path:set_path>")
@login_required
def api_delete_progress(set_path):
    """Forget one set's progress (used when a renamed set's progress moves
    to its new path)."""
    Progress.query.filter_by(user_id=current_user.id, set_path=set_path).delete()
    db.session.commit()
    return {"deleted": set_path}


@api_bp.post("/progress/merge")
@login_required
def api_merge_progress():
    """Add progress saved in a browser to the account, the first time the
    user logs in there. Body: {"progress": {set_path: data}}.

    Where a set has progress in both places, they are combined problem by
    problem: "solved" in either place wins, then "review". Nothing already
    in the account is lost. Returns all of the user's progress afterwards."""
    incoming = (request.get_json(silent=True) or {}).get("progress")
    if not isinstance(incoming, dict) or len(incoming) > 1000:
        return {"error": 'Expected {"progress": {set_path: data}}.'}, 400

    saved = _all_progress()
    for set_path, data in incoming.items():
        data = _clean(data)
        if data is None or not _valid_path(set_path):
            continue                      # skip anything that doesn't look right
        merged = dict(saved.get(set_path, {}))
        for problem, state in data.items():
            if merged.get(problem) != "solved":     # never turn "solved" back into "review"
                merged[problem] = state
        if merged != saved.get(set_path):
            _save(set_path, merged)
            saved[set_path] = merged
    db.session.commit()
    return {"progress": saved}
