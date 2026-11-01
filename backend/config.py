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
    SECRET_KEY = os.environ.get("SECRET_KEY")
