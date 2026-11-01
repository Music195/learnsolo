from flask_login import LoginManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Created here, connected to the app in create_app() (app.py), so models and
# utils can import them without importing the app.
db = SQLAlchemy()
migrate = Migrate()
# Flask-Login remembers who is logged in, with a cookie (api/auth.py)
login_manager = LoginManager()
