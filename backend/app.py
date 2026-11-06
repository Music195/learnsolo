from flask import Flask
from config import Config
from extensions import db, login_manager, migrate
import models  # noqa: F401  (so Flask-Migrate sees the tables)
from api import api_bp
from frontend import frontend_bp

# The whole site is two parts:
#   /api/...         JSON: notes, practice, accounts, progress (api/)
#   everything else  the React app, built into frontend/dist (frontend.py)


def create_app():
    # static_folder=None: Flask's own /static/ folder is turned off.
    # /static/... files now come from the React build (frontend.py).
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    # Database (models.py); `flask db ...` commands come from Flask-Migrate
    db.init_app(app)
    migrate.init_app(app, db)

    # Logins (api/auth.py): Flask-Login reads the user id from the login
    # cookie and asks load_user() for that user, on every request.
    if not app.config["SECRET_KEY"]:
        raise RuntimeError("SECRET_KEY is not set: add a long random one to .env (see .env.example)")
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(models.User, int(user_id))

    # A route marked @login_required, visited without logging in: answer in
    # JSON, as the rest of the API does, instead of redirecting to a login page.
    @login_manager.unauthorized_handler
    def unauthorized():
        return {"error": "login required"}, 401

    # Register blueprints (groups of routes)
    app.register_blueprint(api_bp)        # /api/...: JSON (api/)
    app.register_blueprint(frontend_bp)   # every other address: the React app (frontend.py)

    # flask import-content: copy content/ into the database (importer.py)
    @app.cli.command("import-content")
    def import_content_command():
        """Copy every note, practice set, past paper and dictionary entry from content/ into the database."""
        from importer import import_content
        for table, counts in import_content().items():
            print(f"{table:14} {counts['added']:4} added {counts['updated']:4} updated {counts['removed']:4} removed")

    # flask import-dictionary: copy content/dictionary.json into the database
    @app.cli.command("import-dictionary")
    def import_dictionary_command():
        """Import curated terms from content/dictionary.json into the database."""
        from importer import sync_dictionary
        from models import DictionaryEntry
        report = {}
        sync_dictionary(report)
        db.session.commit()
        counts = report.get("dictionary", {"added": 0, "updated": 0, "removed": 0})
        total = DictionaryEntry.query.count()
        print(f"Dictionary imported successfully: {counts['added']} added, {counts['updated']} updated, {counts['removed']} removed (total in DB: {total}).")

    # flask list-dictionary: show all dictionary entries in the database
    @app.cli.command("list-dictionary")
    def list_dictionary_command():
        """List all dictionary words stored in the database."""
        from models import DictionaryEntry
        entries = DictionaryEntry.query.order_by(DictionaryEntry.word).all()
        print(f"\n--- Total dictionary entries in DB: {len(entries)} ---")
        for e in entries:
            source_tag = f"[{e.source}]"
            reading = f" ({e.reading})" if e.reading else ""
            notes = f" — {e.notes}" if e.notes else ""
            print(f"• {e.word:<14} | EN: {e.english} | MY: {e.burmese} | JA: {e.japanese}{reading}{notes} {source_tag}")
        print()

    # flask add-word: add or update an entry from command line
    import click

    @app.cli.command("add-word")
    @click.option("--word", required=True, help="Unique lookup keyword (e.g. 'wavelength')")
    @click.option("--en", "english", required=True, help="English meaning / word")
    @click.option("--my", "burmese", required=True, help="Burmese translation (Unicode)")
    @click.option("--ja", "japanese", required=True, help="Japanese translation (Kanji/Kana)")
    @click.option("--reading", default="", help="Japanese reading (Hiragana/Romaji)")
    @click.option("--notes", default="", help="Context, subject, or part of speech")
    def add_word_command(word, english, burmese, japanese, reading, notes):
        """Add or update a word's meaning in the database."""
        from models import DictionaryEntry
        key = word.lower().strip()
        existing = DictionaryEntry.query.filter_by(word=key).first()
        if existing:
            existing.english = english
            existing.burmese = burmese
            existing.japanese = japanese
            existing.reading = reading
            existing.notes = notes
            existing.source = "curated"
            action = "Updated"
        else:
            entry = DictionaryEntry(
                word=key,
                source_lang="en",
                english=english,
                burmese=burmese,
                japanese=japanese,
                reading=reading,
                notes=notes,
                source="curated",
            )
            db.session.add(entry)
            action = "Added"
        db.session.commit()
        print(f"✓ {action} word '{key}' successfully in the database!")

    return app

app = create_app()

if __name__ == "__main__":
    # Local development only. In production, run with: gunicorn app:app
    # Debug is off unless FLASK_DEBUG=1 is set, so it can't leak to a public server.
    import os
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
