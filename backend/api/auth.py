import re

from flask import request
from flask_login import current_user, login_required, login_user, logout_user
from werkzeug.security import check_password_hash, generate_password_hash

from api import api_bp
from extensions import db
from models import User

# Accounts: sign up, log in, log out, and "who is logged in?".
#
# How logging in works:
#   1. The browser sends the email and password once (POST /api/auth/login).
#   2. Flask checks the password and, if it's right, login_user() puts the
#      user's id in a signed cookie (only the server can make a valid one;
#      SECRET_KEY in config.py signs it).
#   3. The browser sends that cookie with every later request, and
#      current_user is that user. logout_user() removes it.
#
# Passwords are never stored. generate_password_hash() turns a password into
# a "hash": a scrambled string it can't be turned back from.
# check_password_hash() scrambles the typed password the same way and
# compares. So even someone who reads the database can't see passwords.

MIN_PASSWORD = 8
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")   # something@something.something

# A hash of a random password, checked when an email doesn't exist, so a
# wrong email takes as long as a wrong password. Otherwise the time taken
# would tell an attacker which emails have accounts.
_DUMMY_HASH = generate_password_hash("not-a-real-password")


def _user_json(user):
    """What the frontend gets to know about a user."""
    return {"email": user.email}


def _read_form():
    """The email and password from the request's JSON body.
    get_json(silent=True) gives None instead of an error for a body that isn't JSON."""
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()    # emails ignore upper/lower case
    password = str(data.get("password", ""))
    return email, password


@api_bp.get("/auth/me")
def api_me():
    """Who is logged in: {"user": {"email": ...}}, or {"user": null}.
    React asks this when the site opens."""
    if current_user.is_authenticated:
        return {"user": _user_json(current_user)}
    return {"user": None}


@api_bp.post("/auth/signup")
def api_signup():
    """Make an account and log in. Body: {"email", "password"}."""
    email, password = _read_form()
    if not EMAIL.match(email) or len(email) > 255:
        return {"error": "Please enter a valid email address."}, 400
    if len(password) < MIN_PASSWORD:
        return {"error": f"The password needs at least {MIN_PASSWORD} characters."}, 400
    if User.query.filter_by(email=email).first():
        # 409 = "conflict": that email is taken
        return {"error": "There is already an account with this email. Log in instead."}, 409

    user = User(email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    # remember=True: stay logged in after the browser is closed
    login_user(user, remember=True)
    return {"user": _user_json(user)}, 201          # 201 = "created"


@api_bp.post("/auth/login")
def api_login():
    """Log in. Body: {"email", "password"}."""
    email, password = _read_form()
    user = User.query.filter_by(email=email).first()
    password_ok = check_password_hash(user.password_hash if user else _DUMMY_HASH, password)
    if not user or not password_ok:
        # The same message for both, so it doesn't tell which emails have accounts.
        # 401 = "not logged in"
        return {"error": "Wrong email or password."}, 401
    login_user(user, remember=True)
    return {"user": _user_json(user)}


@api_bp.post("/auth/logout")
@login_required
def api_logout():
    """Log out: the login cookies are removed."""
    logout_user()
    return {"user": None}
