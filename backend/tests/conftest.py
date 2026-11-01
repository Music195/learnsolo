import os

import pytest
from sqlalchemy import create_engine, text

# conftest.py is read by pytest before the tests. The "fixtures" here are
# things tests can ask for by naming them as an argument, for example
#     def test_home(client): ...
# gets a test client without building one itself.

# The tests use their own database, so they never change your real data.
# Change it with the TEST_DATABASE_URL environment variable if you need to.
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://learnsolo:learnsolo@localhost:5432/learnsolo_test",
)

# The app reads DATABASE_URL when it is imported (config.py), so set it
# before importing anything from the app. Environment variables win over
# the .env file, so this one is used.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
# Logins need a secret key to sign their cookie; any value will do in tests
os.environ.setdefault("SECRET_KEY", "test-secret-key")


def _create_test_database():
    """Create the learnsolo_test database the first time (PostgreSQL
    has no "CREATE DATABASE IF NOT EXISTS", so check first)."""
    base, name = TEST_DATABASE_URL.rsplit("/", 1)
    # Connect to the default "postgres" database to create another one;
    # AUTOCOMMIT because CREATE DATABASE can't run inside a transaction.
    engine = create_engine(base + "/postgres", isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        exists = conn.scalar(text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": name})
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{name}"'))
    engine.dispose()


# scope="session": built once for the whole test run, not once per test,
# because importing all the content takes a moment.
@pytest.fixture(scope="session")
def app():
    _create_test_database()

    from app import create_app
    from extensions import db
    from importer import import_content

    app = create_app()
    app.config["TESTING"] = True          # errors show up in the test instead of a 500 page

    # An "app context" lets code outside a request use the database. Only
    # keep it open while setting up: Flask-Login remembers the logged-in user
    # in it (flask.g), so an open one would let one test's login leak into
    # the next. Each request gets its own context instead; a test that reads
    # the database itself opens one with `with app.app_context():`.
    with app.app_context():
        db.drop_all()                     # start from empty tables each run
        db.create_all()                   # make the tables from models.py
        import_content()                  # fill them from content/
        db.session.remove()
    yield app                             # the tests run here


@pytest.fixture()
def client(app):
    """A fake browser: client.get("/api/home") calls the app without a server."""
    return app.test_client()
