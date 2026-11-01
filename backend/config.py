import os
from dotenv import load_dotenv

# Settings come from environment variables. Locally they are read from the
# .env file in the project root (copy .env.example to make one).
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


def _database_url():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env in the project root "
            "and start PostgreSQL with: docker compose up -d"
        )
    # Hosts like Render give "postgres://..."; SQLAlchemy needs the driver name (psycopg 3)
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


class Config:
    SQLALCHEMY_DATABASE_URI = _database_url()

    # Signs the login cookie, so nobody can make a fake one. Must be long,
    # random and secret (see .env.example).
    SECRET_KEY = os.environ.get("SECRET_KEY")

    # Login cookies: the browser keeps two, "session" and "remember_token"
    # (Flask-Login's "stay logged in", see api/auth.py).
    #   HTTPONLY  page scripts can't read them, so a bad script can't steal them
    #   SAMESITE  "Lax": other websites can't send them along with a form or
    #             fetch to this site, which blocks most cross-site attacks
    #   SECURE    only sent over https. Set SESSION_COOKIE_SECURE=1 on the real
    #             site; it stays off locally because localhost uses plain http.
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE") == "1"
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_SECURE = SESSION_COOKIE_SECURE
