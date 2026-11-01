from datetime import datetime, timezone

from flask_login import UserMixin

from extensions import db

# The database tables.
#
# Content (courses, topics, notes, problem sets) is copied in from content/
# by `flask import-content` (importer.py); the HTML files stay the place
# where notes are written. Rows are matched by their path, the same path
# used in URLs, e.g. "math-1/03-quadratic-functions/05-quadratic-formula".
#
# "position" keeps the order of the sorted file paths (the number prefixes),
# so lists don't depend on how PostgreSQL sorts text.
#
# After changing a model: flask db migrate -m "what changed" && flask db upgrade


class Course(db.Model):
    __tablename__ = "courses"
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(100), unique=True, nullable=False)   # folder, e.g. "math-1"
    name = db.Column(db.String(200), nullable=False)                # "Math I"
    subject = db.Column(db.String(100), nullable=False)             # "Mathematics"
    position = db.Column(db.Integer, nullable=False)
    topics = db.relationship("Topic", back_populates="course", order_by="Topic.position")


class Topic(db.Model):
    __tablename__ = "topics"
    __table_args__ = (db.UniqueConstraint("course_id", "slug"),)
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    slug = db.Column(db.String(200), nullable=False)                # "03-quadratic-functions"
    name = db.Column(db.String(200), nullable=False)                # "Quadratic Functions"
    position = db.Column(db.Integer, nullable=False)
    course = db.relationship("Course", back_populates="topics")
    notes = db.relationship("Note", back_populates="topic", order_by="Note.position")


class Note(db.Model):
    __tablename__ = "notes"
    id = db.Column(db.Integer, primary_key=True)
    path = db.Column(db.String(300), unique=True, nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey("topics.id"))    # empty for a note outside a topic folder
    title = db.Column(db.String(300), nullable=False)
    html = db.Column(db.Text, nullable=False)
    position = db.Column(db.Integer, nullable=False)
    topic = db.relationship("Topic", back_populates="notes")


class ProblemSet(db.Model):
    """A practice set (kind "practice") or a past paper (kind "past").
    The columns are the fields the loader used to read from each file."""
    __tablename__ = "problem_sets"
    __table_args__ = (db.UniqueConstraint("kind", "path"),)
    id = db.Column(db.Integer, primary_key=True)
    kind = db.Column(db.String(20), nullable=False)
    path = db.Column(db.String(300), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    intro = db.Column(db.Text, nullable=False, default="")          # first sentence of the intro
    html = db.Column(db.Text, nullable=False)
    count = db.Column(db.Integer, nullable=False, default=0)        # number of problems
    covers = db.Column(db.String(200))                              # "01–05" (concept sets)
    moved_from = db.Column(db.String(500))                          # "old|older" earlier paths
    is_review = db.Column(db.Boolean, nullable=False, default=False)
    labels = db.Column(db.JSON, nullable=False, default=list)       # past papers: what each problem practises
    note_paths = db.Column(db.JSON, nullable=False, default=list)   # notes its problems link to
    position = db.Column(db.Integer, nullable=False)


# Accounts and progress: used by api/auth.py and api/progress.py.

class User(UserMixin, db.Model):
    """An account. UserMixin adds what Flask-Login needs (get_id, is_authenticated...).
    The password itself is never stored, only a hash of it (api/auth.py)."""
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc))


class Progress(db.Model):
    """One problem set's progress for one user: the same JSON map the browser
    keeps in localStorage today ({"0": "solved", "2": "review"})."""
    __tablename__ = "progress"
    __table_args__ = (db.UniqueConstraint("user_id", "set_path"),)
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    set_path = db.Column(db.String(310), nullable=False)            # "math-1/...", or "past/eju/..." for papers
    data = db.Column(db.JSON, nullable=False, default=dict)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False,
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
