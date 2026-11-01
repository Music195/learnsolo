from flask import Flask
from config import Config
from extensions import db, migrate
import models  # noqa: F401  (so Flask-Migrate sees the tables)
from routes.home import home_bp
from routes.notes import notes_bp
from routes.practice import practice_bp
from routes.past import past_bp
from api import api_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Database (models.py); `flask db ...` commands come from Flask-Migrate
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(home_bp)       # home page and search
    app.register_blueprint(notes_bp)      # /notes/... and the PDF viewer
    app.register_blueprint(practice_bp)   # /practice/...
    app.register_blueprint(past_bp)       # /past/...
    app.register_blueprint(api_bp)        # /api/... JSON for the React frontend (api/)

    # flask import-content: copy content/ into the database (importer.py)
    @app.cli.command("import-content")
    def import_content_command():
        """Copy every note, practice set and past paper from content/ into the database."""
        from importer import import_content
        for table, counts in import_content().items():
            print(f"{table:13} {counts['added']:4} added {counts['updated']:4} updated {counts['removed']:4} removed")

    return app

app = create_app()

if __name__ == "__main__":
    # Local development only. In production, run with: gunicorn app:app
    # Debug is off unless FLASK_DEBUG=1 is set, so it can't leak to a public server.
    import os
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
    
# STEP 2: Lazy loading + cache (Google Drive)
# STEP 3: PDF proxy security
# STEP 4: Error normalization
# STEP 5: Navigation cleanup
# STEP 6: Cache invalidation for notes (make caching safe)