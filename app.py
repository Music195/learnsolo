from flask import Flask
from routes.notes import notes_bp
from routes.problems import problems_bp
# from utils.note_loader import *
# from utils.google_drive import *

def create_app():
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(notes_bp)
    app.register_blueprint(problems_bp)
    
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