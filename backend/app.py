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
