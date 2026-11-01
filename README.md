# LearnSolo (learningNoteByMin)

An interactive, Flask-based educational web application designed for organizing, managing, and presenting digital learning notes. 

This project is built to act as a personal study companion, helping users structure their learning process and access their study materials through a clean, intuitive web interface.

---

## 🚀 Project Overview

* **Educational Focus:** Designed specifically to facilitate self-directed study and note organization.
* **Architecture:** Built using a lightweight **Flask** (Python) backend to handle routing, application logic, and data management.
* **Frontend:** Uses clean **HTML templates** and modern styling to create a responsive, user-friendly reader and organizer interface.
* **Status:** Under active development as I continue to implement new interactive learning features.

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask
* **Frontend:** React (Vite, React Router), moving over from Flask HTML templates page by page
* **Database:** PostgreSQL via SQLAlchemy (Flask-SQLAlchemy, Flask-Migrate). Notes are written as HTML files in `content/` and imported with `flask import-content`.

---

## 📂 Project Structure (Conceptual)

```text
├── backend/                # The Flask app (run it from here)
│   ├── app.py              #   Creates the Flask app and registers the routes
│   ├── config.py           #   Settings from .env (DATABASE_URL, SECRET_KEY)
│   ├── models.py           #   Database tables (SQLAlchemy); migrations/ holds their history
│   ├── importer.py         #   flask import-content: copies content/ into the database
│   ├── routes/             #   HTML pages: home.py, notes.py, practice.py, past.py
│   ├── api/                #   JSON API under /api, for the React frontend
│   ├── services/           #   The data behind each page, shared by routes/ and api/
│   ├── tests/              #   Automatic tests (pytest)
│   ├── utils/              #   content_loader.py (reads the database), courses.py (display names)
│   ├── templates/          #   Page templates (partials/ holds shared pieces)
│   ├── static/             #   css/, js/ (js/demos/ holds the demo helpers)
│   └── requirements.txt    #   Python packages
├── frontend/               # The React app (Vite), replacing the HTML pages one by one
│   ├── index.html          #   The one page React draws into
│   └── src/                #   main.jsx (start), App.jsx (which page for which address),
│                           #   api.js, pages/, components/
├── content/                # All learning material, as HTML fragments
│   ├── notes/              #   notes/<course>/<topic>/<nn-name>.html
│   ├── practice/           #   practice sets, same course/topic folders as notes/
│   └── past/               #   past question papers by exam (eju/, university/)
├── docker-compose.yml      # Local PostgreSQL (docker compose up -d)
├── .env.example            # Copy to .env: DATABASE_URL, SECRET_KEY
├── docs/content-guide.md   # How the project fits together, and how to write notes, practice sets and past papers
└── README.md               # Project documentation

---

## ▶️ Running locally

```bash
python -m venv venv && source venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env          # then edit SECRET_KEY
docker compose up -d          # PostgreSQL
cd backend
flask db upgrade              # create the tables
flask import-content          # copy content/ into the database (again after editing content)
python app.py                 # http://localhost:5000 (JSON API: /api/home, /api/notes/...)
```

Then, in a second terminal, the React app (needs Node.js):

```bash
cd frontend
npm install                   # once, and after package.json changes
npm run dev                   # http://localhost:5173 (keep Flask running: React gets its data from it)
```

Pages not in React yet open on the Flask site (:5000).

Run the tests from `backend/` (they use a separate `learnsolo_test` database):

```bash
pip install -r requirements-dev.txt   # once
pytest
```
